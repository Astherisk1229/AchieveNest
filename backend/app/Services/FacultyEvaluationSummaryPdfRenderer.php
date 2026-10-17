<?php

namespace App\Services;

use Mpdf\Mpdf;
use Mpdf\Output\Destination;
use RuntimeException;

/** Renders the saved Dean ranking scale as a downloadable A4 PDF. */
final class FacultyEvaluationSummaryPdfRenderer
{
    private const ROWS = [
        ['A.1.a', 'a. Ph.D. Holder', 'A', 40, '1. Degrees'],
        ['A.1.b', 'b. Ph.D. units (2 pts for every 3 units earned)', 'A', 10, '1. Degrees'],
        ['A.1.c', 'c. MA Holder', 'A', 20, '1. Degrees'],
        ['A.1.d', 'd. MA units (1 pt for every 3 units earned)', 'A', 10, '1. Degrees'],
        ['A.2', '2. Active Membership to Professional Organizations', 'A', 10, ''],
        ['A.3', '3. Attendance to Seminar / Workshop / Trainings', 'A', 20, ''],
        ['B.1', '1. Invited as Guest Lecturer / Consultant / Judge / Resource Person', 'B', 40, ''],
        ['B.2', '2. Publication (Scholarly Paper / Article / Research)', 'B', 40, ''],
        ['B.3', '3. Conduct of Research', 'B', 40, ''],
        ['B.4', '4. Professional Recognition or Awards', 'B', 40, ''],
        ['B.5', '5. Production of Instructional Materials', 'B', 40, ''],
        ['B.6', '6. Creative Work (Painting, Music, etc.)', 'B', 20, ''],
        ['C.1.1', 'a. Moderator / Officer of Clubs', 'C', 20, '1. Involvement in Extra-Curricular Activities / Recognized School Organizations'],
        ['C.1.2', 'b. Trainer / Coach', 'C', 20, '1. Involvement in Extra-Curricular Activities / Recognized School Organizations'],
        ['C.1.3', 'c. Membership in Working Committees', 'C', 20, '1. Involvement in Extra-Curricular Activities / Recognized School Organizations'],
        ['C.1.4', 'd. Rendered Service in School Activities', 'C', 10, '1. Involvement in Extra-Curricular Activities / Recognized School Organizations'],
        ['C.2.1', 'a. Active Involvement in Church Activities', 'C', 25, '2. Community Involvement'],
        ['C.2.2', 'b. Active Involvement in Community / Civic Activities', 'C', 25, '2. Community Involvement'],
        ['C.2.3', 'c. Support to Charity and Community Projects', 'C', 5, '2. Community Involvement'],
        ['C.3', '3. No. of Years at NDMU (1 pt for every 2 years)', 'C', 10, ''],
    ];

    public function render(array $report, array $context): string
    {
        $tempDir = null;
        foreach ([rtrim(WRITEPATH, '\\/') . DIRECTORY_SEPARATOR . 'cache' . DIRECTORY_SEPARATOR . 'faculty-summary-pdf',
            rtrim(sys_get_temp_dir(), '\\/') . DIRECTORY_SEPARATOR . 'achievenest-faculty-summary-pdf'] as $candidate) {
            $ready = true;
            foreach ([$candidate, $candidate . DIRECTORY_SEPARATOR . 'mpdf', $candidate . DIRECTORY_SEPARATOR . 'mpdf' . DIRECTORY_SEPARATOR . 'ttfontdata'] as $cacheDir) {
                if ((! is_dir($cacheDir) && ! @mkdir($cacheDir, 0755, true) && ! is_dir($cacheDir)) || ! is_writable($cacheDir)) {
                    $ready = false;
                    break;
                }
            }
            if ($ready) { $tempDir = $candidate; break; }
        }
        if ($tempDir === null) throw new RuntimeException('PDF_TEMP_DIRECTORY_UNAVAILABLE');
        $pdf = new Mpdf(['mode' => 'utf-8', 'format' => 'A4', 'tempDir' => $tempDir,
            'margin_left' => 12, 'margin_right' => 12, 'margin_top' => 12, 'margin_bottom' => 12,
            'default_font' => 'times']);
        $pdf->SetTitle('Administrators Ranking Scale');
        $pdf->SetAuthor('Notre Dame of Marbel University');
        $pdf->WriteHTML($this->html($report, $context));
        return $pdf->Output('', Destination::STRING_RETURN);
    }

