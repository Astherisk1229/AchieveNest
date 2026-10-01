<?php

namespace App\Services;

use RuntimeException;
use ZipArchive;

/**
 * Minimal, dependency-free XLSX writer for generated forms.
 *
 * Supports inline strings, numbers, formulas, a fixed style palette, merged ranges, column widths,
 * row heights and hidden sheets. Formulas are written without cached values and the workbook asks
 * Excel/LibreOffice to recalculate on open.
 */
final class SimpleXlsxWriter
{
    // Style ids (see styles()).
    public const S_DEFAULT = 0;
    public const S_TITLE = 1;
    public const S_SUBTITLE = 2;
    public const S_LABEL = 3;
    public const S_HEADER = 4;
    public const S_CELL = 5;
    public const S_INPUT_NUMBER = 6;
    public const S_FORMULA = 7;
    public const S_TOTAL = 8;
    public const S_TOTAL_FORMULA = 9;
    public const S_NOTE = 10;
    public const S_INPUT_TEXT = 11;
    public const S_VALUE_TEXT = 12;
    public const S_SECTION = 13;
    public const S_SIGN_LINE = 14;
    public const S_CELL_CENTER = 15;

    private array $sheets = [];

    /** @return int sheet index */
    public function addSheet(string $name, bool $hidden = false): int
    {
        if (mb_strlen($name) > 31 || preg_match('/[\[\]\*\?\/\\\\:]/', $name)) throw new RuntimeException('Invalid sheet name.');
        $this->sheets[] = ['name' => $name, 'hidden' => $hidden, 'cells' => [], 'merges' => [], 'cols' => [], 'rows' => []];
        return count($this->sheets) - 1;
    }

    public function set(int $sheet, string $ref, mixed $value, int $style = self::S_DEFAULT): void
    {
        $this->sheets[$sheet]['cells'][$ref] = ['v' => $value, 's' => $style, 'f' => false];
    }

    public function formula(int $sheet, string $ref, string $formula, int $style = self::S_FORMULA): void
    {
        $this->sheets[$sheet]['cells'][$ref] = ['v' => ltrim($formula, '='), 's' => $style, 'f' => true];
    }

    /** Style an empty cell (borders/fills on blank input cells). */
    public function style(int $sheet, string $ref, int $style): void
    {
        if (! isset($this->sheets[$sheet]['cells'][$ref])) $this->sheets[$sheet]['cells'][$ref] = ['v' => null, 's' => $style, 'f' => false];
        else $this->sheets[$sheet]['cells'][$ref]['s'] = $style;
    }

    public function merge(int $sheet, string $range, ?int $style = null): void
    {
        $this->sheets[$sheet]['merges'][] = $range;
        if ($style === null) return;
        [$from, $to] = explode(':', $range);
        [$c1, $r1] = self::split($from); [$c2, $r2] = self::split($to);
        for ($r = $r1; $r <= $r2; $r++) for ($c = $c1; $c <= $c2; $c++) $this->style($sheet, self::col($c) . $r, $style);
    }

    public function width(int $sheet, int $column, float $width): void { $this->sheets[$sheet]['cols'][$column] = $width; }
    public function height(int $sheet, int $row, float $height): void { $this->sheets[$sheet]['rows'][$row] = $height; }

    public function save(string $path): void
    {
        $zip = new ZipArchive();
        if ($zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) throw new RuntimeException('XLSX_WRITE_FAILED: Workbook could not be created.');
        $zip->addFromString('[Content_Types].xml', $this->contentTypes());
        $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
        $zip->addFromString('xl/workbook.xml', $this->workbook());
        $zip->addFromString('xl/_rels/workbook.xml.rels', $this->workbookRels());
        $zip->addFromString('xl/styles.xml', $this->styles());
        foreach ($this->sheets as $i => $sheet) $zip->addFromString('xl/worksheets/sheet' . ($i + 1) . '.xml', $this->sheet($sheet));
        $zip->close();
    }

    public static function col(int $index): string
    {
        $name = '';
        while ($index > 0) { $mod = ($index - 1) % 26; $name = chr(65 + $mod) . $name; $index = intdiv($index - $mod, 26); }
        return $name;
    }

    private static function split(string $ref): array
    {
        preg_match('/^([A-Z]+)(\d+)$/', $ref, $m);
        $col = 0; foreach (str_split($m[1]) as $ch) $col = $col * 26 + (ord($ch) - 64);
        return [$col, (int) $m[2]];
    }

    private static function esc(string $text): string { return htmlspecialchars($text, ENT_XML1 | ENT_QUOTES, 'UTF-8'); }

    private function contentTypes(): string
    {
        $sheets = '';
        foreach ($this->sheets as $i => $_) $sheets .= '<Override PartName="/xl/worksheets/sheet' . ($i + 1) . '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' . $sheets . '</Types>';
    }

    private function workbook(): string
    {
        $sheets = '';
        foreach ($this->sheets as $i => $sheet) $sheets .= '<sheet name="' . self::esc($sheet['name']) . '" sheetId="' . ($i + 1) . '"' . ($sheet['hidden'] ? ' state="hidden"' : '') . ' r:id="rId' . ($i + 1) . '"/>';
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>' . $sheets . '</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>';
    }

    private function workbookRels(): string
    {
        $rels = '';
        foreach ($this->sheets as $i => $_) $rels .= '<Relationship Id="rId' . ($i + 1) . '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' . ($i + 1) . '.xml"/>';
        $rels .= '<Relationship Id="rId' . (count($this->sheets) + 1) . '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>';
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' . $rels . '</Relationships>';
    }

