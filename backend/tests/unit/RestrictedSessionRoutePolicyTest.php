<?php

namespace Tests\Unit;

use App\Services\RestrictedSessionRoutePolicy;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * @internal
 */
final class RestrictedSessionRoutePolicyTest extends CIUnitTestCase
{
    private RestrictedSessionRoutePolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new RestrictedSessionRoutePolicy();
    }

    public function testAllowsExactAuthMeGet(): void
    {
        $this->assertTrue($this->policy->isAllowed('auth.me', 'api/v1/auth/me', 'GET'));
        $this->assertTrue($this->policy->isAllowed(null, 'api/v1/auth/me', 'GET'));
    }

    public function testDeniesAuthMePost(): void
    {
        $this->assertFalse($this->policy->isAllowed('auth.me', 'api/v1/auth/me', 'POST'));
        $this->assertFalse($this->policy->isAllowed(null, 'api/v1/auth/me', 'POST'));
    }

    public function testAllowsExactAuthChangePasswordPost(): void
    {
        $this->assertTrue($this->policy->isAllowed('auth.change_password', 'api/v1/auth/change-password', 'POST'));
        $this->assertTrue($this->policy->isAllowed(null, 'api/v1/auth/change-password', 'POST'));
    }

    public function testDeniesAuthChangePasswordGet(): void
    {
        $this->assertFalse($this->policy->isAllowed('auth.change_password', 'api/v1/auth/change-password', 'GET'));
        $this->assertFalse($this->policy->isAllowed(null, 'api/v1/auth/change-password', 'GET'));
    }

    public function testAllowsExactAuthLogoutPost(): void
    {
        $this->assertTrue($this->policy->isAllowed('auth.logout', 'api/v1/auth/logout', 'POST'));
        $this->assertTrue($this->policy->isAllowed(null, 'api/v1/auth/logout', 'POST'));
    }

    public function testDeniesPasswordResetRoutes(): void
    {
        $this->assertFalse($this->policy->isAllowed('password_reset.submit', 'api/v1/password-reset-requests', 'POST'));
        $this->assertFalse($this->policy->isAllowed('password_reset.list', 'api/v1/password-reset-requests', 'GET'));
        $this->assertFalse($this->policy->isAllowed('password_reset.reset', 'api/v1/password-reset-requests/req-123/reset', 'POST'));
        $this->assertFalse($this->policy->isAllowed('password_reset.reject', 'api/v1/password-reset-requests/req-123/reject', 'POST'));
        $this->assertFalse($this->policy->isAllowed(null, 'api/v1/password-reset-requests', 'GET'));
        $this->assertFalse($this->policy->isAllowed(null, 'api/v1/password-reset-requests', 'POST'));
        $this->assertFalse($this->policy->isAllowed(null, 'api/v1/password-reset-requests/req-123/reset', 'POST'));
    }

    public function testDeniesProtectedPortalRoutes(): void
    {
        $this->assertFalse($this->policy->isAllowed(null, 'api/v1/achievements', 'GET'));
        $this->assertFalse($this->policy->isAllowed(null, 'api/v1/events', 'GET'));
        $this->assertFalse($this->policy->isAllowed(null, 'api/v1/osad/students', 'GET'));
        $this->assertFalse($this->policy->isAllowed(null, 'api/v1/hr/personnel', 'GET'));
    }

    public function testDeniesNearMatchesAndTrailingSegments(): void
    {
        $this->assertFalse($this->policy->isAllowed(null, 'api/v1/auth/me/extra', 'GET'));
        $this->assertFalse($this->policy->isAllowed(null, 'api/v1/auth/change-password/extra', 'POST'));
        $this->assertFalse($this->policy->isAllowed(null, 'api/v1/auth/change-password-admin', 'POST'));
        $this->assertFalse($this->policy->isAllowed('auth.change_password_admin', 'api/v1/auth/change-password-admin', 'POST'));
    }

    public function testFailsClosedOnUnknownOrNullRoute(): void
    {
        $this->assertFalse($this->policy->isAllowed(null, 'api/v1/unknown/route', 'GET'));
        $this->assertFalse($this->policy->isAllowed('', 'api/v1/unknown/route', 'POST'));
    }
}
