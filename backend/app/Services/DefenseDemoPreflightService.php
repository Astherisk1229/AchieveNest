<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;

class DefenseDemoPreflightService
{
    protected DefenseDemoConfigService $config;

    public function __construct(?DefenseDemoConfigService $config = null)
    {
        $this->config = $config ?? new DefenseDemoConfigService();
    }

    public function validate(?BaseConnection $db = null): array
    {
        $db = $db ?? db_connect();

        // 1. Validate Secret Exists
        $password = $this->config->requirePassword();

        // 2. Validate Authoritative College
        $collegeCode = $this->config->requiredCollegeCode();
        $college = $db->table('colleges')
            ->where('code', $collegeCode)
            ->where('status', 'active')
            ->get()->getRowArray();
        if ($college === null) {
            throw new RuntimeException("Required authoritative College {$collegeCode} was not found.");
        }

        // 3. Validate Authoritative Programs
        $progACode = $this->config->requiredProgramACode();
        $progA = $db->table('academic_programs')
            ->where('code', $progACode)
            ->where('college_id', $college['id'])
            ->where('status', 'active')
            ->get()->getRowArray();
        if ($progA === null) {
            throw new RuntimeException("Required authoritative Academic Program {$progACode} was not found under College {$collegeCode}.");
        }

        $progBCode = $this->config->requiredProgramBCode();
        $progB = $db->table('academic_programs')
            ->where('code', $progBCode)
            ->where('college_id', $college['id'])
            ->where('status', 'active')
            ->get()->getRowArray();
        if ($progB === null) {
            throw new RuntimeException("Required authoritative Academic Program {$progBCode} was not found under College {$collegeCode}.");
        }

        // 4. Validate Authoritative Administrative Unit
        $unitCode = $this->config->requiredAdministrativeUnitCode();
        $unit = $db->table('administrative_units')
            ->where('code', $unitCode)
            ->where('status', 'active')
            ->get()->getRowArray();
        if ($unit === null) {
            throw new RuntimeException("Required authoritative Administrative Unit {$unitCode} was not found.");
        }

        // 5. Validate Required Roles
        $requiredRoles = ['student', 'personnel', 'hr_staff', 'osad_staff', 'dean', 'program_coordinator', 'organization_moderator'];
        $roleRows = $db->table('roles')->whereIn('role_key', $requiredRoles)->get()->getResultArray();
        if (count($roleRows) !== count($requiredRoles)) {
            throw new RuntimeException("One or more required system roles are missing from the roles catalog.");
        }

        return [
            'password' => $password,
            'college'  => $college,
            'programA' => $progA,
            'programB' => $progB,
            'unit'     => $unit,
            'roles'    => array_column($roleRows, 'id', 'role_key'),
        ];
    }
}
