<?php

namespace App\Services;

use Mpdf\Mpdf;
use Mpdf\Output\Destination;
use RuntimeException;

/** Builds a text-based institutional PDF from the canonical criteria hierarchy. */
final class RankingCriteriaPdfRendererService
{
    private string $tempDir;

    public function __construct(?string $tempDir = null)
    {
        $writableBase = defined('WRITEPATH') ? WRITEPATH : dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'writable';
        $configuredTempDir = $tempDir ?? (rtrim($writableBase, '\\/') . DIRECTORY_SEPARATOR . 'cache' . DIRECTORY_SEPARATOR . 'ranking-criteria-pdf');
        if (!$this->prepareTempDir($configuredTempDir)) {
            $systemTempDir = rtrim(sys_get_temp_dir(), '\\/') . DIRECTORY_SEPARATOR . 'achievenest-ranking-criteria-pdf';
            if (!$this->prepareTempDir($systemTempDir)) {
                throw new RuntimeException('PDF_TEMP_DIRECTORY_UNAVAILABLE');
            }
            $configuredTempDir = $systemTempDir;
        }
        $this->tempDir = $configuredTempDir;
    }

    private function prepareTempDir(string $path): bool
    {
        if (!is_dir($path) && !@mkdir($path, 0755, true) && !is_dir($path)) return false;
        // mPDF checks is_writable() itself, so the selected path must pass
        // that check as well as supporting its write-then-rename cache flow.
        if (!is_writable($path) || !$this->supportsAtomicWrites($path)) return false;

        // mPDF writes its cache under <tempDir>/mpdf (and a nested font cache).
        // Create these directories before passing tempDir to mPDF: its Cache
        // constructor expects the mpdf directory to already exist.
        foreach ([$path . DIRECTORY_SEPARATOR . 'mpdf', $path . DIRECTORY_SEPARATOR . 'mpdf' . DIRECTORY_SEPARATOR . 'ttfontdata'] as $cacheDir) {
            if (!is_dir($cacheDir) && !@mkdir($cacheDir, 0755, true) && !is_dir($cacheDir)) return false;
            if (!is_writable($cacheDir) || !$this->supportsAtomicWrites($cacheDir)) return false;
        }

        return true;
    }

    /**
     * mPDF writes cache files to a temporary name and then renames them into
     * place. On Windows, is_writable() can report true for a temp location
     * where that rename is denied, or false for a valid application writable
     * directory. Probe the operation mPDF actually needs instead of trusting
     * the platform's directory flag.
     */
    private function supportsAtomicWrites(string $directory): bool
    {
        $probe = $directory . DIRECTORY_SEPARATOR . '.achievenest-pdf-' . bin2hex(random_bytes(8));
        $renamed = $probe . '.ready';

        try {
            if (@file_put_contents($probe, 'probe', LOCK_EX) !== 5) return false;
            if (!@rename($probe, $renamed)) return false;
            return @unlink($renamed);
        } finally {
            if (file_exists($probe)) @unlink($probe);
            if (file_exists($renamed)) @unlink($renamed);
        }
    }

