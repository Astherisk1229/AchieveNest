<?php

namespace App\Services;

/** Classification-aware printable HTML for the released Personnel result. */
final class PersonnelCompletedEvaluationResultHtmlRenderer
{
    public function render(array $result): string
    {
        $e = static fn(mixed $value): string => htmlspecialchars((string) ($value ?? ''), ENT_QUOTES, 'UTF-8');
        $group = (string) ($result['personnel']['group'] ?? '');
        $title = $group === 'FACULTY' ? 'Faculty Evaluation Result' : 'Non-Teaching Faculty Evaluation Result';
        $summary = (array) ($result['summary'] ?? []);
        $rows = '';
        if ($group === 'FACULTY') {
            foreach ((array) ($summary['sections'] ?? []) as $section) {
                $rows .= '<tr><th colspan="2">'.$e($section['title'] ?? '').'</th></tr>';
                foreach ((array) ($section['items'] ?? []) as $item) $rows .= '<tr><td>'.$e($item['document'] ?? '').'</td><td class="num">'.$e(number_format((float) ($item['points_earned'] ?? 0), 2)).'</td></tr>';
            }
        } else {
            $rows .= '<tr><th colspan="5">A. Performance and Personal Indicators</th></tr>';
            foreach ((array) ($summary['performance_personal_indicators']['items'] ?? []) as $item) {
                $rows .= '<tr><td>'.$e(($item['criterion_code'] ?? '').' — '.($item['indicator'] ?? '')).'</td><td class="num">'.$e($item['weight'] ?? '').'</td><td class="num">'.$e($item['percentage'] ?? '').'</td><td class="num">'.$e($item['ds'] ?? '').'</td><td class="num">'.$e(number_format((float) ($item['points_earned'] ?? 0), 2)).'</td></tr>';
            }
            $rows .= '<tr><th colspan="4" class="num">Category Total</th><th class="num">'.$e(number_format((float) ($summary['performance_personal_indicators']['points_earned'] ?? 0), 2)).'</th></tr><tr><th colspan="5">B. Service and Leadership</th></tr>';
            foreach ((array) ($summary['service_leadership']['items'] ?? []) as $item) {
                $rows .= '<tr><td>'.$e(($item['criterion_code'] ?? '').' — '.($item['document'] ?? '')).'</td><td class="num">'.$e($item['weight'] ?? '').'</td><td></td><td></td><td class="num">'.$e(number_format((float) ($item['points_earned'] ?? 0), 2)).'</td></tr>';
            }
            $rows .= '<tr><th colspan="4" class="num">Category Total</th><th class="num">'.$e(number_format((float) ($summary['service_leadership']['points_earned'] ?? 0), 2)).'</th></tr>';
        }
        $heading = $group === 'FACULTY'
            ? '<tr><th>Evaluated item</th><th class="num">Points</th></tr>'
            : '<tr><th>Criteria</th><th class="num">Weight</th><th class="num">%</th><th class="num">DS</th><th class="num">Points Earned</th></tr>';
        $institution = $group === 'FACULTY' ? '' : '<p class="appendix">Appendix N</p><p class="institution"><b>NOTRE DAME OF MARBEL UNIVERSITY</b><br>City of Koronadal, South Cotabato</p>';
        $officialTitle = $group === 'FACULTY' ? $title : 'NON-TEACHING PERSONNEL RANKING SCALE';
        $outcome = $group === 'FACULTY' ? '' : '<p><b>Passing Score:</b> '.$e(number_format((float) ($result['scores']['passing'] ?? $summary['passing_score'] ?? 0), 2)).' points &nbsp; <b>Result:</b> '.$e($summary['result'] ?? '').' &nbsp; <b>Effectivity:</b> ____________________</p><p><b>Recommended Rank:</b> ____________________</p><p><b>Comments:</b> '.$e($summary['comments'] ?? '').'</p><div class="approvals">Recommended for Approval: ____________________ &nbsp; Members: ____________________<br><br>Chair: ____________________ &nbsp; Approved / President: ____________________</div>';
        return '<!doctype html><html><head><meta charset="utf-8"><title>'.$e($title).'</title><style>@page{size:A4;margin:14mm}body{font:12px Arial;color:#111}.sheet{border:1px solid #111;padding:18px;position:relative}.appendix{text-align:right;margin:0}.institution{text-align:center;margin:0}h1{text-align:center;font-size:16px;text-decoration:underline}dl{display:grid;grid-template-columns:130px 1fr;gap:4px}dt{font-weight:bold}dd{margin:0;border-bottom:1px solid #111}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #111;padding:5px}th{background:#eee;text-align:left}.num{text-align:right}.total{font-size:14px;font-weight:bold;text-align:right}.approvals{margin-top:16px;min-height:70px}.foot{margin-top:18px;font-size:9px;color:#555}</style></head><body><main class="sheet">'.$institution.'<h1>'.$e($officialTitle).'</h1><dl><dt>Personnel</dt><dd>'.$e($result['personnel']['name'] ?? '').'</dd><dt>Specific Job</dt><dd>'.$e($result['personnel']['position'] ?? '').'</dd><dt>Department</dt><dd>'.$e($result['personnel']['department'] ?? $result['personnel']['college'] ?? '').'</dd><dt>Period Covered</dt><dd>'.$e($summary['period_covered'] ?? $result['evaluation_period']['name'] ?? $result['evaluation_period']['academic_year'] ?? '').'</dd></dl><table><thead>'.$heading.'</thead><tbody>'.$rows.'</tbody></table><p class="total">Total: '.$e(number_format((float) ($result['scores']['total'] ?? 0), 2)).' / '.$e(number_format((float) ($result['scores']['maximum'] ?? 0), 2)).'</p>'.$outcome.'<p class="foot">Immutable completed result · Report '.$e($result['result_snapshot']['report_id'] ?? '').' · Generated '.$e($result['result_snapshot']['generated_at'] ?? '').'</p></main></body></html>';
    }
}
