<?php

namespace Tests\Feature;

use App\Controllers\Api\AccountLifecycleController;
use App\Controllers\Api\PersonnelRoleController;
use App\Controllers\Api\ProvisioningController;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;
use ReflectionClass;
use ReflectionMethod;

final class AdminAuthorizationAndIntegrityTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    /**
     * Helper to invoke protected methods on controllers.
     */
    private function invokeMethod(object $object, string $methodName, array $parameters = [])
    {
        $reflection = new ReflectionClass(get_class($object));
        $method = $reflection->getMethod($methodName);
        $method->setAccessible(true);
        return $method->invokeArgs($object, $parameters);
    }

    /**
     * Step 15 Case A & B: Personnel with HR or OSAD specialized role must NOT have admin authority.
     */
    public function testPersonnelWithSpecializedRolesCannotClaimAdminAuthority(): void
    {
        $lifecycleController = new AccountLifecycleController();

        // Case A: Personnel with hr_staff role
        $actorPersonnelHr = [
            'profile' => ['id' => 'usr-1', 'account_type' => 'personnel', 'status' => 'active'],
            'roles'   => ['personnel', 'hr_staff'],
        ];

        // Target personnel
        $targetPersonnel = ['id' => 'usr-target', 'account_type' => 'personnel', 'status' => 'active'];

        // Should be forbidden because account_type is not hr_admin
        $authErrA = $this->invokeMethod($lifecycleController, 'checkLifecycleAuthority', [$actorPersonnelHr, $targetPersonnel]);
        $this->assertNotNull($authErrA);
        $this->assertStringContainsString('Only dedicated HR administrators (hr_admin) may manage personnel', $authErrA);

        // Case B: Personnel with osad_staff role
        $actorPersonnelOsad = [
            'profile' => ['id' => 'usr-2', 'account_type' => 'personnel', 'status' => 'active'],
            'roles'   => ['personnel', 'osad_staff'],
        ];

        // Target student
        $targetStudent = ['id' => 'usr-student', 'account_type' => 'student', 'status' => 'active'];

        // Should be forbidden because account_type is not osad_admin
        $authErrB = $this->invokeMethod($lifecycleController, 'checkLifecycleAuthority', [$actorPersonnelOsad, $targetStudent]);
        $this->assertNotNull($authErrB);
        $this->assertStringContainsString('Only dedicated OSAD administrators (osad_admin) may manage student', $authErrB);
    }

    /**
     * Step 15 Case C & D: Admin account without specialized role must NOT be authorized.
     */
    public function testAdminWithoutRequiredRoleIsForbidden(): void
    {
        $lifecycleController = new AccountLifecycleController();

        // Case C: hr_admin without hr_staff role
        $actorHrWithoutRole = [
            'profile' => ['id' => 'usr-hr', 'account_type' => 'hr_admin', 'status' => 'active'],
            'roles'   => [],
        ];
        $targetPersonnel = ['id' => 'usr-p', 'account_type' => 'personnel', 'status' => 'active'];

        $authErrC = $this->invokeMethod($lifecycleController, 'checkLifecycleAuthority', [$actorHrWithoutRole, $targetPersonnel]);
        $this->assertNotNull($authErrC);
        $this->assertStringContainsString('Only dedicated HR administrators', $authErrC);

        // Case D: osad_admin without osad_staff role
        $actorOsadWithoutRole = [
            'profile' => ['id' => 'usr-osad', 'account_type' => 'osad_admin', 'status' => 'active'],
            'roles'   => [],
        ];
        $targetStudent = ['id' => 'usr-s', 'account_type' => 'student', 'status' => 'active'];

        $authErrD = $this->invokeMethod($lifecycleController, 'checkLifecycleAuthority', [$actorOsadWithoutRole, $targetStudent]);
        $this->assertNotNull($authErrD);
        $this->assertStringContainsString('Only dedicated OSAD administrators', $authErrD);
    }

    /**
     * Step 15 Case E & F: Correct HR and OSAD Admins with dual account_type + role + active are authorized.
     */
    public function testCorrectDualAuthorizedAdminsSucceed(): void
    {
        $lifecycleController = new AccountLifecycleController();

        // Case E: Correct HR Admin
        $actorHrAdmin = [
            'profile' => ['id' => 'usr-hr', 'account_type' => 'hr_admin', 'status' => 'active'],
            'roles'   => ['hr_staff'],
        ];
        $targetPersonnel = ['id' => 'usr-p', 'account_type' => 'personnel', 'status' => 'active'];

        $authErrE = $this->invokeMethod($lifecycleController, 'checkLifecycleAuthority', [$actorHrAdmin, $targetPersonnel]);
        $this->assertNull($authErrE);

        // Case F: Correct OSAD Admin
        $actorOsadAdmin = [
            'profile' => ['id' => 'usr-osad', 'account_type' => 'osad_admin', 'status' => 'active'],
            'roles'   => ['osad_staff'],
        ];
        $targetStudent = ['id' => 'usr-s', 'account_type' => 'student', 'status' => 'active'];

        $authErrF = $this->invokeMethod($lifecycleController, 'checkLifecycleAuthority', [$actorOsadAdmin, $targetStudent]);
        $this->assertNull($authErrF);
    }

    /**
     * Step 9: Standard lifecycle endpoints must reject targets with account_type hr_admin or osad_admin.
     */
    public function testStandardLifecycleEndpointsRejectAdminTargets(): void
    {
        $lifecycleController = new AccountLifecycleController();

        $actorHrAdmin = [
            'profile' => ['id' => 'usr-hr', 'account_type' => 'hr_admin', 'status' => 'active'],
            'roles'   => ['hr_staff'],
        ];

        // Target is hr_admin
        $targetHrAdmin = ['id' => 'usr-target-hr', 'account_type' => 'hr_admin', 'status' => 'active'];
        $errHr = $this->invokeMethod($lifecycleController, 'checkLifecycleAuthority', [$actorHrAdmin, $targetHrAdmin]);
        $this->assertNotNull($errHr);
        $this->assertStringContainsString('Top-level administrative accounts cannot be modified', $errHr);

        // Target is osad_admin
        $targetOsadAdmin = ['id' => 'usr-target-osad', 'account_type' => 'osad_admin', 'status' => 'active'];
        $errOsad = $this->invokeMethod($lifecycleController, 'checkLifecycleAuthority', [$actorHrAdmin, $targetOsadAdmin]);
        $this->assertNotNull($errOsad);
        $this->assertStringContainsString('Top-level administrative accounts cannot be modified', $errOsad);
    }
}
