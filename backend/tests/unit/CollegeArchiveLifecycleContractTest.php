<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

final class CollegeArchiveLifecycleContractTest extends TestCase
{
    public function testArchiveRouteRequiresOsadAuthorityAndDelegatesToFocusedLifecycleMethod(): void
    {
        $root = dirname(__DIR__, 2);
        $routes = file_get_contents($root . '/app/Config/Routes.php');
        $controller = file_get_contents($root . '/app/Controllers/Api/CollegeController.php');

        self::assertStringContainsString("patch('osad/colleges/(:segment)/status'", $routes);
        self::assertStringContainsString('public function updateStatus(string $id)', $controller);
        self::assertStringContainsString('checkOSADAuthorization($actor)', $controller);
        self::assertStringContainsString('updateCollegeStatus($id', $controller);
    }

    public function testLifecycleUpdateCannotRewriteDependentOwnership(): void
    {
        $service = file_get_contents(dirname(__DIR__, 2) . '/app/Services/CollegeService.php');
        $start = strpos($service, 'public function updateCollegeStatus');
        $end = strpos($service, 'public function createCollege', $start);
        $method = substr($service, $start, $end - $start);

        self::assertStringContainsString("['active', 'inactive']", $method);
        self::assertStringContainsString("table('colleges')", $method);
        self::assertStringNotContainsString("table('academic_programs')", $method);
        self::assertStringNotContainsString("table('student_program_enrollments')", $method);
        self::assertStringNotContainsString('college_id', $method);
    }
}
