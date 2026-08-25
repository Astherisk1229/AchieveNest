<?php

namespace Tests\Feature;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

final class Day1FoundationAndRoleTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    public function testManualStudentProvisioningRequiresAuthorization(): void
    {
        $result = $this->post('/api/v1/provisioning/manual-student', [
            'institutional_id'    => '2026-0001',
            'institutional_email' => 'student@ndmu.edu.ph',
            'first_name'          => 'Maria',
            'last_name'           => 'Santos',
        ]);

        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => [
                'code' => 'UNAUTHORIZED',
            ],
        ]);
    }

    public function testManualPersonnelProvisioningRequiresAuthorization(): void
    {
        $result = $this->post('/api/v1/provisioning/manual-personnel', [
            'institutional_id'    => 'EMP-2026-001',
            'institutional_email' => 'personnel@ndmu.edu.ph',
            'first_name'          => 'Juan',
            'last_name'           => 'Dela Cruz',
        ]);

        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => [
                'code' => 'UNAUTHORIZED',
            ],
        ]);
    }

    public function testRosterPreviewRequiresAuthorization(): void
    {
        $result = $this->post('/api/v1/provisioning/preview-roster', [
            'roster_type' => 'personnel',
            'rows'        => [],
        ]);

        $result->assertStatus(401);
    }

    public function testRosterCommitRequiresAuthorization(): void
    {
        $result = $this->post('/api/v1/provisioning/commit-roster', [
            'roster_type' => 'personnel',
            'rows'        => [],
        ]);

        $result->assertStatus(401);
    }

    public function testDeanRoleAssignmentRequiresAuthorization(): void
    {
        $result = $this->post('/api/v1/personnel/target-uuid/roles', [
            'role_key'   => 'dean',
            'scope_type' => 'college',
            'scope_id'   => 'college-uuid',
        ]);

        $result->assertStatus(401);
    }

    public function testDeanRoleRevocationRequiresAuthorization(): void
    {
        $result = $this->delete('/api/v1/personnel/target-uuid/roles/assignment-uuid');

        $result->assertStatus(401);
    }

    public function testLifecycleSuspendRequiresAuthorization(): void
    {
        $result = $this->post('/api/v1/accounts/target-uuid/suspend', [
            'reason' => 'Testing suspension authorization',
        ]);

        $result->assertStatus(401);
    }

    public function testLifecycleArchiveRequiresAuthorization(): void
    {
        $result = $this->post('/api/v1/accounts/target-uuid/archive', [
            'reason' => 'Testing archive authorization',
        ]);

        $result->assertStatus(401);
    }

    public function testLifecycleRestoreRequiresAuthorization(): void
    {
        $result = $this->post('/api/v1/accounts/target-uuid/restore');

        $result->assertStatus(401);
    }

    public function testLifecycleEventsOrderingEndpointRequiresAuthorization(): void
    {
        $result = $this->get('/api/v1/accounts/target-uuid/lifecycle');

        $result->assertStatus(401);
    }

    public function testHREvaluationListRequiresAuthorization(): void
    {
        $result = $this->get('/api/v1/hr/evaluations');

        $result->assertStatus(403);
    }

    public function testHREvaluationItemVerificationRequiresAuthorization(): void
    {
        $result = $this->patch('/api/v1/hr/evaluations/eval-123/items/item-123/verify', [
            'status' => 'verified',
        ]);

        $result->assertStatus(403);
    }

    public function testHREvaluationFinalizationRequiresAuthorization(): void
    {
        $result = $this->post('/api/v1/hr/evaluations/eval-123/finalize');

        $result->assertStatus(403);
    }
}
