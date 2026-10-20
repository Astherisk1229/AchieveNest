<?php

namespace Tests\Unit;

use App\Services\Policies\GovernancePolicy;
use PHPUnit\Framework\TestCase;

class AcademicStructureOwnershipPolicyTest extends TestCase
{
    public function testOnlyHrStaffCanManageAcademicStructure(): void
    {
        $policy = new GovernancePolicy();

        self::assertTrue($policy->canManageAcademicStructure([
            'profile' => ['account_type' => 'hr_admin'],
            'roles' => ['hr_staff'],
        ]));
        self::assertFalse($policy->canManageAcademicStructure([
            'profile' => ['account_type' => 'osad_admin'],
            'roles' => ['osad_staff'],
        ]));
        self::assertFalse($policy->canManageAcademicStructure([
            'profile' => ['account_type' => 'personnel'],
            'roles' => ['personnel'],
        ]));
    }

    public function testOsadCanViewAcademicStructureButCannotChangeProgramStructureAssignments(): void
    {
        $policy = new GovernancePolicy();
        $osadActor = [
            'profile' => ['account_type' => 'osad_admin'],
            'roles' => ['osad_staff'],
        ];

        self::assertFalse($policy->canManageAcademicStructure($osadActor));
        self::assertTrue($policy->canViewAcademicStructure($osadActor));
        self::assertTrue($policy->canAssignCoordinator($osadActor));
    }
}
