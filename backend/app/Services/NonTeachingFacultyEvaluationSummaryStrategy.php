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
        if(empty($evaluation['current_rank_title'])&&empty($evaluation['current_rank']))$unresolved['present_rank']='Present Rank is not captured in the finalized evaluation snapshot.';if(empty($evaluation['rank_applied_for']))$unresolved['rank_applied_for']='Rank Applied For is not captured in the finalized evaluation snapshot.';if(empty($evaluation['period_name_snapshot'])&&empty($evaluation['academic_year']))$unresolved['period_covered']='Period Covered is unavailable.';
        $passing=(float)($criteria['version']['passing_score']??$criteria['sheet']['passing_score']??$criteria['passing_score']??0);$total=(float)($totals['total_score']??0);
        return [
            'format_key'=>'NON_TEACHING_FACULTY_RANKING_SCALE','format_version'=>'official-structure-v1',
            'personnel_information'=>['profile_id'=>$evaluation['personnel_profile_id']??null,'name'=>$evaluation['faculty_name']??$evaluation['personnel_name']??null,'personnel_id'=>$evaluation['institutional_id']??null,'position'=>$evaluation['position_title_snapshot']??$evaluation['designation']??null,'department'=>$evaluation['department_name_snapshot']??null],
            'present_rank'=>$evaluation['current_rank_title']??$evaluation['current_rank']??null,
            'rank_applied_for'=>$evaluation['rank_applied_for']??null,
            'period_covered'=>$evaluation['period_name_snapshot']??$evaluation['academic_year']??null,
            'performance_personal_indicators'=>['title'=>'Performance and Personal Indicators','columns'=>['indicator','weight','percentage','ds','points_earned'],'items'=>$performance,'points_earned'=>array_sum(array_column($performance,'points_earned'))],
            'service_leadership'=>['title'=>'Service and Leadership','columns'=>['document','points_earned'],'items'=>$service,'points_earned'=>array_sum(array_column($service,'points_earned'))],
            'total'=>$total,'passing_score'=>$passing,'result'=>$total >= $passing ? 'Passed' : 'Retained',
            'recommended_rank'=>null,'effectivity'=>null,'comments'=>$evaluation['reviewer_remarks']??null,
            'approvals'=>['chair'=>['name'=>null,'signature'=>null,'date'=>null,'status'=>'unresolved'],'members'=>[['name'=>null,'signature'=>null,'date'=>null,'status'=>'unresolved']],'president'=>['name'=>null,'signature'=>null,'date'=>null,'status'=>'unresolved']],
            'unresolved_fields'=>$unresolved+['recommended_rank'=>'Final rank recommendation rules are not approved.','effectivity'=>'Effectivity rules are not approved.','approvals'=>'Chair, Members, and President workflow is unresolved.'],
        ];
    }
    private function item(array $i):array{return['criterion_code'=>$i['criterion_code']??null,'indicator'=>$i['criterion_title']??$i['item_description']??null,'document'=>$i['item_description']??null,'weight'=>isset($i['weight'])?(float)$i['weight']:null,'percentage'=>isset($i['percentage'])?(float)$i['percentage']:null,'ds'=>isset($i['ds'])?(float)$i['ds']:null,'points_earned'=>(float)($i['awarded_points']??$i['accepted_points']??0)];}
}
