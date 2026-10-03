<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\ApprovedAchievementScoringService;
use CodeIgniter\Test\CIUnitTestCase;
use RuntimeException;

final class ApprovedAchievementScoringStep6Test extends CIUnitTestCase
{
    public function testErrorCodeNeverLeaksMessageText(): void
    {
        self::assertSame('NO_ACTIVE_CYCLE', ApprovedAchievementScoringService::errorCode(new RuntimeException('NO_ACTIVE_CYCLE')));
        self::assertSame('SCORING_TRACE_RECONCILIATION_FAILED', ApprovedAchievementScoringService::errorCode(new RuntimeException('SCORING_TRACE_RECONCILIATION_FAILED:CRIT_X:1:2')));
        self::assertSame('SCORING_FAILED', ApprovedAchievementScoringService::errorCode(new RuntimeException("Duplicate entry 'abc' for key 'uq'")));
        self::assertSame('SCORING_FAILED', ApprovedAchievementScoringService::errorCode(new \TypeError('Argument #1 must be of type array')));
    }

    public function testControllerNeverScoresOnReturnOrRejectAndStudentsNeverSeeScoringEvents(): void
    {
        $source = str_replace(
            "\r\n",
            "\n",
            (string) file_get_contents(dirname(__DIR__, 2) . '/app/Controllers/Api/StudentPortfolioController.php')
        );
        self::assertStringContainsString("if (\$targetStatus === 'verified') {\n            // Scoring runs in its own transaction", $source);
        self::assertStringContainsString("whereNotIn('ve.action', ApprovedAchievementScoringService::SCORING_ACTIONS)", $source);
    }
}
