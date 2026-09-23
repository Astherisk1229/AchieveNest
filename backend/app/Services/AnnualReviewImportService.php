<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use CodeIgniter\HTTP\Files\UploadedFile;
use InvalidArgumentException;
use RuntimeException;

class AnnualReviewImportService
{
    public function __construct(private ?BaseConnection $db=null, private ?AnnualReviewWorkbookParser $parser=null, private ?LocalEvidenceStorageService $storage=null, private ?OrganizationalAuthorityResolver $authorityResolver=null, private ?AuthorityRankingRosterService $rosterService=null)
    { $this->db??=db_connect();$this->parser??=new AnnualReviewWorkbookParser();$this->storage??=new LocalEvidenceStorageService();$this->authorityResolver??=new OrganizationalAuthorityResolver($this->db);$this->rosterService??=new AuthorityRankingRosterService($this->db,$this->authorityResolver); }

    public function preview(array $actor, array $files, string $periodId, ?string $expectedPersonnelId=null): array
    {
        $period=$this->db->table('personnel_evaluation_periods')->where('id',$periodId)->get()->getRowArray();
        if(!$period) throw new InvalidArgumentException('EVALUATION_PERIOD_INVALID: Evaluation period was not found.');
        if(in_array($period['status'],['CLOSED','ARCHIVED'],true)) throw new RuntimeException('EVALUATION_PERIOD_LOCKED: This evaluation period is read-only.');
        $years=$this->requiredYears($period['academic_year']);$workspace=$this->workspace($actor);$candidates=$this->candidates($actor,$workspace,$period);
        if($expectedPersonnelId!==null&&!in_array($expectedPersonnelId,array_column($candidates,'id'),true))throw new RuntimeException('FORBIDDEN: Expected personnel is outside authorized scope.');
        $results=[];
        foreach($files as $file){
            try{
                if(!$file instanceof UploadedFile||!$file->isValid())throw new RuntimeException('INVALID_FILE: Upload did not complete.');
                $parsed=$this->parser->parse($file->getTempName(),$file->getClientName(),$years);$id=$this->uuid();
                $stored=$this->storage->storeFile($file->getTempName(),'annual-review',$actor['profile']['id'],$id,'xlsx',true);
                $selectedPersonnel=null;
                if($expectedPersonnelId!==null){
                    $selectedPersonnel=current(array_filter($candidates,fn($p)=>$p['id']===$expectedPersonnelId))?:null;
                    $isDirectMatch=$selectedPersonnel!==null&&AnnualReviewPersonnelMatcher::matches((string)$selectedPersonnel['full_name'],(string)$parsed['detected_personnel_name']);
                    $matches=$isDirectMatch?[$selectedPersonnel]:[];$matchStatus=$isDirectMatch?'matched':'wrong_person';$personId=$isDirectMatch?$expectedPersonnelId:null;
                }else{
                    // Bulk upload deliberately retains scoped global resolution and ambiguity handling.
                    $matches=array_values(array_filter($candidates,fn($p)=>$this->parser->normalizeName($p['full_name'])===$this->parser->normalizeName($parsed['detected_personnel_name'])));
                    $matchStatus=count($matches)===1?'matched':(count($matches)>1?'ambiguous':'unmatched');$personId=count($matches)===1?$matches[0]['id']:null;
                }
                $now=date('Y-m-d H:i:s');
                $parsed['validation_issues']=json_encode($parsed['validation_issues']);$this->db->table('personnel_annual_review_imports')->insert($parsed+['id'=>$id,'personnel_profile_id'=>$personId,'expected_personnel_profile_id'=>$expectedPersonnelId,'evaluation_period_id'=>$periodId,'source'=>'excel_import','source_file_path'=>$stored['storage_path'],'original_filename'=>$file->getClientName(),'file_hash'=>$stored['sha256'],'match_status'=>$matchStatus,'uploaded_by'=>$actor['profile']['id'],'uploader_workspace'=>$workspace,'uploaded_at'=>$now,'created_at'=>$now,'updated_at'=>$now]);
                $formatted=$this->format($this->db->table('personnel_annual_review_imports')->where('id',$id)->get()->getRowArray(),$matches,$candidates);
                if($expectedPersonnelId!==null&&$selectedPersonnel!==null){$formatted['selected_personnel']=['id'=>$selectedPersonnel['id'],'personnel_id'=>$selectedPersonnel['institutional_id'],'name'=>$selectedPersonnel['full_name']];$formatted['workbook_personnel_name']=$parsed['detected_personnel_name'];$formatted['personnel_match']=$matchStatus==='matched';$formatted['matched_personnel_id']=$matchStatus==='matched'?$expectedPersonnelId:null;}
                if($personId){$prior=$this->db->table('personnel_annual_review_imports')->where(['personnel_profile_id'=>$personId,'evaluation_period_id'=>$periodId])->where('id !=',$id)->where('confirmed_at !=',null)->where('superseded_at',null)->orderBy('confirmed_at','DESC')->get()->getRowArray();if($prior){$formatted['state']=hash_equals($prior['file_hash'],$stored['sha256'])?'duplicate_upload':'replacement';$formatted['is_replacement']=true;}}
                $results[]=$formatted;
            }catch(\Throwable $e){$results[]=['id'=>null,'filename'=>method_exists($file,'getClientName')?$file->getClientName():'Unknown file','validation_status'=>'invalid','state'=>$this->code($e->getMessage()),'issues'=>[$e->getMessage()],'matches'=>[],'candidates'=>[]];}
        }
        return ['ranking_cycle_id'=>$period['ranking_cycle_id']??null,'ranking_track_id'=>$period['id'],'personnel_group'=>$period['personnel_group']??null,'required_school_years'=>$years,'imports'=>$results];
    }

