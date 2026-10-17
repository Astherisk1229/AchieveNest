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

    public function testFacultyHandoffRequiresFreshConfirmedPhaseODecisions(): void
    {
        $controller = file_get_contents(__DIR__ . '/../../app/Controllers/Api/HREvaluationController.php');
        self::assertStringContainsString('FACULTY_PHASE_O_INCOMPLETE', $controller);
        self::assertStringContainsString('rank_applied_for_decision_id', $controller);
        self::assertStringContainsString('assertFreshConfirmedDecision', $controller);
        self::assertStringContainsString('FACULTY_PHASE_O_STALE', $controller);
    }
}
