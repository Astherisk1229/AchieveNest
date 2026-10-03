<?php

namespace Tests\Unit;

use App\Services\AccountLifecycleResolver;
use App\Services\AuthenticationEligibilityService;
use CodeIgniter\Test\CIUnitTestCase;

final class AuthenticationEligibilityServiceTest extends CIUnitTestCase
{
    private AuthenticationEligibilityService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AuthenticationEligibilityService();
    }

    public function testActiveAccountIsEligible(): void
    {
        $result = $this->evaluate('active', false);

        self::assertTrue($result['eligible']);
        self::assertSame(AuthenticationEligibilityService::CODE_ELIGIBLE, $result['code']);
        self::assertSame(AccountLifecycleResolver::STATUS_ACTIVE, $result['lifecycle_state']);
        self::assertTrue($result['can_access_protected_portal']);
    }

    public function testPendingFirstLoginPreservesAuthoritativeBehavior(): void
    {
        $result = $this->evaluate('active', true);

        self::assertTrue($result['eligible']);
        self::assertSame(AuthenticationEligibilityService::CODE_PENDING_FIRST_LOGIN, $result['code']);
        self::assertSame(AccountLifecycleResolver::STATUS_PENDING_FIRST_LOGIN, $result['lifecycle_state']);
        self::assertFalse($result['can_access_protected_portal']);
        self::assertSame(AccountLifecycleResolver::ACTION_CHANGE_PASSWORD, $result['required_next_action']);
    }

    /** @dataProvider restrictedStateProvider */
    public function testRestrictedLifecycleStatesAreDenied(string $status, string $state, string $code): void
    {
        $result = $this->evaluate($status, false);

        self::assertFalse($result['eligible']);
        self::assertSame($code, $result['code']);
        self::assertSame($state, $result['lifecycle_state']);
        self::assertFalse($result['can_access_protected_portal']);
    }

    public static function restrictedStateProvider(): array
    {
        return [
            'suspended' => ['suspended', AccountLifecycleResolver::STATUS_SUSPENDED, AuthenticationEligibilityService::CODE_ACCOUNT_SUSPENDED],
            'archived'  => ['archived', AccountLifecycleResolver::STATUS_ARCHIVED, AuthenticationEligibilityService::CODE_ACCOUNT_ARCHIVED],
            'disabled'  => ['disabled', AccountLifecycleResolver::STATUS_DISABLED, AuthenticationEligibilityService::CODE_ACCOUNT_DISABLED],
        ];
    }

    public function testLockedAccountIsDenied(): void
    {
        $result = $this->service->evaluate([
            'status' => 'active',
            'must_change_password' => false,
            'is_locked' => true,
        ]);

        self::assertFalse($result['eligible']);
        self::assertSame(AuthenticationEligibilityService::CODE_ACCOUNT_LOCKED, $result['code']);
        self::assertSame(AccountLifecycleResolver::STATUS_LOCKED, $result['lifecycle_state']);
    }

    public function testUnknownLifecycleFailsClosed(): void
    {
        $result = $this->evaluate('inactive', false);

        self::assertFalse($result['eligible']);
        self::assertSame(AuthenticationEligibilityService::CODE_ACCOUNT_UNKNOWN, $result['code']);
        self::assertSame(AccountLifecycleResolver::STATUS_UNKNOWN, $result['lifecycle_state']);
    }

    public function testMustChangePasswordFlagIsPreservedAsPostAuthenticationState(): void
    {
        $pending = $this->evaluate('active', 1);
        $active = $this->evaluate('active', 0);

        self::assertTrue($pending['must_change_password']);
        self::assertTrue($pending['eligible']);
        self::assertFalse($active['must_change_password']);
        self::assertTrue($active['eligible']);
    }

    public function testMissingCredentialMetadataFailsClosed(): void
    {
        $result = $this->service->evaluate(['status' => 'active']);

        self::assertFalse($result['eligible']);
        self::assertSame(AuthenticationEligibilityService::CODE_ACCOUNT_UNKNOWN, $result['code']);
        self::assertSame(AccountLifecycleResolver::INTEGRITY_MISSING, $result['credential_integrity_status']);
    }

    public function testEligibilityIsIndependentOfRoleAndAccountType(): void
    {
        foreach ([
            ['account_type' => 'student', 'roles' => ['student']],
            ['account_type' => 'personnel', 'roles' => ['personnel']],
            ['account_type' => 'personnel', 'roles' => ['hr_staff']],
            ['account_type' => 'personnel', 'roles' => ['osad_staff']],
        ] as $identityContext) {
            $result = $this->service->evaluate($identityContext + [
                'status' => 'active',
                'must_change_password' => false,
            ]);

            self::assertTrue($result['eligible']);
            self::assertSame(AuthenticationEligibilityService::CODE_ELIGIBLE, $result['code']);
        }
    }

    public function testEligibilityHasNoProviderOrExternalIdentityDependency(): void
    {
        $profile = [
            'id' => 'local-profile-only',
            'status' => 'active',
            'must_change_password' => false,
        ];

        $result = $this->service->evaluate($profile);

        self::assertTrue($result['eligible']);
        self::assertSame(AuthenticationEligibilityService::CODE_ELIGIBLE, $result['code']);
        self::assertArrayNotHasKey('provider', $result);
        self::assertArrayNotHasKey('external_auth_identity', $result);
    }

    private function evaluate(string $status, mixed $mustChangePassword): array
    {
        return $this->service->evaluate([
            'status' => $status,
            'must_change_password' => $mustChangePassword,
        ]);
    }
}
