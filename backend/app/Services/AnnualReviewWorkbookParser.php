<?php

namespace App\Services;

use RuntimeException;
use ZipArchive;

class AnnualReviewWorkbookParser
{
    public const SHEET = 'SUMMARY 1st & 2nd';
    public const RATINGS = ['outstanding'=>'Outstanding','very satisfactory'=>'Very Satisfactory','satisfactory'=>'Satisfactory','fair'=>'Fair','poor'=>'Poor'];
    public const MAX_BYTES = 10 * 1024 * 1024;

    public function parse(string $path, string $filename, array $requiredYears): array
    {
        if (strtolower(pathinfo($filename, PATHINFO_EXTENSION)) !== 'xlsx') throw new RuntimeException('INVALID_FILE_TYPE: Only .xlsx annual-review workbooks are accepted.');
        if (!is_file($path) || filesize($path) > self::MAX_BYTES) throw new RuntimeException('INVALID_FILE_SIZE: Workbook is missing or exceeds 10 MB.');
        $mime=(new \finfo(FILEINFO_MIME_TYPE))->file($path);
        if (!in_array($mime,['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/zip','application/octet-stream'],true)) throw new RuntimeException('INVALID_FILE_TYPE: File content is not an XLSX workbook.');
        $zip=new ZipArchive(); if($zip->open($path)!==true) throw new RuntimeException('MALFORMED_WORKBOOK: Workbook cannot be opened.');
        try {
            if($zip->locateName('xl/vbaProject.bin')!==false) throw new RuntimeException('UNSUPPORTED_TEMPLATE: Macro-enabled workbooks are not accepted.');
            $shared=$this->sharedStrings($zip); $sheetPath=$this->sheetPath($zip,self::SHEET);
            if(!$sheetPath) throw new RuntimeException('UNSUPPORTED_TEMPLATE: Required SUMMARY 1st & 2nd sheet is missing.');
            $xml=$this->xml($zip,$sheetPath); $cells=$this->cells($xml,$shared);
            if(trim($cells['A6']??'')!=='Name:' || trim($cells['F7']??'')!=='SY:') throw new RuntimeException('UNSUPPORTED_TEMPLATE: Name or school-year labels do not match the approved template.');
            $name=trim($cells['B6']??''); if($name==='') throw new RuntimeException('MISSING_PERSONNEL_NAME: Workbook personnel name is missing.');
            preg_match_all('/\b\d{4}\s*-\s*\d{4}\b/',(string)($cells['G7']??''),$yearMatches); $context=array_map(fn($v)=>preg_replace('/\s+/','',$v),$yearMatches[0]??[]);
            if(count($context)!==2 || $context!==array_values($requiredYears)) throw new RuntimeException('UNSUPPORTED_TEMPLATE: Workbook does not contain the two required consecutive school years.');
            $labels=[trim($cells['A39']??''),trim($cells['A40']??'')];
            foreach($requiredYears as $i=>$year) if(!str_contains($labels[$i]??'',$year) || stripos($labels[$i],'Performance Rating')===false) throw new RuntimeException('UNSUPPORTED_TEMPLATE: Performance Rating labels do not match the approved template.');
            $ratings=[]; foreach(['C39','C40'] as $ref){$raw=trim($cells[$ref]??'');$ratings[]=$raw===''?null:$this->normalizeRating($raw);}
            $status=$this->twoReviewStatus($ratings[0],$ratings[1]);
            $reason=$status==='pending'?'Second required annual review is missing.':($status==='not_passed'?'Two annual reviews are not both passing.':null);
            return ['template_identifier'=>'SUMMARY_1ST_2ND_V1','detected_personnel_name'=>$name,'review_1_school_year'=>$requiredYears[0],'review_1_rating'=>$ratings[0],'review_2_school_year'=>$requiredYears[1],'review_2_rating'=>$ratings[1],'two_review_status'=>$status,'two_review_reason'=>$reason,'validation_status'=>'valid','validation_issues'=>[]];
        } finally { $zip->close(); }
    }
    public function normalizeName(string $name): string { $name=preg_replace('/\b(mr|mrs|ms|dr|prof)\.?\s+/i','',$name);$name=preg_replace('/,\s*[A-Z][A-Z., -]{1,20}$/i','',$name);return mb_strtolower(trim(preg_replace('/\s+/',' ',$name))); }
    public function normalizeRating(string $raw): string { $key=mb_strtolower(trim(preg_replace('/\s+/',' ',$raw))); if(!isset(self::RATINGS[$key])) throw new RuntimeException('INVALID_RATING: Unknown Performance Rating text.'); return strtolower(str_replace(' ','_',self::RATINGS[$key])); }
    public function twoReviewStatus(?string $first,?string $second):string{return($first&&$second)?(($this->passing($first)&&$this->passing($second))?'passed':'not_passed'):'pending';}
    private function passing(string $rating): bool { return in_array($rating,['outstanding','very_satisfactory','satisfactory'],true); }
    private function xml(ZipArchive $zip,string $path): \SimpleXMLElement { $raw=$zip->getFromName($path); if($raw===false) throw new RuntimeException('MALFORMED_WORKBOOK: Required workbook part is unreadable.'); $xml=simplexml_load_string($raw); if(!$xml) throw new RuntimeException('MALFORMED_WORKBOOK: Workbook XML is invalid.'); return $xml; }
    private function sharedStrings(ZipArchive $zip): array { if($zip->locateName('xl/sharedStrings.xml')===false)return[];$xml=$this->xml($zip,'xl/sharedStrings.xml');$xml->registerXPathNamespace('m','http://schemas.openxmlformats.org/spreadsheetml/2006/main');$out=[];foreach($xml->xpath('//m:si')?:[] as $si){$si->registerXPathNamespace('m','http://schemas.openxmlformats.org/spreadsheetml/2006/main');$parts=[];foreach($si->xpath('.//m:t')?:[] as $t)$parts[]=(string)$t;$out[]=implode('',$parts);}return$out; }
    private function sheetPath(ZipArchive $zip,string $wanted): ?string { $wb=$this->xml($zip,'xl/workbook.xml');$wb->registerXPathNamespace('m','http://schemas.openxmlformats.org/spreadsheetml/2006/main');$rels=$this->xml($zip,'xl/_rels/workbook.xml.rels');$rels->registerXPathNamespace('r','http://schemas.openxmlformats.org/package/2006/relationships');foreach($wb->xpath('//m:sheet')?:[] as $sheet){if((string)$sheet['name']!==$wanted)continue;$attrs=$sheet->attributes('http://schemas.openxmlformats.org/officeDocument/2006/relationships');$id=(string)$attrs['id'];foreach($rels->xpath('//r:Relationship')?:[] as $rel)if((string)$rel['Id']===$id){$target=ltrim((string)$rel['Target'],'/');return str_starts_with($target,'xl/')?$target:'xl/'.$target;}}return null; }
    private function cells(\SimpleXMLElement $xml,array $shared): array { $xml->registerXPathNamespace('m','http://schemas.openxmlformats.org/spreadsheetml/2006/main');$out=[];foreach($xml->xpath('//m:c')?:[] as $cell){$ref=(string)$cell['r'];$type=(string)$cell['t'];if($type==='s')$value=$shared[(int)$cell->v]??'';elseif($type==='inlineStr'){$parts=[];foreach($cell->xpath('.//m:t')?:[] as $t)$parts[]=(string)$t;$value=implode('',$parts);}else$value=(string)$cell->v;$out[$ref]=$value;}return$out; }
}
