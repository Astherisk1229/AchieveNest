<?php

namespace App\Database\Seeds;

use App\Services\DefenseDemoPreflightService;
use CodeIgniter\Database\Seeder;
use RuntimeException;

class DefenseDemoPersonaSeeder extends Seeder
{
    public function run()
    {
        $db = $this->db;
        $preflight = new DefenseDemoPreflightService();
        $validated = $preflight->validate($db);

        $password = $validated['password'];
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $now = date('Y-m-d H:i:s');

        $roles = $validated['roles'];
        $cba = $validated['college'];
        $bsa = $validated['programA'];
        $bsba = $validated['programB'];
        $adminUnit = $validated['unit'];

        // Demo Organization (operational demo data, scoped to CBA / BSA)
        $demoOrgId = 'd0000000-0000-0000-0002-000000000000';
        $existingOrg = $db->table('organizations')->where('id', $demoOrgId)->get()->getRowArray();
        if ($existingOrg === null) {
            $db->table('organizations')->insert([
                'id'         => $demoOrgId,
                'college_id' => $cba['id'],
                'code'       => 'DEMO_JPIA',
                'name'       => 'Demo Junior Philippine Institute of Accountants',
                'scope'      => 'college',
                'category'   => 'academic_college',
                'status'     => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // Define the 10 Synthetic Demo Personas
        $personas = [
            // 1. Student A (BSA)
            [
                'id'               => 'd0000000-0000-0000-0001-000000000001',
                'institutional_id' => '2026-DEMO-001',
                'name'             => 'Demo Student A (BSA)',
                'email'            => 'demo.student.a@ndmu.edu.ph',
                'account_type'     => 'student',
                'designation'      => 'Student',
                'roles'            => ['student'],
                'student_prog'     => $bsa['id'],
                'year_level'       => '4th Year',
            ],
            // 2. Student B (BSBA-FM - Different Program)
            [
                'id'               => 'd0000000-0000-0000-0001-000000000002',
                'institutional_id' => '2026-DEMO-002',
                'name'             => 'Demo Student B (BSBA-FM)',
                'email'            => 'demo.student.b@ndmu.edu.ph',
                'account_type'     => 'student',
                'designation'      => 'Student',
                'roles'            => ['student'],
                'student_prog'     => $bsba['id'],
                'year_level'       => '4th Year',
            ],
            // 3. Academic Personnel
            [
                'id'               => 'd0000000-0000-0000-0001-000000000003',
                'institutional_id' => '2026-DEMO-003',
                'name'             => 'Demo Faculty (CBA)',
                'email'            => 'demo.academic.personnel@ndmu.edu.ph',
                'account_type'     => 'personnel',
                'personnel_type'   => 'academic',
                'designation'      => 'Associate Professor',
                'roles'            => ['personnel'],
                'college_id'       => $cba['id'],
                'program_id'       => $bsa['id'],
            ],
            // 4. Non-Academic Personnel
            [
                'id'               => 'd0000000-0000-0000-0001-000000000004',
                'institutional_id' => '2026-DEMO-004',
                'name'             => 'Demo Staff (Registrar)',
                'email'            => 'demo.nonacademic.personnel@ndmu.edu.ph',
                'account_type'     => 'personnel',
                'personnel_type'   => 'non_academic',
                'designation'      => 'Administrative Assistant',
                'roles'            => ['personnel'],
                'admin_unit_id'    => $adminUnit['id'],
            ],
            // 5. HR Administrator
            [
                'id'               => 'd0000000-0000-0000-0001-000000000005',
                'institutional_id' => '2026-DEMO-005',
                'name'             => 'Demo HR Administrator',
                'email'            => 'demo.hr.admin@ndmu.edu.ph',
                'account_type'     => 'hr_admin',
                'designation'      => 'HR Director',
                'roles'            => ['hr_staff'],
                'admin_unit_id'    => $adminUnit['id'],
            ],
            // 6. OSAD Administrator
            [
                'id'               => 'd0000000-0000-0000-0001-000000000006',
                'institutional_id' => '2026-DEMO-006',
                'name'             => 'Demo OSAD Administrator',
                'email'            => 'demo.osad.admin@ndmu.edu.ph',
                'account_type'     => 'osad_admin',
                'designation'      => 'Director of Student Affairs',
                'roles'            => ['osad_staff'],
            ],
            // 7. College Dean (CBA)
            [
                'id'               => 'd0000000-0000-0000-0001-000000000007',
                'institutional_id' => '2026-DEMO-007',
                'name'             => 'Demo Dean (CBA)',
                'email'            => 'demo.dean@ndmu.edu.ph',
                'account_type'     => 'personnel',
                'personnel_type'   => 'academic',
                'designation'      => 'Dean, College of Business and Accountancy',
                'roles'            => ['personnel', 'dean'],
                'college_id'       => $cba['id'],
                'program_id'       => $bsa['id'],
                'dean_college_id'  => $cba['id'],
            ],
            // 8. Program Coordinator A (BSA)
            [
                'id'               => 'd0000000-0000-0000-0001-000000000008',
                'institutional_id' => '2026-DEMO-008',
                'name'             => 'Demo Coordinator A (BSA)',
                'email'            => 'demo.coordinator.a@ndmu.edu.ph',
                'account_type'     => 'personnel',
                'personnel_type'   => 'academic',
                'designation'      => 'Program Coordinator - Accountancy',
                'roles'            => ['personnel', 'program_coordinator'],
                'college_id'       => $cba['id'],
                'program_id'       => $bsa['id'],
                'coord_program_id' => $bsa['id'],
            ],
            // 9. Program Coordinator B (BSBA-FM - Different Program)
            [
                'id'               => 'd0000000-0000-0000-0001-000000000009',
                'institutional_id' => '2026-DEMO-009',
                'name'             => 'Demo Coordinator B (BSBA-FM)',
                'email'            => 'demo.coordinator.b@ndmu.edu.ph',
                'account_type'     => 'personnel',
                'personnel_type'   => 'academic',
                'designation'      => 'Program Coordinator - Financial Management',
                'roles'            => ['personnel', 'program_coordinator'],
                'college_id'       => $cba['id'],
                'program_id'       => $bsba['id'],
                'coord_program_id' => $bsba['id'],
            ],
            // 10. Organization Moderator (DEMO_JPIA)
            [
                'id'               => 'd0000000-0000-0000-0001-000000000010',
                'institutional_id' => '2026-DEMO-010',
                'name'             => 'Demo Moderator (JPIA)',
                'email'            => 'demo.moderator@ndmu.edu.ph',
                'account_type'     => 'personnel',
                'personnel_type'   => 'academic',
                'designation'      => 'Faculty Moderator',
                'roles'            => ['personnel', 'organization_moderator'],
                'college_id'       => $cba['id'],
                'program_id'       => $bsa['id'],
                'moderator_org_id' => $demoOrgId,
            ],
        ];

        foreach ($personas as $p) {
            // Profiles table
            $profileData = [
                'id'                   => $p['id'],
                'institutional_id'     => $p['institutional_id'],
                'email'                => $p['email'],
                'full_name'            => $p['name'],
                'account_type'         => $p['account_type'],
                'designation_title'    => $p['designation'] ?? null,
                'status'               => 'active',
                'must_change_password' => 0,
                'password_hash'        => $passwordHash,
                'created_at'           => $now,
                'updated_at'           => $now,
            ];
            $db->table('profiles')->upsert($profileData);

            // Student Subtype Table
            if ($p['account_type'] === 'student') {
                $db->table('student_profiles')->upsert([
                    'profile_id'        => $p['id'],
                    'year_level'        => $p['year_level'] ?? '4th Year',
                    'enrollment_status' => 'enrolled',
                    'created_at'        => $now,
                    'updated_at'        => $now,
                ]);
            }

            // Personnel Subtype Table
            if ($p['account_type'] === 'personnel' || $p['account_type'] === 'hr_admin' || $p['account_type'] === 'osad_admin') {
                $db->table('personnel_profiles')->upsert([
                    'profile_id'               => $p['id'],
                    'personnel_classification' => $p['personnel_type'] ?? 'non_academic',
                    'employment_status'        => 'full_time',
                    'created_at'               => $now,
                    'updated_at'               => $now,
                ]);
            }

            // Local Auth Credentials table
            $credData = [
                'profile_id'    => $p['id'],
                'password_hash' => $passwordHash,
                'status'        => 'active',
                'created_at'    => $now,
                'updated_at'    => $now,
            ];
            $db->table('local_auth_credentials')->upsert($credData);

            // Role Assignments
            foreach ($p['roles'] as $roleKey) {
                if (isset($roles[$roleKey])) {
                    $roleId = $roles[$roleKey];
                    $existingAssoc = $db->table('profile_roles')
                        ->where('profile_id', $p['id'])
                        ->where('role_id', $roleId)
                        ->get()->getRowArray();
                    if ($existingAssoc === null) {
                        $db->table('profile_roles')->insert([
                            'id'          => 'd0000000-0000-0000-0009-' . substr($p['id'], -8) . substr($roleId, -4),
                            'profile_id'  => $p['id'],
                            'role_id'     => $roleId,
                            'scope_type'  => 'university',
                            'is_active'   => 1,
                            'assigned_at' => $now,
                        ]);
                    }
                }
            }

            // Student Affiliation
            if (! empty($p['student_prog'])) {
                $existingEnrollment = $db->table('student_program_enrollments')
                    ->where('student_profile_id', $p['id'])
                    ->where('academic_program_id', $p['student_prog'])
                    ->get()->getRowArray();
                if ($existingEnrollment === null) {
                    $db->table('student_program_enrollments')->insert([
                        'id'                  => 'd0000000-0000-0000-0002-' . substr($p['id'], -12),
                        'student_profile_id'  => $p['id'],
                        'academic_program_id' => $p['student_prog'],
                        'year_level'          => $p['year_level'] ?? '4th Year',
                        'academic_year'       => '2025-2026',
                        'effective_from'      => date('Y-m-d', strtotime('-180 days')),
                        'is_active'           => 1,
                        'created_at'          => $now,
                        'updated_at'          => $now,
                    ]);
                }
            }

            // Academic Personnel College & Program Affiliation
            if (! empty($p['college_id'])) {
                $existingAff = $db->table('personnel_college_affiliations')
                    ->where('personnel_profile_id', $p['id'])
                    ->where('college_id', $p['college_id'])
                    ->get()->getRowArray();
                if ($existingAff === null) {
                    $db->table('personnel_college_affiliations')->insert([
                        'id'                   => 'd0000000-0000-0000-0003-' . substr($p['id'], -12),
                        'personnel_profile_id' => $p['id'],
                        'college_id'           => $p['college_id'],
                        'effective_from'       => date('Y-m-d', strtotime('-365 days')),
                        'is_active'            => 1,
                        'created_at'           => $now,
                        'updated_at'           => $now,
                    ]);
                }
            }

            if (! empty($p['program_id'])) {
                $existingProgAff = $db->table('personnel_program_affiliations')
                    ->where('personnel_profile_id', $p['id'])
                    ->where('academic_program_id', $p['program_id'])
                    ->get()->getRowArray();
                if ($existingProgAff === null) {
                    $db->table('personnel_program_affiliations')->insert([
                        'id'                   => 'd0000000-0000-0000-0004-' . substr($p['id'], -12),
                        'personnel_profile_id' => $p['id'],
                        'academic_program_id'  => $p['program_id'],
                        'effective_from'       => date('Y-m-d', strtotime('-365 days')),
                        'is_active'            => 1,
                        'created_at'           => $now,
                        'updated_at'           => $now,
                    ]);
                }
            }

            // Non-Academic Administrative Unit Affiliation
            if (! empty($p['admin_unit_id'])) {
                $existingAdminAff = $db->table('personnel_administrative_unit_affiliations')
                    ->where('personnel_profile_id', $p['id'])
                    ->where('administrative_unit_id', $p['admin_unit_id'])
                    ->get()->getRowArray();
                if ($existingAdminAff === null) {
                    $db->table('personnel_administrative_unit_affiliations')->insert([
                        'id'                     => 'd0000000-0000-0000-0005-' . substr($p['id'], -12),
                        'personnel_profile_id'   => $p['id'],
                        'administrative_unit_id' => $p['admin_unit_id'],
                        'effective_from'         => date('Y-m-d', strtotime('-365 days')),
                        'is_active'              => 1,
                        'created_at'             => $now,
                        'updated_at'             => $now,
                    ]);
                }
            }

            // Dean Assignment
            if (! empty($p['dean_college_id'])) {
                $existingDean = $db->table('dean_assignments')
                    ->where('personnel_profile_id', $p['id'])
                    ->where('college_id', $p['dean_college_id'])
                    ->get()->getRowArray();
                if ($existingDean === null) {
                    $db->table('dean_assignments')->insert([
                        'id'                   => 'd0000000-0000-0000-0006-000000000001',
                        'personnel_profile_id' => $p['id'],
                        'college_id'           => $p['dean_college_id'],
                        'effective_from'       => date('Y-m-d', strtotime('-365 days')),
                        'is_active'            => 1,
                        'assigned_at'          => $now,
                        'created_at'           => $now,
                        'updated_at'           => $now,
                    ]);
                }
            }

            // Program Coordinator Assignment
            if (! empty($p['coord_program_id'])) {
                $existingCoord = $db->table('program_coordinator_assignments')
                    ->where('personnel_profile_id', $p['id'])
                    ->where('academic_program_id', $p['coord_program_id'])
                    ->get()->getRowArray();
                if ($existingCoord === null) {
                    $db->table('program_coordinator_assignments')->insert([
                        'id'                   => 'd0000000-0000-0000-0007-' . substr($p['id'], -12),
                        'personnel_profile_id' => $p['id'],
                        'academic_program_id'  => $p['coord_program_id'],
                        'effective_from'       => date('Y-m-d', strtotime('-365 days')),
                        'is_active'            => 1,
                        'assigned_at'          => $now,
                        'created_at'           => $now,
                        'updated_at'           => $now,
                    ]);
                }
            }

            // Organization Moderator Assignment
            if (! empty($p['moderator_org_id'])) {
                $existingMod = $db->table('organization_moderator_assignments')
                    ->where('personnel_profile_id', $p['id'])
                    ->where('organization_id', $p['moderator_org_id'])
                    ->get()->getRowArray();
                if ($existingMod === null) {
                    $db->table('organization_moderator_assignments')->insert([
                        'id'                   => 'd0000000-0000-0000-0008-000000000001',
                        'personnel_profile_id' => $p['id'],
                        'organization_id'      => $p['moderator_org_id'],
                        'effective_from'       => date('Y-m-d', strtotime('-365 days')),
                        'is_active'            => 1,
                        'assigned_at'          => $now,
                        'created_at'           => $now,
                        'updated_at'           => $now,
                    ]);
                }
            }
        }
    }
}
