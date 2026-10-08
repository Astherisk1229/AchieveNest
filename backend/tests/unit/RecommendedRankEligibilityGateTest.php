<?php

namespace Tests\Unit;

use App\Services\RecommendedRankService;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * R3: a rank can only be recommended when the rank conditions captured at
 * portfolio submission (service length, probationary rule, annual reviews) were met.
 */
final class RecommendedRankEligibilityGateTest extends CIUnitTestCase
{
    public function testEligibleSnapshotPasses(): void
    {
        $snapshot = ['eligibility_status' => 'eligible', 'annual_review_requirement' => ['status' => 'passed'], 'research_output_requirement' => ['required' => true, 'status' => 'passed']];
        self::assertNull(RecommendedRankService::eligibilityFailure(json_encode($snapshot)));
        self::assertNull(RecommendedRankService::eligibilityFailure($snapshot));
    }

    public function testIneligibleSnapshotIsRefused(): void
    {
        foreach (['ineligible', 'pending', 'not_eligible'] as $status) {
            self::assertSame('EVALUATION_ELIGIBILITY_NOT_MET', RecommendedRankService::eligibilityFailure(json_encode(['eligibility_status' => $status])));
        }
    }

    public function testUnreadableSnapshotIsRefused(): void
    {
        self::assertSame('EVALUATION_ELIGIBILITY_UNREADABLE', RecommendedRankService::eligibilityFailure('{not json'));
    }

    public function testLegacyEvaluationsWithoutRequiredSnapshotAreBlocked(): void
    {
        self::assertSame('EVALUATION_ELIGIBILITY_UNREADABLE', RecommendedRankService::eligibilityFailure(null));
        self::assertSame('EVALUATION_ELIGIBILITY_UNREADABLE', RecommendedRankService::eligibilityFailure(''));
        self::assertSame('EVALUATION_ELIGIBILITY_NOT_MET', RecommendedRankService::eligibilityFailure(json_encode(['evaluation_period_id' => 'x'])));
    }

    public function testAnnualReviewsAndResearchOutputMustBothPass(): void
    {
        $base = ['eligibility_status' => 'eligible', 'annual_review_requirement' => ['status' => 'passed'], 'research_output_requirement' => ['required' => true, 'status' => 'passed']];
        $annual = $base; $annual['annual_review_requirement']['status'] = 'not_passed';
        $research = $base; $research['research_output_requirement']['status'] = 'pending';
        self::assertSame('EVALUATION_ANNUAL_REVIEW_NOT_MET', RecommendedRankService::eligibilityFailure($annual));
        self::assertSame('EVALUATION_RESEARCH_OUTPUT_NOT_MET', RecommendedRankService::eligibilityFailure($research));
    }

    public function testGateRunsInsideRecommendationContext(): void
    {
        $source = file_get_contents(ROOTPATH . 'app/Services/RecommendedRankService.php');
        self::assertStringContainsString("self::eligibilityFailure(\$e['eligibility_snapshot']??null)", $source);
    }
}
