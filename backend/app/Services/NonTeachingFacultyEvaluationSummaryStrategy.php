<?php

namespace App\Services;

class NonTeachingFacultyEvaluationSummaryStrategy implements EvaluationSummaryStrategyInterface
{
    public function render(array $evaluation, array $items, array $criteria, array $totals): array
    {
        $performance=[];$service=[];$unresolved=[];
        foreach($items as $item){
            $area=preg_replace('/^AREA_?/','',strtoupper((string)($item['category_area']??$item['area_code']??$item['area']??'')));
            $mapped=$this->item($item);
            if($area==='A'){
                foreach(['weight','percentage','ds'] as $field) if($mapped[$field]===null)$unresolved["performance_indicators.{$mapped['criterion_code']}.{$field}"]="{$field} is not present in the finalized item snapshot.";
                $performance[]=$mapped;
            }else{$service[]=$mapped;}
        }
        if(empty($evaluation['period_name_snapshot'])&&empty($evaluation['academic_year']))$unresolved['period_covered']='Period Covered is unavailable.';
        $passing=(float)($criteria['version']['passing_score']??$criteria['sheet']['passing_score']??$criteria['passing_score']??0);$total=(float)($totals['total_score']??0);
        return [
            'format_key'=>'NON_TEACHING_FACULTY_EVALUATION_RESULT','format_version'=>'completed-result-v1',
            'personnel_information'=>['profile_id'=>$evaluation['personnel_profile_id']??null,'name'=>$evaluation['faculty_name']??$evaluation['personnel_name']??null,'personnel_id'=>$evaluation['institutional_id']??null,'position'=>$evaluation['position_title_snapshot']??$evaluation['designation']??null,'department'=>$evaluation['department_name_snapshot']??null],
            'period_covered'=>$evaluation['period_name_snapshot']??$evaluation['academic_year']??null,
            'performance_personal_indicators'=>['title'=>'Performance and Personal Indicators','columns'=>['indicator','weight','percentage','ds','points_earned'],'items'=>$performance,'points_earned'=>array_sum(array_column($performance,'points_earned'))],
            'service_leadership'=>['title'=>'Service and Leadership','columns'=>['document','points_earned'],'items'=>$service,'points_earned'=>array_sum(array_column($service,'points_earned'))],
            'total'=>$total,'passing_score'=>$passing,'result'=>$total >= $passing ? 'Passed' : 'Retained',
            'comments'=>$evaluation['reviewer_remarks']??null,
            'unresolved_fields'=>$unresolved,
        ];
    }
    private function item(array $item): array
    {
        $criterion = $this->decode($item['criterion_snapshot'] ?? null);
        $scoring = $this->decode($item['scoring_payload'] ?? null);
        $ds = $item['ds'] ?? null;
        if ($ds === null && is_array($scoring['ds'] ?? null)) {
            $values = array_values(array_filter($scoring['ds'], 'is_numeric'));
            $ds = $values === [] ? null : round(array_sum($values) / count($values), 2);
        }

        return [
            'criterion_code' => $item['criterion_code'] ?? $criterion['code'] ?? null,
            'indicator' => $item['criterion_title'] ?? $criterion['name'] ?? $item['item_description'] ?? null,
            'document' => $item['item_description'] ?? $item['criterion_title'] ?? null,
            'weight' => $this->number($item['weight'] ?? $criterion['max_points'] ?? $item['configured_points_snapshot'] ?? $item['max_allowed_points'] ?? null),
            'percentage' => $this->number($item['percentage'] ?? $criterion['weight'] ?? null),
            'ds' => $this->number($ds),
            'points_earned' => (float) ($item['awarded_points'] ?? $item['accepted_points'] ?? 0),
        ];
    }

    private function decode(mixed $value): array
    {
        if (is_array($value)) return $value;
        if (! is_string($value) || $value === '') return [];
        $decoded = json_decode($value, true);
        return is_array($decoded) ? $decoded : [];
    }

    private function number(mixed $value): ?float
    {
        return is_numeric($value) ? (float) $value : null;
    }
}