    private function html(array $report, array $context): string
    {
        $summary = $report['official_summary'];
        $person = $summary['personnel_information'] ?? [];
        $snapshot = $report['criteria_snapshot'] ?? [];
        $sectionTotals = $report['section_totals'] ?? [];
        $titles = ['A' => 'A. Professional Development', 'B' => 'B. Productivity and Creative Work', 'C' => 'C. Service and Leadership'];
        $maxima = ['A' => 70, 'B' => 50, 'C' => 40];
        $rows = '';
        foreach ($titles as $area => $title) {
            $rows .= '<tr class="area"><th colspan="4">' . $this->e($title) . '</th></tr>';
            $lastParent = '';
            foreach (self::ROWS as [$code, $label, $rowArea, $defaultWeight, $parent]) {
                if ($rowArea !== $area) continue;
                if ($parent !== '' && $parent !== $lastParent) $rows .= '<tr class="parent"><th colspan="4">' . $this->e($parent) . '</th></tr>';
                if ($parent !== '') $lastParent = $parent;
                $matches = array_values(array_filter($report['items'] ?? [], fn ($item) => $this->matches($code, $item)));
                $names = array_values(array_filter(array_map(fn ($item) => $item['achievement'] ?? $item['item_description'] ?? '', $matches)));
                $aggregate = $this->graduateAggregate($summary, $code);
                $points = $aggregate ?? array_sum(array_map(fn ($item) => (float) ($item['awarded_points'] ?? 0), $matches));
                $weight = $this->weight($snapshot, $code, $area, $defaultWeight);
                $rows .= '<tr><td>' . $this->e($label) . '</td><td class="number">' . $this->n($weight) . '</td><td>' . ($names ? $this->e(implode('; ', $names)) : '—') . '</td><td class="number">' . ($names || $points ? $this->n($points) : '—') . '</td></tr>';
            }
            $areaDefinition = $this->area($snapshot, $area);
            $rows .= '<tr class="total"><td class="right"><i>Maximum Points</i></td><td class="number">' . $this->n($areaDefinition['max_points'] ?? $maxima[$area]) . '</td><td></td><td class="number">' . $this->n($sectionTotals[$area] ?? 0) . '</td></tr>';
        }
        $maximum = $snapshot['version']['total_max_points'] ?? $snapshot['sheet']['overall_max_points'] ?? 160;
        $rows .= '<tr class="total"><td class="right">TOTAL</td><td class="number">' . $this->n($maximum) . '</td><td></td><td class="number">' . $this->n($report['grand_total'] ?? 0) . '</td></tr>';

        $applied = $context['rank_applied_for'] ?? $summary['rank_applied_for'] ?? 'Not recorded in Annual Review';
        if (($context['rank_applied_for_status'] ?? '') === 'suggested') $applied .= ' (suggested, awaiting confirmation)';
        $finished = $context['effectivity'] ?? $report['completed_at'] ?? $report['generated_at'] ?? null;
        $effectivity = $finished ? substr((string) $finished, 0, 10) : 'Evaluation completion date unavailable';
        $comments = $context['comments'] ?? $summary['comments'] ?? '';
        $passing = $summary['passing_score'] ?? $snapshot['version']['passing_score'] ?? $snapshot['sheet']['passing_score'] ?? null;
        $job = $context['specific_job'] ?? $person['position'] ?? $report['assignment']['position'] ?? 'Job title not recorded';
        $period = $summary['period_covered'] ?? $report['evaluation_period']['name'] ?? $report['evaluation_period']['academic_year'] ?? 'Period not recorded';

        return '<style>body{font-family:times;font-size:8.5pt;color:#111}h1,h2,p{margin:0}header{text-align:center;margin-bottom:8px}h1{font-size:13pt;text-transform:uppercase}h2{font-size:12pt;text-transform:uppercase;margin-top:6px}.meta{width:100%;margin:4px 0}.meta td{width:50%;padding:2px 4px;vertical-align:top}.name{border:1px solid #111;font-weight:bold}table.scale{width:100%;border-collapse:collapse;margin-top:6px}table.scale th,table.scale td{border:1px solid #111;padding:2px 4px;vertical-align:top}table.scale thead th{text-align:center}.area th,.parent th{text-align:left}.area th{font-size:9pt}.number{text-align:right}.right{text-align:right}.total{font-weight:bold}.after{margin-top:5px}.details{width:100%;margin-top:10px}.details td{width:50%;padding:2px 0;vertical-align:top}.signature{border-top:1px solid #111;margin-top:10px;padding-top:4px}</style>'
            . '<header><h1>Notre Dame of Marbel University</h1><p><i>City of Koronadal, South Cotabato</i></p><h2>Administrators Ranking Scale</h2></header>'
            . '<table class="meta name"><tr><td>Name: ' . $this->e($person['name'] ?? $report['personnel']['full_name'] ?? '') . '</td><td>Department: ' . $this->e($person['department'] ?? $report['assignment']['department'] ?? '') . '</td></tr></table>'
            . '<table class="meta"><tr><td>Specific Job: ' . $this->e($job) . '</td><td>Employee’s Progress Last Ranking: ' . $this->e($context['previous_rank'] ?? 'No prior rank recorded') . '</td></tr><tr><td>Present Rank: ' . $this->e($context['present_rank'] ?? $summary['present_rank'] ?? 'Present rank not recorded') . '</td><td>Period Covered: ' . $this->e($period) . '</td></tr><tr><td colspan="2">Rank Applied for: ' . $this->e($applied) . '</td></tr></table>'
            . '<table class="scale"><thead><tr><th width="49%">Criteria</th><th width="11%">Weight<br>(pts)</th><th width="30%">Documents Submitted</th><th width="10%">Points<br>Earned</th></tr></thead><tbody>' . $rows . '</tbody></table>'
            . '<p class="after"><b><i>Passing Score: ' . ($passing === null ? '—' : $this->n($passing) . ' POINTS') . '</i></b></p>'
            . '<table class="details"><tr><td><b>Recommended Rank:</b> ' . $this->e($context['recommended_rank'] ?? 'Recommendation unavailable') . '</td><td><b>Effectivity:</b> ' . $this->e($effectivity) . '</td></tr><tr><td colspan="2"><b>Comments:</b> ' . nl2br($this->e($comments ?: '—')) . '</td></tr></table>'
            . '<div class="signature"><b>Recommended for Approval:</b></div><table class="details"><tr><td>Chair: __________________________</td><td>Members: ________________________<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;________________________<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;________________________</td></tr><tr><td>Approved: ______________________<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;President</td><td>Date: __________________________</td></tr></table>';
    }