    private function sheet(array $sheet): string
    {
        $rows = [];
        foreach ($sheet['cells'] as $ref => $cell) { [$c, $r] = self::split($ref); $rows[$r][$c] = [$ref, $cell]; }
        foreach (array_keys($sheet['rows']) as $r) $rows[$r] ??= [];
        ksort($rows);
        $data = '';
        foreach ($rows as $r => $cells) {
            ksort($cells);
            $attrs = isset($sheet['rows'][$r]) ? ' ht="' . $sheet['rows'][$r] . '" customHeight="1"' : '';
            $data .= '<row r="' . $r . '"' . $attrs . '>';
            foreach ($cells as [$ref, $cell]) {
                $s = ' s="' . $cell['s'] . '"';
                if ($cell['f']) $data .= '<c r="' . $ref . '"' . $s . '><f>' . self::esc((string) $cell['v']) . '</f></c>';
                elseif ($cell['v'] === null || $cell['v'] === '') $data .= '<c r="' . $ref . '"' . $s . '/>';
                elseif (is_int($cell['v']) || is_float($cell['v'])) $data .= '<c r="' . $ref . '"' . $s . '><v>' . $cell['v'] . '</v></c>';
                else $data .= '<c r="' . $ref . '"' . $s . ' t="inlineStr"><is><t xml:space="preserve">' . self::esc((string) $cell['v']) . '</t></is></c>';
            }
            $data .= '</row>';
        }
        $cols = '';
        if ($sheet['cols']) { ksort($sheet['cols']); foreach ($sheet['cols'] as $c => $w) $cols .= '<col min="' . $c . '" max="' . $c . '" width="' . $w . '" customWidth="1"/>'; $cols = '<cols>' . $cols . '</cols>'; }
        $merges = $sheet['merges'] ? '<mergeCells count="' . count($sheet['merges']) . '">' . implode('', array_map(fn($m) => '<mergeCell ref="' . $m . '"/>', $sheet['merges'])) . '</mergeCells>' : '';
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/>' . $cols . '<sheetData>' . $data . '</sheetData>' . $merges . '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup orientation="portrait" fitToWidth="1" fitToHeight="0"/></worksheet>';
    }

    private function styles(): string
    {
        // fonts: 0 normal, 1 bold, 2 bold 14, 3 bold 12, 4 italic 9 grey
        $fonts = '<fonts count="5"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font><font><b/><sz val="12"/><name val="Calibri"/></font><font><i/><sz val="9"/><color rgb="FF475569"/><name val="Calibri"/></font></fonts>';
        // fills: 0 none, 1 gray125 (required), 2 header grey, 3 input yellow, 4 total green
        $fills = '<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFEF9C3"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFECFDF5"/><bgColor indexed="64"/></patternFill></fill></fills>';
        // borders: 0 none, 1 thin all, 2 bottom thin
        $borders = '<borders count="3"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FF94A3B8"/></left><right style="thin"><color rgb="FF94A3B8"/></right><top style="thin"><color rgb="FF94A3B8"/></top><bottom style="thin"><color rgb="FF94A3B8"/></bottom><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FF334155"/></bottom><diagonal/></border></borders>';
        $numFmts = '<numFmts count="1"><numFmt numFmtId="164" formatCode="0.00"/></numFmts>';
        $x = fn(int $font, int $fill, int $border, string $align = '', int $numFmt = 0, bool $unlocked = false) => '<xf numFmtId="' . $numFmt . '" fontId="' . $font . '" fillId="' . $fill . '" borderId="' . $border . '" xfId="0"' . ($numFmt ? ' applyNumberFormat="1"' : '') . ' applyFont="1" applyFill="1" applyBorder="1"' . ($align ? ' applyAlignment="1"><alignment ' . $align . '/>' : '>') . ($unlocked ? '<protection locked="0"/>' : '') . '</xf>';
        $xfs = [
            $x(0, 0, 0),                                                          // 0 default
            $x(2, 0, 0, 'horizontal="center" vertical="center"'),                   // 1 title
            $x(3, 0, 0, 'horizontal="center" vertical="center"'),                   // 2 subtitle
            $x(1, 0, 0, 'vertical="center"'),                                       // 3 label
            $x(1, 2, 1, 'horizontal="center" vertical="center" wrapText="1"'),      // 4 header
            $x(0, 0, 1, 'vertical="center" wrapText="1"'),                          // 5 cell
            $x(0, 3, 1, 'horizontal="center" vertical="center"', 164, true),       // 6 input number
            $x(0, 0, 1, 'horizontal="center" vertical="center"', 164),             // 7 formula
            $x(1, 4, 1, 'vertical="center"'),                                       // 8 total label
            $x(1, 4, 1, 'horizontal="center" vertical="center"', 164),             // 9 total formula
            $x(4, 0, 0, 'vertical="top" wrapText="1"'),                             // 10 note
            $x(0, 3, 2, 'vertical="center"', 0, true),                             // 11 input text
            $x(0, 0, 2, 'vertical="center"'),                                       // 12 value text (read-only)
            $x(1, 2, 1, 'vertical="center"'),                                       // 13 section
            $x(1, 0, 2, 'horizontal="center" vertical="bottom"'),                   // 14 signature name line
            $x(0, 0, 1, 'horizontal="center" vertical="center" wrapText="1"'),      // 15 centered cell
        ];
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' . $numFmts . $fonts . $fills . $borders . '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="' . count($xfs) . '">' . implode('', $xfs) . '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
    }
}
