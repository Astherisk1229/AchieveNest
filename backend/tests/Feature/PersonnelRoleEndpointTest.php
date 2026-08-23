<?php

namespace Tests\Feature;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

final class PersonnelRoleEndpointTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    public function testListRolesRequiresAuthorization(): void
    {
        $result = $this->get('/api/v1/personnel/roles');

        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => [
                'code' => 'UNAUTHORIZED',
            ],
        ]);
    }

    public function testAssignRoleRequiresAuthorization(): void
    {
        $result = $this->post('/api/v1/personnel/usr_test_123/roles', [
            'role_key' => 'department_secretary',
        ]);

        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => [
                'code' => 'UNAUTHORIZED',
            ],
        ]);
    }

    public function testRevokeRoleRequiresAuthorization(): void
    {
        $result = $this->delete('/api/v1/personnel/usr_test_123/roles/assign_123');

        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => [
                'code' => 'UNAUTHORIZED',
            ],
        ]);
    }
}
