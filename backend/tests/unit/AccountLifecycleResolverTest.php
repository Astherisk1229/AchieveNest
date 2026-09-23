<?php

namespace Tests\Unit;

use App\Services\AccountLifecycleResolver;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * @internal
 */
final class AccountLifecycleResolverTest extends CIUnitTestCase
{
    public function testActiveWithMustChangePasswordDerivesPendingFirstLogin(): void
    {
        $result = AccountLifecycleResolver::resolve('active', true, false);

        $this->assertSame(AccountLifecycleResolver::STATUS_PENDING_FIRST_LOGIN, $result['account_lifecycle_status']);
        $this->assertSame('active', $result['administrative_status']);
        $this->assertSame(AccountLifecycleResolver::INTEGRITY_VALID, $result['credential_integrity_status']);
        $this->assertTrue($result['must_change_password']);
        $this->assertTrue($result['can_authenticate']);
        $this->assertFalse($result['can_access_protected_portal']);
        $this->assertSame(AccountLifecycleResolver::ACTION_CHANGE_PASSWORD, $result['required_next_action']);
    }

    public function testActiveWithMustChangePasswordOneDerivesPendingFirstLogin(): void
    {
        $result = AccountLifecycleResolver::resolve('active', 1, false);

        $this->assertSame(AccountLifecycleResolver::STATUS_PENDING_FIRST_LOGIN, $result['account_lifecycle_status']);
        $this->assertTrue($result['must_change_password']);
        $this->assertSame(AccountLifecycleResolver::INTEGRITY_VALID, $result['credential_integrity_status']);
        $this->assertSame(AccountLifecycleResolver::ACTION_CHANGE_PASSWORD, $result['required_next_action']);
    }

    public function testActiveWithMustChangePasswordFalseDerivesActive(): void
    {
        $result = AccountLifecycleResolver::resolve('active', false, false);

        $this->assertSame(AccountLifecycleResolver::STATUS_ACTIVE, $result['account_lifecycle_status']);
        $this->assertSame('active', $result['administrative_status']);
        $this->assertSame(AccountLifecycleResolver::INTEGRITY_VALID, $result['credential_integrity_status']);
        $this->assertFalse($result['must_change_password']);
        $this->assertTrue($result['can_authenticate']);
        $this->assertTrue($result['can_access_protected_portal']);
        $this->assertSame(AccountLifecycleResolver::ACTION_NONE, $result['required_next_action']);
    }

    public function testMissingCredentialFailsClosedAsUnknownAndMissing(): void
    {
        $result = AccountLifecycleResolver::resolve('active', null, false);

        $this->assertSame(AccountLifecycleResolver::STATUS_UNKNOWN, $result['account_lifecycle_status']);
        $this->assertSame('active', $result['administrative_status']);
        $this->assertSame(AccountLifecycleResolver::INTEGRITY_MISSING, $result['credential_integrity_status']);
        $this->assertNull($result['must_change_password']);
        $this->assertFalse($result['can_authenticate']);
        $this->assertFalse($result['can_access_protected_portal']);
        $this->assertSame(AccountLifecycleResolver::ACTION_CONTACT_ADMINISTRATOR, $result['required_next_action']);
    }

    public function testExplicitMissingIntegritySignal(): void
    {
        $result = AccountLifecycleResolver::resolve('active', true, false, AccountLifecycleResolver::INTEGRITY_MISSING);

        $this->assertSame(AccountLifecycleResolver::STATUS_UNKNOWN, $result['account_lifecycle_status']);
        $this->assertSame(AccountLifecycleResolver::INTEGRITY_MISSING, $result['credential_integrity_status']);
        $this->assertNull($result['must_change_password']);
        $this->assertFalse($result['can_authenticate']);
        $this->assertSame(AccountLifecycleResolver::ACTION_CONTACT_ADMINISTRATOR, $result['required_next_action']);
    }

    public function testInvalidCredentialValueFailsClosed(): void
    {
        $result = AccountLifecycleResolver::resolve('active', 'invalid_flag_string', false);

        $this->assertSame(AccountLifecycleResolver::STATUS_UNKNOWN, $result['account_lifecycle_status']);
        $this->assertSame(AccountLifecycleResolver::INTEGRITY_INVALID, $result['credential_integrity_status']);
        $this->assertNull($result['must_change_password']);
        $this->assertFalse($result['can_authenticate']);
        $this->assertFalse($result['can_access_protected_portal']);
        $this->assertSame(AccountLifecycleResolver::ACTION_CONTACT_ADMINISTRATOR, $result['required_next_action']);
    }

