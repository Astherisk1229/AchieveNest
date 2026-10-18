<?php

use PHPUnit\Framework\TestCase;

final class DeanPortfolioEvaluationRouteContractTest extends TestCase
{
    public function testRoleNeutralReviewerMutationsAndReportHaveCorsPreflightRoutes(): void
    {
        $routes = file_get_contents(__DIR__ . '/../../app/Config/Routes.php');
        foreach (['start', 'return', 'ready', 'finalize', 'report'] as $action) {
            self::assertStringContainsString("options('reviewer/evaluations/(:segment)/{$action}'", $routes);
        }
        foreach (['verify', 'rate'] as $action) {
            self::assertStringContainsString("options('reviewer/evaluations/(:segment)/items/(:segment)/{$action}'", $routes);
        }
    }

    public function testSubmissionLifecycleUsesThePortableEventWriter(): void
    {
        $controller = file_get_contents(__DIR__ . '/../../app/Controllers/Api/PersonnelPortfolioSubmissionController.php');
        self::assertStringContainsString('private function persistEvaluationEvent', $controller);
        self::assertStringContainsString("persistEvaluationEvent(\$db, \$eventsTable, \$eventRow, 'draft', 'submitted')", $controller);
        self::assertStringContainsString("persistEvaluationEvent(\$db, \$eventsTable, \$eventRow, 'returned_for_revision', 'submitted')", $controller);
        self::assertStringContainsString("persistEvaluationEvent(\$db, \$eventsTable, \$eventRow, (string) \$evaluation['status'], 'returned_for_revision')", $controller);
    }

    public function testFacultyHandoffDoesNotBlockPortfolioCompletionOnRankProgression(): void
    {
        $controller = file_get_contents(__DIR__ . '/../../app/Controllers/Api/HREvaluationController.php');
        self::assertStringNotContainsString('FACULTY_PHASE_O_INCOMPLETE', $controller);
        self::assertStringNotContainsString('rank_applied_for_decision_id', $controller);
        self::assertStringNotContainsString('assertFreshConfirmedDecision', $controller);
        self::assertStringNotContainsString('FACULTY_PHASE_O_STALE', $controller);
    }
}
