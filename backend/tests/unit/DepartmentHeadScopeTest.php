<?php

namespace Tests\Unit;

use App\Services\AuthorizationService;
use CodeIgniter\Test\CIUnitTestCase;

final class DepartmentHeadScopeTest extends CIUnitTestCase
{
    public function testDepartmentScopeIncludesOnlyDepartmentHeadAssignments(): void
    {
        $service = new AuthorizationService();
        $actor = ['assignments' => [
            ['role_key' => 'personnel', 'scope_type' => 'university', 'scope_id' => null],
            ['role_key' => 'department_head', 'scope_type' => 'department', 'scope_id' => 'dept-a'],
            ['role_key' => 'department_head', 'scope_type' => 'college', 'scope_id' => 'college-a'],
            ['role_key' => 'dean', 'scope_type' => 'college', 'scope_id' => 'college-b'],
        ]];

        $this->assertSame(['dept-a'], $service->getDepartmentHeadDepartmentIds($actor));
    }

    public function testUnassignedDepartmentCannotEnterScope(): void
    {
        $service = new AuthorizationService();
        $actor = ['assignments' => [
            ['role_key' => 'department_head', 'scope_type' => 'department', 'scope_id' => 'dept-a'],
            ['role_key' => 'department_head', 'scope_type' => 'department', 'scope_id' => 'dept-a'],
        ]];

        $this->assertSame(['dept-a'], $service->getDepartmentHeadDepartmentIds($actor));
        $this->assertNotContains('dept-b', $service->getDepartmentHeadDepartmentIds($actor));
    }
}
