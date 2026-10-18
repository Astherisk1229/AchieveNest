<?php

namespace Tests\Unit;

require_once dirname(__DIR__, 2) . '/vendor/autoload.php';

use App\Services\RecommendedRankService;
use PHPUnit\Framework\TestCase;

final class RecommendedRankSummaryRecommendationTest extends TestCase
{
    public function testPassingEvaluationUsesTheSystemSuggestedAppliedRankWithoutAConfirmationGate(): void
    {
        self::assertSame('Assistant Professor', RecommendedRankService::summaryRecommendation(
            90,
            75,
            'Assistant Instructor',
            'Assistant Professor'
        ));
    }

    public function testFailingEvaluationRetainsPresentRank(): void
    {
        self::assertSame('Assistant Instructor', RecommendedRankService::summaryRecommendation(
            70,
            75,
            'Assistant Instructor',
            'Assistant Professor'
        ));
    }

    public function testMissingThresholdOrAppliedRankDoesNotInventARecommendation(): void
    {
        self::assertNull(RecommendedRankService::summaryRecommendation(90, 0, 'Assistant Instructor', 'Assistant Professor'));
        self::assertNull(RecommendedRankService::summaryRecommendation(90, 75, 'Assistant Instructor', null));
    }
}
