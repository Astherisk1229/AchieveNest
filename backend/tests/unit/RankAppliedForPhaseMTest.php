<?php

namespace Tests\Unit;

use CodeIgniter\Test\CIUnitTestCase;

final class RankAppliedForPhaseMTest extends CIUnitTestCase
{
    private function source(string $path):string{return file_get_contents(ROOTPATH.$path);}
    public function testNormalSuggestionIsOneActiveSequentialStepInsidePlacement():void{$s=$this->source('app/Services/RankAppliedForService.php');self::assertStringContainsString("'transition_type'=>'normal_sequential'",$s);self::assertStringContainsString("'m.rank_placement_group_id'=>\$groupId",$s);self::assertStringContainsString("'t.is_active'=>1",$s);}
    public function testOnlyExactVerifiedPhdExceptionIsOffered():void{$s=$this->source('app/Services/RankAppliedForService.php');self::assertStringContainsString("degree_level']==='doctorate'",$s);self::assertStringContainsString("'from_rank_code'=>'ASSISTANT_PROFESSOR_I'",$s);self::assertStringContainsString("'to_rank_code'=>'PROFESSOR_I'",$s);self::assertStringContainsString("'requires_verified_phd'=>1",$s);self::assertStringContainsString("'verification_status'=>'verified','record_state'=>'active'",$s);}
    public function testPlacementFailuresAndIncompatibilityAreBlocked():void{$s=$this->source('app/Services/RankAppliedForService.php');foreach(['PLACEMENT_AMBIGUOUS','PLACEMENT_NOT_YET_EFFECTIVE','PLACEMENT_ACTIVATION_FAILED','PLACEMENT_CANCELLED','CURRENT_PLACEMENT_MISSING','PRESENT_RANK_INCOMPATIBLE_WITH_PLACEMENT'] as $code)self::assertStringContainsString($code,$s);}
    public function testConfirmationRejectsArbitraryRankAndRequiresDeviationReason():void{$s=$this->source('app/Services/RankAppliedForService.php');self::assertStringContainsString('INVALID_RANK_APPLIED_FOR_OPTION',$s);self::assertStringContainsString('DEVIATION_JUSTIFICATION_REQUIRED',$s);self::assertStringContainsString("\$deviation?trim((string)\$justification):null",$s);}
    public function testStaleRankPlacementCredentialOrTrackContextIsRejected():void{$s=$this->source('app/Services/RankAppliedForService.php');foreach(["'rank'=>","'placement'=>","'credentials'=>","'cycle'=>","'cycle_updated'=>","'track'=>",'STALE_RANK_APPLIED_FOR_SUGGESTION'] as $term)self::assertStringContainsString($term,$s);}
    public function testAuthorityResolverEnforcesDeanDepartmentHeadAndExplicitHrScope():void{$s=$this->source('app/Services/RankAppliedForService.php');self::assertStringContainsString('resolveResponsibleAuthority',$s);self::assertStringContainsString('actorMayAct',$s);self::assertStringContainsString('REVIEWER_OUTSIDE_AUTHORIZED_SCOPE',$s);}
    public function testPersistencePreservesSuggestionConfirmationAndAudit():void{$m=$this->source('app/Database/Migrations/2026-09-15-000008_CreateRankAppliedForDecisions.php');foreach(['present_rank_code_snapshot','placement_id_snapshot','verified_credential_references','suggested_rank_code','confirmed_rank_code','deviation_reason','personnel_rank_applied_for_events'] as $field)self::assertStringContainsString($field,$m);}
    public function testPresentRankIsNeverMutated():void{$s=$this->source('app/Services/RankAppliedForService.php');self::assertStringNotContainsString("table('personnel_profiles')->where('profile_id',\$personnelId)->update",$s);self::assertStringNotContainsString('recommended_rank',$s);}
}