    private function matches(string $code, array $item): bool
    {
        $criterion = $item['criterion_snapshot'] ?? [];
        if (is_string($criterion)) $criterion = json_decode($criterion, true) ?: [];
        $reference = strtoupper((string) ($criterion['criterion_reference'] ?? $item['criterion_key'] ?? $item['criterion_code'] ?? ''));
        $category = strtoupper((string) ($item['criterion_code'] ?? $criterion['category']['category_code'] ?? ''));
        $graduate = ['A.1.a' => ['A.1.1', 'A1_PHD_HOLDER'], 'A.1.b' => ['A.1.2', 'A1_PHD_UNITS'], 'A.1.c' => ['A.1.3', 'A1_MA_HOLDER'], 'A.1.d' => ['A.1.4', 'A1_MA_UNITS']];
        if (isset($graduate[$code])) return in_array($reference, $graduate[$code], true);
        $code = strtoupper($code);
        if (str_starts_with($code, 'C.1.') || str_starts_with($code, 'C.2.')) return $reference === $code || $category === $code;
        return $reference === $code || $category === $code;
    }

    private function graduateAggregate(array $summary, string $code): ?float
    {
        $key = ['A.1.b' => 'A.1.2', 'A.1.d' => 'A.1.4'][$code] ?? null;
        if ($key === null) return null;
        foreach ($summary['sections'] ?? [] as $section) foreach ($section['items'] ?? [] as $item) {
            if (! empty($item['aggregate']) && strtoupper((string) ($item['criterion_code'] ?? '')) === $key) return (float) ($item['points_earned'] ?? $item['points'] ?? 0);
        }
        return null;
    }

    private function area(array $snapshot, string $code): array
    {
        foreach ($snapshot['areas'] ?? [] as $area) if (strtoupper((string) ($area['area_code'] ?? '')) === $code) return $area;
        return [];
    }

    private function weight(array $snapshot, string $code, string $areaCode, float $default): float
    {
        $parent = str_starts_with($code, 'A.1.') ? 'A.1' : (str_starts_with($code, 'C.1.') ? 'C.1' : (str_starts_with($code, 'C.2.') ? 'C.2' : $code));
        foreach ($this->area($snapshot, $areaCode)['categories'] ?? [] as $category) {
            if (strtoupper((string) ($category['category_code'] ?? '')) !== $parent) continue;
            if ($parent !== $code) {
                $leaf = ['A.1.a' => 'A.1.1', 'A.1.b' => 'A.1.2', 'A.1.c' => 'A.1.3', 'A.1.d' => 'A.1.4'][$code] ?? $code;
                foreach ($category['subcategories'] ?? [] as $subcategory) if (strtoupper((string) ($subcategory['subcategory_code'] ?? '')) === $leaf) return (float) ($subcategory['default_points'] ?? $default);
            }
            return (float) ($category['max_points'] ?? $default);
        }
        return $default;
    }

    private function e(mixed $value): string { return htmlspecialchars((string) ($value ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
    private function n(mixed $value): string { return number_format((float) $value, 2); }
}