    public function render(array $tree): string
    {
        $sheet = (array)($tree['sheet'] ?? []);
        $version = (array)($tree['version'] ?? []);
        if (!$sheet || !$version || !isset($tree['areas']) || !is_array($tree['areas'])) {
            throw new RuntimeException('CRITERIA_VERSION_HIERARCHY_INVALID');
        }

        $html = $this->buildHtml($sheet, $version, $tree['areas']);
        $mpdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'orientation' => 'P',
            'tempDir' => $this->tempDir,
            'margin_left' => 15,
            'margin_right' => 15,
            'margin_top' => 17,
            'margin_bottom' => 17,
            'margin_header' => 0,
            'margin_footer' => 7,
            'default_font' => 'dejavusans',
        ]);
        $mpdf->SetTitle((string)$sheet['name'] . ' - ' . (string)($sheet['applies_to'] ?? '') . ' v' . (string)($version['version_number'] ?? ''));
        $mpdf->SetAuthor('Notre Dame of Marbel University');
        $mpdf->SetHTMLFooter('<div class="page-footer"><span>AchieveNest · Personnel Evaluation Criteria</span><span>Page {PAGENO} of {nbpg}</span></div>');
        $mpdf->WriteHTML($html);
        return $mpdf->Output('', Destination::STRING_RETURN);
    }

    private function buildHtml(array $sheet, array $version, array $areas): string
    {
        $name = $this->e($sheet['name'] ?? 'Ranking Criteria');
        $group = $this->groupLabel((string)($sheet['applies_to'] ?? ''));
        $versionNumber = $this->e($version['version_number'] ?? '');
        $effective = $this->e($version['effective_start_date'] ?? 'Not recorded');
        $total = $this->n($sheet['overall_max_points'] ?? $version['total_max_points'] ?? 0);
        $passing = $this->n($sheet['passing_score'] ?? $version['passing_score'] ?? 0);
        $description = trim((string)($sheet['description'] ?? ''));

        $body = '';
        foreach ($areas as $area) {
            if (!is_array($area)) continue;
            $areaCode = $this->e($area['area_code'] ?? '');
            $rawAreaName = trim((string)($area['name'] ?? ''));
            $areaTitle = preg_replace('/^Area\\s+' . preg_quote((string)($area['area_code'] ?? ''), '/') . '\\s*[:\\-–—]?\\s*/iu', '', $rawAreaName) ?: $rawAreaName;
            $areaName = $this->e($areaTitle);
            $body .= '<section class="area"><table class="area-heading"><tr><td><span class="section-kicker">AREA ' . $areaCode . '</span><h2>' . $areaName . '</h2></td><td class="area-max">Area Maximum<br><strong>' . $this->n($area['max_points'] ?? 0) . '</strong></td></tr></table>';
            foreach ((array)($area['categories'] ?? []) as $category) {
                if (!is_array($category)) continue;
                $body .= $this->renderCategory($category, (string)($sheet['applies_to'] ?? ''));
            }
            $body .= '</section>';
        }

        $descriptionHtml = $description === '' ? '' : '<p class="description">' . $this->e($description) . '</p>';
        return '<!doctype html><html><head><meta charset="utf-8"><style>' . $this->styles() . '</style></head><body>'
            . '<header class="masthead"><div class="institution">NOTRE DAME OF MARBEL UNIVERSITY</div><div class="office">PERSONNEL EVALUATION CRITERIA</div></header>'
            . '<main><div class="document-title"><div class="eyebrow">RANKING CRITERIA · ' . $this->e($group) . '</div><h1>' . $name . '</h1><p class="version-line">Version ' . $versionNumber . '</p></div>'
            . '<table class="metadata"><tr><td><span>Effective Date</span><strong>' . $effective . '</strong></td><td><span>Personnel Group</span><strong>' . $this->e($group) . '</strong></td><td><span>Total Points</span><strong>' . $total . '</strong></td><td><span>Passing Score</span><strong>' . $passing . '</strong></td></tr></table>'
            . $descriptionHtml . $body . '</main></body></html>';
    }

    private function renderCategory(array $category, string $group): string
    {
        $code = trim((string)($category['category_code'] ?? ''));
        $rawName = trim((string)($category['name'] ?? ''));
        $name = preg_replace('/^' . preg_quote($code, '/') . '\\s*/u', '', $rawName) ?: $rawName;
        $displayName = $this->e(trim($code . ' ' . $name));
        $maximum = $this->n($category['max_points'] ?? 0);
        $isYears = preg_match('/years of service|service credit/i', (string)($category['name'] ?? '')) === 1;
        $shared = ($category['scoring_mode'] ?? '') === 'CATEGORY_CAP' || preg_match('/involvement|school activities|community involvement/i', (string)($category['name'] ?? '')) === 1;
        $weighted = ($category['renderer_key'] ?? '') === 'WEIGHTED_MANUAL' || ($group === 'NON_TEACHING_FACULTY' && str_starts_with($code, 'A.'));
        $manual = (int)($category['requires_manual_hr_rule'] ?? 0) === 1;
        $matrix = in_array($category['renderer_key'] ?? '', ['GUEST_LECTURER_MATRIX', 'PUBLICATION_MATRIX', 'RECOGNITION_MATRIX', 'INSTRUCTIONAL_MATERIALS'], true);

        if ($manual) $mode = 'Manual evaluator scoring';
        elseif ($shared) $mode = 'Automatic aggregation with shared cap';
        elseif (($category['scoring_mode'] ?? '') === 'FORMULA') $mode = 'Automatic formula';
        else $mode = 'Official scoring table';

        if ($isYears) $table = $this->yearsTable($category);
        elseif ($matrix) $table = $this->matrixTable($category);
        elseif (($category['renderer_key'] ?? '') === 'ENGAGEMENT') $table = $this->engagementTable($category);
        elseif ($manual) $table = $this->manualTable($category, $weighted);
        elseif ($code === 'A.3' && $group === 'FACULTY') $table = $this->seminarTable($category);
        elseif ($shared) $table = $this->sharedCapTable($category);
        else $table = $this->officialTable($category);

        return '<article class="category"><table class="category-heading"><tr><td><h3>' . $displayName . '</h3><div class="mode">' . $mode . '</div></td><td class="category-max">Maximum <strong>' . $maximum . '</strong></td></tr></table>' . $table . '</article>';
    }

    private function yearsTable(array $category): string
    {
        $options = array_values(array_filter((array)($category['options'] ?? []), static fn($option) => ($option['option_group_code'] ?? '') === 'YEARS'));
        if (!$options) {
            $years = ['2','4','6','8','10','12','14','16','18','20+'];
            foreach ($years as $index => $year) $options[] = ['label'=>$year, 'points'=>(string)($index + 1)];
        }
        $rows = [];
        foreach ($options as $option) $rows[] = [$option['label'] ?? '', $this->n($option['points'] ?? 0), $this->n($category['max_points'] ?? 0)];
        return $this->table(['Years of Service', 'Point Value', 'Criterion Maximum'], $rows, 'compact-table');
    }

    private function matrixTable(array $category): string
    {
        $labels = ['SPONSOR'=>'Type of Sponsoring Organization','EXTENT'=>'Extent of Talk','PARTICIPANTS'=>'Participants','ROLE'=>'Role','SCOPE'=>'Location / Scope','TYPE'=>'Type of Publication','NOMINEE'=>'Nominee','AWARDEE'=>'Awardee','MATERIAL_TYPE'=>'Type of Instructional Material'];
        $preferred = match ($category['renderer_key'] ?? '') {
            'GUEST_LECTURER_MATRIX' => ['SPONSOR','EXTENT','PARTICIPANTS','ROLE'],
            'PUBLICATION_MATRIX' => ['SCOPE','TYPE'],
            'RECOGNITION_MATRIX' => ['NOMINEE','AWARDEE'],
            default => ['MATERIAL_TYPE'],
        };
        $available = array_unique(array_map(static fn(array $option): string => (string)($option['option_group_code'] ?? ''), (array)($category['options'] ?? [])));
        $groups = array_values(array_filter($preferred, static fn(string $group): bool => in_array($group, $available, true)));
        $rows = [];
        foreach ($groups as $group) {
            foreach ((array)($category['options'] ?? []) as $option) {
                if (($option['option_group_code'] ?? '') !== $group) continue;
                $rows[] = [$labels[$group] ?? $group, $option['label'] ?? '', $this->n($option['points'] ?? 0)];
            }
        }
        return $rows ? $this->table(['Scoring Dimension', 'Qualification / Level', 'Point Value'], $rows, 'compact-table') : $this->emptyRulesTable('No matrix point options are recorded.');
    }

    private function engagementTable(array $category): string
    {
        $rule = null;
        foreach ((array)($category['options'] ?? []) as $option) if (($option['option_code'] ?? '') === 'POINTS_PER_ENGAGEMENT') { $rule = $option; break; }
        $sub = (array)(($category['subcategories'] ?? [])[0] ?? []);
        $points = $rule['points'] ?? $sub['default_points'] ?? 5;
        $calculation = $rule['label'] ?? 'Eligible engagements × ' . $this->n($points) . ' points, capped at ' . $this->n($category['max_points'] ?? 0) . '.';
        return $this->table(['Eligible Engagement', 'Point Value', 'Maximum', 'Calculation'], [['Judge / Lecturer / Resource Person', $this->n($points) . ' points each', $this->n($category['max_points'] ?? 0), $calculation]], 'compact-table');
    }

    private function manualTable(array $category, bool $weighted): string
    {
        $weight = '';
        foreach ((array)($category['options'] ?? []) as $option) if (($option['option_group_code'] ?? '') === 'WEIGHT') { $weight = (string)($option['label'] ?? ''); break; }
        if ($weighted && $weight === '') $weight = match ($category['category_code'] ?? '') { 'A.1' => '.50', 'A.2' => '.10', default => '.30' };
        $description = trim((string)($category['description'] ?? '')) ?: 'No lower-level point breakdown is provided in the official source.';
        $headers = ['Criterion'];
        $row = [$category['name'] ?? '', $description, $this->n($category['max_points'] ?? 0), 'Evaluator score and evidence review required.'];
        if ($weighted) { $headers[] = 'Weight / %'; array_splice($row, 1, 0, [$weight]); }
        array_push($headers, 'Detailed Breakdown in Source', 'Maximum', 'System Note');
        return $this->table($headers, [$row], 'compact-table');
    }

    private function seminarTable(array $category): string
    {
        $labels = ['In-House', 'City / Provincial', 'Regional', 'National', 'International'];
        $options = array_values(array_filter((array)($category['options'] ?? []), static fn($option) => ($option['option_group_code'] ?? '') === 'LEVEL'));
        $subs = array_values((array)($category['subcategories'] ?? []));
        $rows = [];
        foreach ($labels as $index => $label) {
            $item = $options[$index] ?? $subs[$index] ?? null;
            $value = $item ? ($item['points'] ?? $item['default_points'] ?? null) : null;
            $rows[] = [$label, $value === null ? '—' : $this->n($value)];
        }
        return '<p class="table-caption">Seminar / Training · Venue · Date</p>' . $this->table(['Training Level', 'Equivalent Point Value'], $rows, 'compact-table') . '<p class="category-cap">Category Maximum: <strong>' . $this->n($category['max_points'] ?? 0) . '</strong></p>';
    }

    private function sharedCapTable(array $category): string
    {
        $rows = [];
        foreach ((array)($category['subcategories'] ?? []) as $item) $rows[] = [$item['name'] ?? '', $item['description'] ?? 'Supporting institutional evidence', $this->n($item['default_points'] ?? 0), $this->n($category['max_points'] ?? 0)];
        return $rows ? $this->table(['Subcategory', 'Required Record / Evidence', 'Subcategory Maximum', 'Shared Category Cap'], $rows, 'compact-table') : $this->emptyRulesTable('No subcategory rules are recorded.');
    }

    private function officialTable(array $category): string
    {
        $items = array_merge((array)($category['subcategories'] ?? []), (array)($category['criteria'] ?? []));
        $rows = [];
        foreach ($items as $item) {
            $isSubcategory = !empty($item['subcategory_code']);
            $pointValue = $isSubcategory ? ($item['default_points'] ?? 0) : ($item['max_points_per_entry'] ?? 0);
            $rows[] = [$item['name'] ?? '', $item['description'] ?? $item['formula_key'] ?? 'Official source rule', $this->n($pointValue), $this->n($category['max_points'] ?? 0)];
        }
        return $rows ? $this->table(['Criterion', 'Official Qualification / Rule', 'Point Value', 'Criterion Maximum'], $rows) : $this->emptyRulesTable('No lower-level point breakdown is recorded for this category.');
    }

    private function emptyRulesTable(string $message): string
    {
        return '<p class="empty-rules">' . $this->e($message) . '</p>';
    }

    private function table(array $headers, array $rows, string $class = ''): string
    {
        $html = '<table class="criteria-table ' . $this->e($class) . '"><thead><tr>';
        foreach ($headers as $header) $html .= '<th>' . $this->e($header) . '</th>';
        $html .= '</tr></thead><tbody>';
        foreach ($rows as $row) {
            $html .= '<tr>';
            foreach ($row as $cell) $html .= '<td>' . $this->e($cell) . '</td>';
            $html .= '</tr>';
        }
        return $html . '</tbody></table>';
    }

    private function styles(): string
    {
        return 'body{font-family:dejavusans,sans-serif;color:#17253b;font-size:9pt;line-height:1.4}main{width:100%}.masthead{border-bottom:2px solid #087447;padding:0 0 8px;margin-bottom:16px}.institution{font-size:11pt;font-weight:bold;color:#064e36;letter-spacing:.5px}.office{font-size:8pt;color:#5d6e82;letter-spacing:1px;margin-top:3px}.document-title{margin:0 0 12px}.eyebrow,.section-kicker{font-size:7pt;font-weight:bold;color:#087447;letter-spacing:1px}.document-title h1{font-size:18pt;line-height:1.2;margin:3px 0;color:#10233f}.version-line{margin:2px 0 0;color:#596b83;font-size:9pt}.metadata{width:100%;border-collapse:collapse;margin:10px 0 12px;background:#f2f7f4}.metadata td{border:1px solid #cbd8d1;padding:7px 8px;width:25%;vertical-align:top}.metadata span{display:block;color:#607386;font-size:7pt;text-transform:uppercase;letter-spacing:.4px}.metadata strong{display:block;color:#17253b;font-size:9pt;margin-top:2px}.description{padding:8px 10px;border-left:2px solid #087447;background:#f7faf8;color:#465970;margin:0 0 14px}.area{margin-top:17px}.area-heading,.category-heading{width:100%;border-collapse:collapse}.area-heading{border-bottom:1.5px solid #087447;margin-bottom:9px}.area-heading td,.category-heading td{vertical-align:bottom;padding:0 0 6px}.area-heading h2{font-size:13pt;color:#10233f;margin:2px 0 0}.area-max{text-align:right;color:#53667d;font-size:8pt;width:25%}.area-max strong{font-size:11pt;color:#10233f}.category{margin:12px 0 15px;page-break-inside:avoid}.category-heading h3{font-size:10pt;color:#152943;margin:0}.mode{font-size:7pt;text-transform:uppercase;letter-spacing:.5px;color:#607386;margin-top:3px}.category-max{text-align:right;white-space:nowrap;color:#607386;font-size:8pt}.category-max strong{font-size:10pt;color:#152943;margin-left:3px}.criteria-table{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:6px;font-size:8pt}.criteria-table thead{display:table-header-group}.criteria-table th{background:#eaf1f4;color:#263b53;text-align:left;font-size:7pt;text-transform:uppercase;letter-spacing:.3px;font-weight:bold;border:1px solid #b8c8d2;padding:6px 7px}.criteria-table td{border:1px solid #c4d0d8;padding:6px 7px;vertical-align:top;overflow-wrap:break-word}.criteria-table tbody tr:nth-child(even){background:#f8fafb}.criteria-table th:nth-child(1){width:21%}.criteria-table th:nth-child(2){width:45%}.criteria-table th:nth-child(3){width:16%;text-align:right}.criteria-table th:nth-child(4){width:18%;text-align:right}.criteria-table td:nth-child(3),.criteria-table td:nth-child(4){text-align:right}.criteria-table.compact-table th:nth-child(n){width:auto;text-align:left}.criteria-table.compact-table th:last-child,.criteria-table.compact-table td:last-child{text-align:right}.criteria-table.compact-table td{font-size:7.7pt}.table-caption{font-size:8pt;font-weight:bold;margin:6px 0 0}.category-cap{text-align:right;font-size:8pt;margin:4px 0 0}.empty-rules{color:#52657a;font-style:italic;padding:7px 8px;background:#f7faf8;border:1px solid #d4e0e5}.page-footer{border-top:1px solid #ccd8de;color:#718095;font-size:7pt;padding-top:4px;text-align:right}.page-footer span:first-child{float:left}';
    }

    private function groupLabel(string $group): string
    {
        return match (strtoupper($group)) {
            'FACULTY' => 'Faculty',
            'NON_TEACHING_FACULTY' => 'Non-Teaching Faculty',
            default => $group ?: 'Personnel',
        };
    }

    private function n(mixed $value): string
    {
        if (!is_numeric($value)) return $this->e($value ?? '');
        return rtrim(rtrim(sprintf('%.10F', (float)$value), '0'), '.') ?: '0';
    }

    private function e(mixed $value): string
    {
        return htmlspecialchars((string)($value ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}
