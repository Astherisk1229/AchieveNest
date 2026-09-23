<?php

namespace Tests\Unit;

use App\Services\PersonnelLoginReadinessService;
use CodeIgniter\Test\CIUnitTestCase;

final class PersonnelLoginReadinessServiceTest extends CIUnitTestCase
{
    private PersonnelLoginReadinessService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PersonnelLoginReadinessService();
    }

    public function testCompletePersonnelAccountIsReadyWithoutGovernanceAssignment(): void
    {
        $result = $this->service->evaluate($this->healthyRecord());
        $this->assertSame('READY', $result['status']);
        $this->assertTrue($result['can_sign_in']);
        $this->assertSame([], $result['reason_codes']);
    }

    public function testMissingCredentialIsNotReady(): void
    {
        $result = $this->service->evaluate($this->healthyRecord([
            'has_credential' => 0,
            'has_password_hash' => 0,
            'credential_status' => null,
        ]));
        $this->assertSame('NOT_READY', $result['status']);
        $this->assertContains('MISSING_CREDENTIAL', $result['reason_codes']);
    }

    public function testEmptyHashIsNotReady(): void
    {
        $result = $this->service->evaluate($this->healthyRecord(['has_password_hash' => 0]));
        $this->assertSame('NOT_READY', $result['status']);
        $this->assertContains('EMPTY_PASSWORD_HASH', $result['reason_codes']);
    }

    public function testMissingPersonnelRoleIsNotReady(): void
    {
        $result = $this->service->evaluate($this->healthyRecord(['active_personnel_roles' => 0]));
        $this->assertSame('NOT_READY', $result['status']);
        $this->assertContains('MISSING_PERSONNEL_ROLE', $result['reason_codes']);
    }

    public function testPasswordChangeAccountCanStillAuthenticate(): void
    {
        $result = $this->service->evaluate($this->healthyRecord(['must_change_password' => 1]));
        $this->assertSame('NEEDS_PASSWORD_CHANGE', $result['status']);
        $this->assertTrue($result['can_sign_in']);
        $this->assertContains('MUST_CHANGE_PASSWORD', $result['reason_codes']);
    }

    public function testInactiveAccountIsDisabled(): void
    {
        $result = $this->service->evaluate($this->healthyRecord(['profile_status' => 'suspended']));
        $this->assertSame('DISABLED', $result['status']);
        $this->assertFalse($result['can_sign_in']);
    }

    public function testDuplicateIdentityIsConflict(): void
    {
        $result = $this->service->evaluate($this->healthyRecord(['duplicate_email_count' => 2]));
        $this->assertSame('IDENTITY_CONFLICT', $result['status']);
        $this->assertContains('DUPLICATE_EMAIL', $result['reason_codes']);
    }

    private function healthyRecord(array $overrides = []): array
    {
        return array_merge([
            'profile_exists' => 1,
            'has_personnel_profile' => 1,
            'profile_status' => 'active',
            'account_type' => 'personnel',
            'has_credential' => 1,
            'has_password_hash' => 1,
            'credential_status' => 'active',
            'must_change_password' => 0,
            'active_personnel_roles' => 1,
            'duplicate_email_count' => 1,
            'duplicate_employee_id_count' => 1,
        ], $overrides);
    }
}