    public function confirm(array $actor,string $id,?string $selectedPersonnelId=null,?string $reason=null): array
    {
        $row=$this->db->table('personnel_annual_review_imports')->where('id',$id)->get()->getRowArray();if(!$row||$row['uploaded_by']!==($actor['profile']['id']??''))throw new RuntimeException('FORBIDDEN: Import preview is unavailable.');
        if($row['confirmed_at'])return $this->format($row);
        $period=$this->db->table('personnel_evaluation_periods')->where('id',$row['evaluation_period_id'])->get()->getRowArray();if(!$period||in_array($period['status'],['CLOSED','ARCHIVED'],true))throw new RuntimeException('EVALUATION_PERIOD_LOCKED: This evaluation period is read-only.');
        $workspace=$this->workspace($actor);$allowed=array_column($this->candidates($actor,$workspace,$period),'id');$personId=$selectedPersonnelId?:$row['personnel_profile_id'];if(!$personId||!in_array($personId,$allowed,true))throw new RuntimeException('PERSONNEL_MATCH_REQUIRED: Select one personnel record assigned to your authority for this ranking track.');if(!empty($row['expected_personnel_profile_id'])&&$personId!==$row['expected_personnel_profile_id'])throw new RuntimeException('WORKBOOK_PERSONNEL_MISMATCH: The workbook does not match the personnel selected for this row.');if(($row['match_status']??'')==='wrong_person')throw new RuntimeException('WORKBOOK_PERSONNEL_MISMATCH: The workbook name does not match the personnel selected for this row.');
        $duplicate=$this->db->table('personnel_annual_review_imports')->where(['personnel_profile_id'=>$personId,'evaluation_period_id'=>$row['evaluation_period_id'],'file_hash'=>$row['file_hash']])->where('confirmed_at !=',null)->where('superseded_at',null)->get()->getRowArray();if($duplicate)throw new RuntimeException('DUPLICATE_UPLOAD: This exact workbook is already authoritative.');
        $effective=$this->db->table('personnel_annual_review_imports')->where(['personnel_profile_id'=>$personId,'evaluation_period_id'=>$row['evaluation_period_id']])->where('confirmed_at !=',null)->where('superseded_at',null)->orderBy('confirmed_at','DESC')->get()->getRowArray();
        if($effective){if(trim((string)$reason)==='')throw new RuntimeException('CORRECTION_REASON_REQUIRED: A replacement reason is required.');$submission=$this->db->table('personnel_evaluations')->where(['personnel_profile_id'=>$personId,'evaluation_period_id'=>$row['evaluation_period_id']])->where('submitted_at !=',null)->get()->getRowArray();if($submission)throw new RuntimeException('HR_REOPENING_REQUIRED: Portfolio was already submitted; HR reopening is required.');}
        $now=date('Y-m-d H:i:s');$this->db->transBegin();try{if($effective)$this->db->table('personnel_annual_review_imports')->where('id',$effective['id'])->update(['superseded_at'=>$now,'updated_at'=>$now]);$this->db->table('personnel_annual_review_imports')->where('id',$id)->update(['personnel_profile_id'=>$personId,'match_status'=>'matched','confirmed_at'=>$now,'supersedes_import_id'=>$effective['id']??null,'correction_reason'=>$effective?$reason:null,'updated_at'=>$now]);$this->audit($actor,$id,$personId,$row,$effective,$now);$this->notify($personId,$row['evaluation_period_id'],$id,$now);$this->db->transCommit();}catch(\Throwable $e){$this->db->transRollback();throw$e;}
        return $this->format($this->db->table('personnel_annual_review_imports')->where('id',$id)->get()->getRowArray());
    }

