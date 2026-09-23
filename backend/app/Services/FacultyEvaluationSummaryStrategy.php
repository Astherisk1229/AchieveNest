<?php

namespace App\Services;

class FacultyEvaluationSummaryStrategy implements EvaluationSummaryStrategyInterface
{
    public function render(array $evaluation, array $items, array $criteria, array $totals): array
    {
        $sections = [
            'professional_development' => ['title'=>'Professional Development', 'items'=>[]],
            'productivity_creative_work' => ['title'=>'Productivity and Creative Work', 'items'=>[]],
            'service_leadership' => ['title'=>'Service and Leadership', 'items'=>[]],
        ];
        $areaMap = ['A'=>'professional_development', 'B'=>'productivity_creative_work', 'C'=>'service_leadership'];
        foreach ($items as $item) {
            $area = strtoupper((string) ($item['category_area'] ?? $item['area_code'] ?? $item['area'] ?? ''));
            $key = $areaMap[preg_replace('/^AREA_?/', '', $area)] ?? 'productivity_creative_work';
            $sections[$key]['items'][] = $this->item($item);
        }
        foreach ($sections as &$section) $section['points_earned'] = array_sum(array_column($section['items'], 'points_earned'));

        return [
            'format_key'=>'FACULTY_EVALUATION_SUMMARY', 'format_version'=>'official-structure-v1',
            'personnel_information'=>$this->personnel($evaluation),
            'present_rank'=>$evaluation['current_rank_title'] ?? $evaluation['current_rank'] ?? null,
            'rank_applied_for'=>$evaluation['rank_applied_for'] ?? null,
            'period_covered'=>$evaluation['period_name_snapshot'] ?? $evaluation['academic_year'] ?? null,
            'sections'=>array_values($sections),
            'documents_submitted'=>$this->documents($items),
            'total'=>(float) ($totals['total_score'] ?? 0),
            'passing_score'=>$this->passingScore($criteria),
            'recommended_rank'=>null,
            'effectivity'=>null,
            'comments'=>$evaluation['reviewer_remarks'] ?? null,
            'approvals'=>$this->approvalPlaceholders(),
            'unresolved_fields'=>$this->unresolved($evaluation, ['rank_applied_for'=>'Rank Applied For is not captured in the finalized evaluation snapshot.','recommended_rank'=>'Final rank recommendation rules are not approved.','effectivity'=>'Effectivity rules are not approved.']),
        ];
    }

    private function item(array $item): array { return ['document'=>$item['item_description'] ?? $item['achievement_title'] ?? $item['title'] ?? null, 'criterion_code'=>$item['criterion_code'] ?? null, 'points_earned'=>(float) ($item['awarded_points'] ?? $item['accepted_points'] ?? 0)]; }
    private function personnel(array $e): array { return ['profile_id'=>$e['personnel_profile_id'] ?? null,'name'=>$e['faculty_name'] ?? $e['personnel_name'] ?? null,'personnel_id'=>$e['institutional_id'] ?? null,'position'=>$e['position_title_snapshot'] ?? $e['designation'] ?? null,'department'=>$e['department_name_snapshot'] ?? null,'college'=>$e['college_name_snapshot'] ?? null]; }
    private function documents(array $items): array { return array_values(array_map(fn(array $i): array => ['title'=>$i['item_description'] ?? $i['achievement_title'] ?? null,'file_name'=>$i['file_name'] ?? $i['proof_file_name'] ?? null,'evidence_id'=>$i['evidence_id'] ?? null], $items)); }
    private function passingScore(array $criteria): float { return (float) ($criteria['version']['passing_score'] ?? $criteria['sheet']['passing_score'] ?? $criteria['passing_score'] ?? 0); }
    private function approvalPlaceholders(): array { return ['chair'=>['name'=>null,'signature'=>null,'date'=>null,'status'=>'unresolved'],'members'=>[['name'=>null,'signature'=>null,'date'=>null,'status'=>'unresolved']],'president'=>['name'=>null,'signature'=>null,'date'=>null,'status'=>'unresolved']]; }
    private function unresolved(array $e, array $fields): array { if (! empty($e['rank_applied_for'])) unset($fields['rank_applied_for']);if(empty($e['current_rank_title'])&&empty($e['current_rank']))$fields['present_rank']='Present Rank is not captured in the finalized evaluation snapshot.';if(empty($e['period_name_snapshot'])&&empty($e['academic_year']))$fields['period_covered']='Period Covered is unavailable.';return $fields + ['approvals'=>'Chair, Members, and President workflow is unresolved.']; }
}
