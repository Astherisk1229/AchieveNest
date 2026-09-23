<?php

namespace App\Services;

use InvalidArgumentException;

class PersonnelEvaluationSummaryService
{
    public function __construct(private ?FacultyEvaluationSummaryStrategy $faculty=null,private ?NonTeachingFacultyEvaluationSummaryStrategy $nonTeaching=null){$this->faculty??=new FacultyEvaluationSummaryStrategy();$this->nonTeaching??=new NonTeachingFacultyEvaluationSummaryStrategy();}
    public function build(array $evaluation,array $items,array $criteria,array $totals):array
    {
        $group=strtoupper((string)($evaluation['personnel_group_snapshot']??$evaluation['personnel_group']??''));
        return match($group){'FACULTY'=>$this->faculty->render($evaluation,$items,$criteria,$totals),'NON_TEACHING_FACULTY'=>$this->nonTeaching->render($evaluation,$items,$criteria,$totals),default=>throw new InvalidArgumentException('SUMMARY_CLASSIFICATION_UNRESOLVED: Evaluation personnel classification is missing or unsupported.')};
    }
}
