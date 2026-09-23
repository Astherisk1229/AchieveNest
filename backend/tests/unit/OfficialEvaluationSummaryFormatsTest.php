<?php

namespace Tests\Unit;

use App\Services\PersonnelEvaluationSummaryService;
use PHPUnit\Framework\TestCase;

final class OfficialEvaluationSummaryFormatsTest extends TestCase
{
    private array $criteria=['version'=>['passing_score'=>75]];
    private array $totals=['total_score'=>80];

    public function testFacultyUsesOfficialFacultyStructure():void
    {
        $dto=(new PersonnelEvaluationSummaryService())->build(['personnel_group_snapshot'=>'FACULTY','personnel_profile_id'=>'p1'],[['category_area'=>'A','item_description'=>'Seminar','awarded_points'=>10]],$this->criteria,$this->totals);
        self::assertSame('FACULTY_EVALUATION_SUMMARY',$dto['format_key']);
        self::assertSame(['Professional Development','Productivity and Creative Work','Service and Leadership'],array_column($dto['sections'],'title'));
        self::assertSame(80.0,$dto['total']);self::assertSame(75.0,$dto['passing_score']);
        self::assertNull($dto['recommended_rank']);self::assertNull($dto['effectivity']);self::assertSame('unresolved',$dto['approvals']['president']['status']);
    }

    public function testNonTeachingUsesOfficialWeightedStructure():void
    {
        $dto=(new PersonnelEvaluationSummaryService())->build(['personnel_group_snapshot'=>'NON_TEACHING_FACULTY','personnel_profile_id'=>'p2'],[['category_area'=>'A','criterion_code'=>'A.1','item_description'=>'Performance','weight'=>50,'percentage'=>90,'ds'=>4.5,'awarded_points'=>45]],$this->criteria,$this->totals);
        self::assertSame('NON_TEACHING_FACULTY_RANKING_SCALE',$dto['format_key']);
        self::assertSame(['indicator','weight','percentage','ds','points_earned'],$dto['performance_personal_indicators']['columns']);
        self::assertSame('Passed',$dto['result']);self::assertSame(50.0,$dto['performance_personal_indicators']['items'][0]['weight']);
        self::assertNull($dto['recommended_rank']);self::assertNull($dto['effectivity']);
    }

    public function testMissingOfficialValuesAreFlaggedNotGuessed():void
    {
        $dto=(new PersonnelEvaluationSummaryService())->build(['personnel_group_snapshot'=>'NON_TEACHING_FACULTY'],[['category_area'=>'A','criterion_code'=>'A.1']],$this->criteria,$this->totals);
        self::assertArrayHasKey('performance_indicators.A.1.weight',$dto['unresolved_fields']);
        self::assertArrayHasKey('rank_applied_for',$dto['unresolved_fields']);
        self::assertArrayHasKey('approvals',$dto['unresolved_fields']);
    }
}
