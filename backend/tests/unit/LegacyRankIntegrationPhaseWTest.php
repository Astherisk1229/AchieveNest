<?php
use PHPUnit\Framework\TestCase;

final class LegacyRankIntegrationPhaseWTest extends TestCase
{
    private function source(string $path):string{return file_get_contents(ROOTPATH.$path);}

    public function testLegacyPresentRankIsReadWithoutFabricatedHistory():void{$s=$this->source('app/Services/RankHistoryCorrectionService.php');self::assertStringContainsString("select('current_rank_title')",$s);self::assertStringContainsString('legacy_present_rank_only',$s);$method=$this->between($s,'public function compatibility','private function fullProjection');self::assertStringNotContainsString('insert(',$method);self::assertStringNotContainsString('personnel_rank_placements',$method);}
    public function testReviewerCanResolveLegacyPersonnelWithoutRankHistory():void{$s=$this->source('app/Services/RankHistoryCorrectionService.php');self::assertStringContainsString("\$track=\$t?",$s);self::assertStringContainsString('resolveResponsibleAuthority($p,$track)',$s);}
    public function testTransitionReconciliationNeverReactivatesUnsupportedLegacyEdges():void{$m=$this->source('app/Database/Migrations/2026-09-15-000005_ReconcileAuthoritativeFacultyRankTransitions.php');$down=substr($m,strpos($m,'public function down'));self::assertStringNotContainsString("update(['is_active' => 1])",$down);self::assertStringNotContainsString('->delete()',$down);self::assertStringContainsString("'ASSISTANT_PROFESSOR_I'",$m);self::assertStringContainsString("'PROFESSOR_I'",$m);self::assertStringContainsString("'phd_exception'",$m);}
    public function testOfficialDocumentRemainsBoundToFinalizedSnapshots():void{$s=$this->source('app/Services/OfficialEvaluationDocumentService.php');foreach(['FINALIZED_EVALUATION_VERSION_MISMATCH','final_rank_applied_for_code','final_recommended_rank_code','summary_payload','evaluation_version']as$x)self::assertStringContainsString($x,$s);self::assertStringContainsString("\$summary['effectivity']=null",$s);self::assertStringContainsString('blankApprovals',$s);}
    public function testPlacementFoundationDoesNotBackfillPersonnelHistory():void{$m=$this->source('app/Database/Migrations/2026-09-15-000004_CreateRankPlacementDomain.php');self::assertStringNotContainsString('INSERT INTO personnel_rank_placements',$m);self::assertStringContainsString('CREATE TABLE IF NOT EXISTS personnel_rank_placements',$m);self::assertStringContainsString('LEFT JOIN rank_placement_group_ranks',$m);}
    private function between(string$s,string$a,string$b):string{$i=strpos($s,$a);$j=strpos($s,$b,$i);return substr($s,$i,$j-$i);}
}
