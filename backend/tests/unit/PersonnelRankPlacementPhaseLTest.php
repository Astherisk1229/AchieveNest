<?php

namespace Tests\Unit;

use CodeIgniter\Test\CIUnitTestCase;

final class PersonnelRankPlacementPhaseLTest extends CIUnitTestCase
{
    private function source(string $path):string{return file_get_contents(ROOTPATH.$path);}

    public function testSuggestionUsesOnlyVerifiedActiveCanonicalCredentials():void
    {
        $s=$this->source('app/Services/PersonnelRankPlacementService.php');
        self::assertStringContainsString("->where('verification_status', 'verified')->where('record_state', 'active')",$s);
        self::assertStringNotContainsString('qualification_summary',$s);
        self::assertStringNotContainsString('keyword',strtolower($s));
    }

    public function testOnlyFourConfirmedMappingsExist():void
    {
        $s=$this->source('app/Services/PersonnelRankPlacementService.php');
        foreach(["degree_level'] === 'masters'","degree_level'] === 'doctorate'","board_licensure_status'] === 'board_passer'","board_licensure_status'] === 'non_board'"] as $rule)self::assertStringContainsString($rule,$s);
        self::assertStringNotContainsString("degree_level'] === 'baccalaureate'",$s);
        self::assertStringContainsString('NON_TEACHING_RANK_CATALOG_UNRESOLVED',$s);
        self::assertStringContainsString('PART_TIME_PLACEMENT_UNRESOLVED',$s);
    }

    public function testMultipleCandidateGroupsAreExplicitlyAmbiguous():void
    {
        $s=$this->source('app/Services/PersonnelRankPlacementService.php');
        self::assertStringContainsString("count(\$tiers) > 1 ? 'ambiguous'",$s);
        self::assertStringContainsString('HR policy precedence is required',$s);
        self::assertStringContainsString('PLACEMENT_SUGGESTION_NOT_CONFIRMABLE',$s);
    }

    public function testPendingAndFailedPlacementShareUniquenessGuard():void
    {
        $m=$this->source('app/Database/Migrations/2026-09-15-000007_CreatePlacementSuggestionLifecycle.php');
        self::assertStringContainsString("status IN ('pending_future','activation_failed')",$m);
        self::assertStringContainsString('personnel_rank_placement_events',$m);
    }

    public function testLifecycleSupportsActivationFailureRetryCorrectionAndCancellation():void
    {
        $s=$this->source('app/Services/PersonnelRankPlacementService.php');
        foreach(['activateDue','activation_failed','activation_retried','correct(','cancel('] as $term)self::assertStringContainsString($term,$s);
        self::assertStringContainsString('CANCELLATION_REASON_REQUIRED',$s);
        self::assertStringContainsString('CORRECTION_REASON_REQUIRED',$s);
    }

    public function testPresentRankIsNeverMutated():void
    {
        $s=$this->source('app/Services/PersonnelRankPlacementService.php');
        self::assertStringNotContainsString('current_rank_title',$s);
        self::assertStringNotContainsString('faculty_rank_catalog',$s);
    }

    public function testVisibilityAndHrMutationRoutesAreServerAuthorized():void
    {
        $c=$this->source('app/Controllers/Api/PersonnelRankPlacementController.php');
        self::assertStringContainsString("hasRole(\$a,'hr_staff')",$c);
        self::assertStringContainsString("hasAnyRole(\$a,['dean','department_head'])",$c);
        self::assertStringContainsString('actorMayAct',$c);
        self::assertStringContainsString('history($personnelId,true)',$c);
    }
}
