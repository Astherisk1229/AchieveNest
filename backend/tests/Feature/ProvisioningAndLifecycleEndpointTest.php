<?php

namespace Tests\Feature;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

final class ProvisioningAndLifecycleEndpointTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    public function testManualStudentRequiresAuthorization(): void
    {
        $result = $this->post('/api/v1/provisioning/manual-student', [
            'institutional_id' => '2026-0001',
        ]);

        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => [
                'code' => 'UNAUTHORIZED',
            ],
        ]);
    }

    public function testManualPersonnelRequiresAuthorization(): void
    {
        $result = $this->post('/api/v1/provisioning/manual-personnel', [
            'institutional_id' => '9000000099',
        ]);

        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => [
                'code' => 'UNAUTHORIZED',
            ],
        ]);
    }

    public function testPreviewRosterRequiresAuthorization(): void
    {
        $result = $this->post('/api/v1/provisioning/preview-roster', [
            'roster_type' => 'student',
            'rows'        => [],
        ]);

        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => [
                'code' => 'UNAUTHORIZED',
            ],
        ]);
    }

    public function testSuspendAccountRequiresAuthorization(): void
    {
        $result = $this->post('/api/v1/accounts/usr_target_123/suspend', [
            'reason' => 'Policy violation',
        ]);

        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => [
                'code' => 'UNAUTHORIZED',
            ],
        ]);
    }

    public function testRestoreAccountRequiresAuthorization(): void
    {
        $result = $this->post('/api/v1/accounts/usr_target_123/restore');

        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => [
                'code' => 'UNAUTHORIZED',
            ],
        ]);
    }

    public function testLifecycleEventsRequiresAuthorization(): void
    {
        $result = $this->get('/api/v1/accounts/usr_target_123/lifecycle');

        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => [
                'code' => 'UNAUTHORIZED',
            ],
        ]);
    }
}
