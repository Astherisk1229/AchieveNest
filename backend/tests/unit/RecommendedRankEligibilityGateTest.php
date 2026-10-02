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
        self::assertNull(RecommendedRankService::eligibilityFailure(json_encode(['eligibility_status' => 'eligible'])));
        self::assertNull(RecommendedRankService::eligibilityFailure(['eligibility_status' => 'eligible']));
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

    public function testLegacyEvaluationsWithoutSnapshotAreNotBlocked(): void
    {
        self::assertNull(RecommendedRankService::eligibilityFailure(null));
        self::assertNull(RecommendedRankService::eligibilityFailure(''));
        self::assertNull(RecommendedRankService::eligibilityFailure(json_encode(['evaluation_period_id' => 'x'])));
    }

    public function testGateRunsInsideRecommendationContext(): void
    {
        $source = file_get_contents(ROOTPATH . 'app/Services/RecommendedRankService.php');
        self::assertStringContainsString("self::eligibilityFailure(\$e['eligibility_snapshot']??null)", $source);
    }
}
