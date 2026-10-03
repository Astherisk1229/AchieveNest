<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

final class DeanRankingCycleAlignmentContractTest extends TestCase
{
    private function source(string $relative): string
    {
        return (string) file_get_contents(dirname(__DIR__, 2) . '/' . $relative);
    }

    public function testDeanReadsTheHrOwnedFacultyTrackAcrossAllWorkspaceViews(): void
    {
        $controller = $this->source('app/Controllers/Api/DeanWorkspaceController.php');
        self::assertStringContainsString("currentWorkflowTrack('FACULTY')", $controller);
        self::assertGreaterThanOrEqual(3, substr_count($controller, 'facultyRankingContext($db)'));
        self::assertStringContainsString("'ranking_cycle' => null", $controller);
        self::assertStringContainsString("'ranking_cycle'=>self::cycleSummary", $controller);
    }

    public function testNeedsReviewIsDerivedFromSeparateAuthoritativeStates(): void
    {
        $controller = $this->source('app/Controllers/Api/DeanWorkspaceController.php');
        foreach (['annual_review_status', 'ranking_eligibility_status', 'dean_review_status', "'needs_review'", 'actorMayAct'] as $contract) {
            self::assertStringContainsString($contract, $controller);
        }
        self::assertStringContainsString("\$annualStatus !== 'passed' || \$rankingEligibility !== 'eligible'", $controller);
        self::assertStringContainsString("default => \$row['dean_review_status'] === 'needs_review'", $controller);
    }

    public function testLegacyDeanAnnualReviewFallbackIsFacultyOnly(): void
    {
        $service = $this->source('app/Services/DeanAnnualReviewService.php');
        self::assertStringContainsString("currentWorkflowTrack('FACULTY')", $service);
        self::assertStringContainsString("where('personnel_group','FACULTY')", $service);
    }
}