    public function history(array $actor,string $personId,string $periodId): array { $period=$this->period($periodId);$workspace=$this->workspace($actor);if(!in_array($personId,array_column($this->candidates($actor,$workspace,$period),'id'),true))throw new RuntimeException('FORBIDDEN: Personnel is outside authorized authority or ranking-track scope.');$builder=$this->db->table('personnel_annual_review_imports imports')->select('imports.*, uploader.full_name AS uploader_name')->join('profiles uploader','uploader.id=imports.uploaded_by','left')->where('imports.personnel_profile_id',$personId)->where('imports.confirmed_at !=',null)->where('imports.evaluation_period_id',$period['id']);return array_map(fn($r)=>$this->format($r),$builder->orderBy('imports.confirmed_at','DESC')->orderBy('imports.uploaded_at','DESC')->get()->getResultArray()); }
    public function file(array $actor,string $id):array{$row=$this->db->table('personnel_annual_review_imports')->where('id',$id)->get()->getRowArray();if(!$row)throw new RuntimeException('NOT_FOUND: Annual-review report was not found.');$period=$this->period($row['evaluation_period_id']);$workspace=$this->workspace($actor);if($row['uploaded_by']!==($actor['profile']['id']??'')&&!in_array($row['personnel_profile_id'],array_column($this->candidates($actor,$workspace,$period),'id'),true))throw new RuntimeException('FORBIDDEN: Report is outside authorized scope.');$path=$this->storage->resolveAbsolutePath($row['source_file_path']);if(!$path)throw new RuntimeException('NOT_FOUND: Stored report is unavailable.');return['path'=>$path,'filename'=>$row['original_filename']];}
    private function requiredYears(string $academicYear): array { if(!preg_match('/^(\d{4})-(\d{4})$/',$academicYear,$m)||(int)$m[2]!==((int)$m[1]+1))throw new RuntimeException('EVALUATION_PERIOD_INVALID: Academic year is not consecutive.');$start=(int)$m[1];return[($start-2).'-'.($start-1),($start-1).'-'.$start]; }
    private function workspace(array $actor): string { $roles=$actor['roles']??[];if(array_intersect(['hr_admin','hr_staff'],$roles))return'hr';if(in_array('dean',$roles,true))return'dean';if(in_array('department_head',$roles,true))return'department_head';throw new RuntimeException('FORBIDDEN: Responsible Dean, Department Head, or HR authority role required.'); }
    private function candidates(array $actor,string $workspace,array $period): array
    {
        $cycleId=(string)($period['ranking_cycle_id']??'');
        if($cycleId==='')throw new RuntimeException('EVALUATION_PERIOD_INVALID: Ranking track is not attached to a Ranking Cycle.');
        $roster=$this->rosterService->list($actor,$cycleId,(string)$period['personnel_group']);
        return array_map(fn($item)=>$item['personnel'],$roster['personnel']);
    }
    private function period(string $periodId): array { $period=$this->db->table('personnel_evaluation_periods')->where('id',$periodId)->get()->getRowArray();if(!$period)throw new InvalidArgumentException('EVALUATION_PERIOD_INVALID: Evaluation period was not found.');return$period; }
    private function format(array $r,array $matches=[],array $candidates=[]): array { foreach(['validation_issues']as$key)if(is_string($r[$key]??null))$r[$key]=json_decode($r[$key],true)?:[];return['id'=>$r['id'],'filename'=>$r['original_filename'],'detected_personnel_name'=>$r['detected_personnel_name'],'personnel_profile_id'=>$r['personnel_profile_id'],'expected_personnel_profile_id'=>$r['expected_personnel_profile_id']??null,'evaluation_period_id'=>$r['evaluation_period_id'],'review_1_school_year'=>$r['review_1_school_year'],'review_1_rating'=>$r['review_1_rating'],'review_2_school_year'=>$r['review_2_school_year'],'review_2_rating'=>$r['review_2_rating'],'two_review_status'=>$r['two_review_status'],'two_review_reason'=>$r['two_review_reason'],'validation_status'=>$r['validation_status'],'match_status'=>$r['match_status'],'state'=>$r['confirmed_at']?'confirmed':($r['match_status']==='matched'?'ready':$r['match_status']),'uploaded_at'=>$r['uploaded_at']??null,'confirmed_at'=>$r['confirmed_at'],'uploaded_by'=>$r['uploaded_by']??null,'uploader_name'=>$r['uploader_name']??null,'supersedes_import_id'=>$r['supersedes_import_id']??null,'superseded_at'=>$r['superseded_at']??null,'correction_reason'=>$r['correction_reason']??null,'matches'=>$matches,'candidates'=>in_array($r['match_status'],['ambiguous','unmatched'],true)?$candidates:[],'is_replacement'=>!empty($r['supersedes_import_id'])]; }
    private function audit(array $actor,string $id,string $personId,array $row,?array $old,string $now):void{try{$data=['id'=>$this->uuid(),'profile_id'=>$personId,'event_type'=>$old?'annual_review_import_replaced':'annual_review_import_confirmed','reason'=>json_encode(['import_id'=>$id,'filename'=>$row['original_filename'],'file_hash'=>$row['file_hash'],'ratings'=>[$row['review_1_rating'],$row['review_2_rating']],'two_review_status'=>$row['two_review_status']]),'occurred_at'=>$now];if($this->db->fieldExists('actor_profile_id','account_lifecycle_events'))$data['actor_profile_id']=$actor['profile']['id'];elseif($this->db->fieldExists('performed_by','account_lifecycle_events'))$data['performed_by']=$actor['profile']['id'];if($this->db->fieldExists('created_at','account_lifecycle_events'))$data['created_at']=$now;$this->db->table('account_lifecycle_events')->insert($data);}catch(\Throwable $e){} }
    private function notify(string $personId,string $periodId,string $id,string $now):void{if(!$this->db->tableExists('notifications'))return;$eligibility=(new PersonnelEligibilityService($this->db))->evaluateEligibility($personId,$periodId);$status=$eligibility['eligibility_status']??'pending';$text=$status==='eligible'?'You are now eligible to submit your portfolio for evaluation.':($status==='pending'?'Your annual review has been processed, but your portfolio eligibility is still pending required employment/service information.':'Your annual-review requirement for this evaluation period was not satisfied. Portfolio submission for evaluation is unavailable for this cycle.');try{$this->db->table('notifications')->insert(['id'=>$this->uuid(),'recipient_profile_id'=>$personId,'notification_type'=>'annual_review_imported','title'=>'Annual review processed','message'=>$text,'reference_type'=>'personnel_annual_review_imports','reference_id'=>$id,'is_mandatory'=>1,'created_at'=>$now]);}catch(\Throwable $e){} }
    private function uuid():string{return sprintf('%04x%04x-%04x-4%03x-%04x-%04x%04x%04x',random_int(0,65535),random_int(0,65535),random_int(0,65535),random_int(0,4095),random_int(32768,49151),random_int(0,65535),random_int(0,65535),random_int(0,65535));}
    private function code(string $message):string{return strtolower(strtok($message,':')?:'invalid');}
}