    public function testDuplicateCredentialSignalFailsClosed(): void
    {
        $result = AccountLifecycleResolver::resolve('active', true, false, AccountLifecycleResolver::INTEGRITY_DUPLICATE);

        $this->assertSame(AccountLifecycleResolver::STATUS_UNKNOWN, $result['account_lifecycle_status']);
        $this->assertSame(AccountLifecycleResolver::INTEGRITY_DUPLICATE, $result['credential_integrity_status']);
        $this->assertNull($result['must_change_password']);
        $this->assertFalse($result['can_authenticate']);
        $this->assertSame(AccountLifecycleResolver::ACTION_CONTACT_ADMINISTRATOR, $result['required_next_action']);
    }

    public function testSuspendedPrecedenceOverMustChangePassword(): void
    {
        $result = AccountLifecycleResolver::resolve('suspended', true, false);

        $this->assertSame(AccountLifecycleResolver::STATUS_SUSPENDED, $result['account_lifecycle_status']);
        $this->assertSame('suspended', $result['administrative_status']);
        $this->assertFalse($result['can_authenticate']);
        $this->assertFalse($result['can_access_protected_portal']);
        $this->assertSame(AccountLifecycleResolver::ACTION_CONTACT_ADMINISTRATOR, $result['required_next_action']);
    }

    public function testArchivedPrecedenceOverMustChangePassword(): void
    {
        $result = AccountLifecycleResolver::resolve('archived', false, false);

        $this->assertSame(AccountLifecycleResolver::STATUS_ARCHIVED, $result['account_lifecycle_status']);
        $this->assertSame('archived', $result['administrative_status']);
        $this->assertFalse($result['can_authenticate']);
        $this->assertFalse($result['can_access_protected_portal']);
        $this->assertSame(AccountLifecycleResolver::ACTION_CONTACT_ADMINISTRATOR, $result['required_next_action']);
    }

    public function testDisabledPrecedenceOverMustChangePassword(): void
    {
        $result = AccountLifecycleResolver::resolve('disabled', true, false);

        $this->assertSame(AccountLifecycleResolver::STATUS_DISABLED, $result['account_lifecycle_status']);
        $this->assertSame('disabled', $result['administrative_status']);
        $this->assertFalse($result['can_authenticate']);
        $this->assertFalse($result['can_access_protected_portal']);
        $this->assertSame(AccountLifecycleResolver::ACTION_CONTACT_ADMINISTRATOR, $result['required_next_action']);
    }

    public function testLockedPrecedence(): void
    {
        $result = AccountLifecycleResolver::resolve('active', true, true);

        $this->assertSame(AccountLifecycleResolver::STATUS_LOCKED, $result['account_lifecycle_status']);
        $this->assertFalse($result['can_authenticate']);
        $this->assertFalse($result['can_access_protected_portal']);
        $this->assertSame(AccountLifecycleResolver::ACTION_CONTACT_ADMINISTRATOR, $result['required_next_action']);
    }

    public function testUnsupportedStatusFailsClosedAsUnknown(): void
    {
        $result = AccountLifecycleResolver::resolve('unsupported_status_value', false, false);

        $this->assertSame(AccountLifecycleResolver::STATUS_UNKNOWN, $result['account_lifecycle_status']);
        $this->assertFalse($result['can_authenticate']);
        $this->assertFalse($result['can_access_protected_portal']);
        $this->assertSame(AccountLifecycleResolver::ACTION_CONTACT_ADMINISTRATOR, $result['required_next_action']);
    }

    public function testNullStatusFailsClosedAsUnknown(): void
    {
        $result = AccountLifecycleResolver::resolve(null, false, false);

        $this->assertSame(AccountLifecycleResolver::STATUS_UNKNOWN, $result['account_lifecycle_status']);
        $this->assertSame('unknown', $result['administrative_status']);
        $this->assertFalse($result['can_authenticate']);
        $this->assertFalse($result['can_access_protected_portal']);
        $this->assertSame(AccountLifecycleResolver::ACTION_CONTACT_ADMINISTRATOR, $result['required_next_action']);
    }
}
