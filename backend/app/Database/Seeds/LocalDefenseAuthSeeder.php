<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class LocalDefenseAuthSeeder extends Seeder
{
    public function run()
    {
        $db = $this->db;
        $defaultPassword = 'Password123!@#';
        $passwordHash = password_hash($defaultPassword, PASSWORD_DEFAULT);

        // 1. Roles mapping
        $roleRows = $db->table('roles')->get()->getResultArray();
        $rolesByKey = [];
        foreach ($roleRows as $r) {
            $rolesByKey[$r['role_key']] = $r['id'];
        }

        // 2. Colleges & Programs
        $cet = $db->table('colleges')->where('code', 'CET')->orWhere('code', 'CEAC')->get()->getRowArray();
        $cba = $db->table('colleges')->where('code', 'CBA')->orWhere('code', 'CBGA')->get()->getRowArray();
        $cetId = $cet['id'] ?? null;
        $cbaId = $cba['id'] ?? null;

        $bscs = $db->table('academic_programs')->where('code', 'BSCS')->get()->getRowArray();
        $bsit = $db->table('academic_programs')->where('code', 'BSIT')->orWhere('code', 'BSCS')->get()->getRowArray();
        $bscsId = $bscs['id'] ?? null;
        $bsitId = $bsit['id'] ?? null;

        $hrUnit = $db->table('administrative_units')->where('code', 'HR')->orWhere('code', 'HRD')->get()->getRowArray();
        $hrUnitId = $hrUnit['id'] ?? null;

        // Ensure organizations exist for moderator testing
        $orgAId = '40000000-0000-0000-0000-000000000001';
        $existingOrg = $db->table('organizations')->where('id', $orgAId)->get()->getRowArray();
        if ($existingOrg === null && $cetId !== null) {
            $db->table('organizations')->insert([
                'id'         => $orgAId,
                'college_id' => $cetId,
                'code'       => 'CSS',
                'name'       => 'Computer Science Society',
                'scope'      => 'college',
                'category'   => 'academic_college',
                'status'     => 'active',
            ]);
        }

        // 3. Test Actors
        $actors = [
            [
                'id'               => '10000000-0000-0000-0000-000000000001',
                'institutional_id' => '2026000001',
                'name'             => 'Juan Dela Cruz',
                'email'            => 'student.01@ndmu.edu.ph',
                'account_type'     => 'student',
                'designation'      => 'Student',
                'status'           => 'active',
                'must_change'      => 0,
                'roles'            => ['student'],
                'student_prog'     => $bscsId,
            ],
            [
                'id'               => '10000000-0000-0000-0000-000000000002',
                'institutional_id' => '2026000002',
                'name'             => 'Maria Santos',
                'email'            => 'student.02@ndmu.edu.ph',
                'account_type'     => 'student',
                'designation'      => 'Student',
                'status'           => 'active',
                'must_change'      => 1, // Test must_change_password
                'roles'            => ['student'],
                'student_prog'     => $bsitId,
            ],
            [
                'id'               => '10000000-0000-0000-0000-000000000003',
                'institutional_id' => '9000000001',
                'name'             => 'Ricardo Reyes',
                'email'            => 'faculty.01@ndmu.edu.ph',
                'account_type'     => 'personnel',
                'designation'      => 'Assistant Professor',
                'status'           => 'active',
                'must_change'      => 0,
                'roles'            => ['personnel'],
                'personnel_type'   => 'academic',
                'college_id'       => $cetId,
                'prog_ids'         => [$bscsId],
            ],
            [
                'id'               => '10000000-0000-0000-0000-000000000007',
                'institutional_id' => '9000000007',
                'name'             => 'Lourdes Bautista',
                'email'            => 'staff.nonacad01@ndmu.edu.ph',
                'account_type'     => 'personnel',
                'designation'      => 'Administrative Officer',
                'status'           => 'active',
                'must_change'      => 0,
                'roles'            => ['personnel'],
                'personnel_type'   => 'non_academic',
                'unit_id'          => $hrUnitId,
            ],
            [
                'id'               => '10000000-0000-0000-0000-000000000004',
                'institutional_id' => '9000000010',
                'name'             => 'Evelyn Mercado',
                'email'            => 'hr.admin01@ndmu.edu.ph',
                'account_type'     => 'hr_admin',
                'designation'      => 'HR Director',
                'status'           => 'active',
                'must_change'      => 0,
                'roles'            => ['hr_staff', 'personnel'],
                'personnel_type'   => 'non_academic',
                'unit_id'          => $hrUnitId,
            ],
            [
                'id'               => '10000000-0000-0000-0000-000000000005',
                'institutional_id' => '9000000020',
                'name'             => 'Marcus Cruz',
                'email'            => 'osad.admin01@ndmu.edu.ph',
                'account_type'     => 'osad_admin',
                'designation'      => 'OSAD Director',
                'status'           => 'active',
                'must_change'      => 0,
                'roles'            => ['osad_staff', 'personnel'],
                'personnel_type'   => 'non_academic',
                'unit_id'          => $hrUnitId,
            ],
            [
                'id'               => '10000000-0000-0000-0000-000000000008',
                'institutional_id' => '9000000008',
                'name'             => 'Arthur Pendelton',
                'email'            => 'dean.cet01@ndmu.edu.ph',
                'account_type'     => 'personnel',
                'designation'      => 'College Dean',
                'status'           => 'active',
                'must_change'      => 0,
                'roles'            => ['personnel'],
                'personnel_type'   => 'academic',
                'college_id'       => $cetId,
                'prog_ids'         => [$bscsId],
                'dean_college_id'  => $cetId,
            ],
            [
                'id'               => '10000000-0000-0000-0000-000000000009',
                'institutional_id' => '9000000009',
                'name'             => 'Cynthia Ramos',
                'email'            => 'coord.bscs01@ndmu.edu.ph',
                'account_type'     => 'personnel',
                'designation'      => 'Program Coordinator',
                'status'           => 'active',
                'must_change'      => 0,
                'roles'            => ['personnel'],
                'personnel_type'   => 'academic',
                'college_id'       => $cetId,
                'prog_ids'         => [$bscsId],
                'coord_prog_id'    => $bscsId,
            ],
            [
                'id'               => '10000000-0000-0000-0000-000000000010',
                'institutional_id' => '9000000011',
                'name'             => 'David Villanueva',
                'email'            => 'mod.css01@ndmu.edu.ph',
                'account_type'     => 'personnel',
                'designation'      => 'Faculty Moderator',
                'status'           => 'active',
                'must_change'      => 0,
                'roles'            => ['personnel'],
                'personnel_type'   => 'academic',
                'college_id'       => $cetId,
                'prog_ids'         => [$bscsId],
                'mod_org_id'       => $orgAId,
            ],
            // Suspended Account
            [
                'id'               => '10000000-0000-0000-0000-000000000091',
                'institutional_id' => '2026000091',
                'name'             => 'Suspended Student',
                'email'            => 'suspended.student@ndmu.edu.ph',
                'account_type'     => 'student',
                'designation'      => 'Student',
                'status'           => 'suspended',
                'must_change'      => 0,
                'roles'            => ['student'],
                'student_prog'     => $bscsId,
            ],
            // Archived Account
            [
                'id'               => '10000000-0000-0000-0000-000000000092',
                'institutional_id' => '2026000092',
                'name'             => 'Archived Student',
                'email'            => 'archived.student@ndmu.edu.ph',
                'account_type'     => 'student',
                'designation'      => 'Student',
                'status'           => 'archived',
                'must_change'      => 0,
                'roles'            => ['student'],
                'student_prog'     => $bscsId,
            ],
            // Disabled Credential Account
            [
                'id'               => '10000000-0000-0000-0000-000000000093',
                'institutional_id' => '2026000093',
                'name'             => 'Disabled Credential Student',
                'email'            => 'disabled.student@ndmu.edu.ph',
                'account_type'     => 'student',
                'designation'      => 'Student',
                'status'           => 'active',
                'credential_status'=> 'disabled',
                'must_change'      => 0,
                'roles'            => ['student'],
                'student_prog'     => $bscsId,
            ],
        ];

        foreach ($actors as $actor) {
            $now = date('Y-m-d H:i:s');
            
            // Insert/Update profile
            $existing = $db->table('profiles')->where('id', $actor['id'])->get()->getRowArray();
            $profileData = [
                'id'                   => $actor['id'],
                'institutional_id'     => $actor['institutional_id'],
                'email'                => $actor['email'],
                'full_name'            => $actor['name'],
                'account_type'         => $actor['account_type'],
                'designation_title'    => $actor['designation'],
                'status'               => $actor['status'],
                'password_hash'        => $passwordHash,
                'must_change_password' => $actor['must_change'],
            ];

            if ($existing === null) {
                $db->table('profiles')->insert($profileData);
            } else {
                $db->table('profiles')->where('id', $actor['id'])->update($profileData);
            }

            // Insert/Update local_auth_credentials
            $existingCred = $db->table('local_auth_credentials')->where('profile_id', $actor['id'])->get()->getRowArray();
            $credData = [
                'profile_id'          => $actor['id'],
                'password_hash'       => $passwordHash,
                'password_changed_at' => $now,
                'status'              => $actor['credential_status'] ?? 'active',
            ];
            if ($existingCred === null) {
                $db->table('local_auth_credentials')->insert($credData);
            } else {
                $db->table('local_auth_credentials')->where('profile_id', $actor['id'])->update($credData);
            }

            // Student profile & enrollment
            if ($actor['account_type'] === 'student') {
                $existingSp = $db->table('student_profiles')->where('profile_id', $actor['id'])->get()->getRowArray();
                if ($existingSp === null) {
                    $db->table('student_profiles')->insert([
                        'profile_id'        => $actor['id'],
                        'year_level'        => '3rd Year',
                        'enrollment_status' => 'enrolled',
                    ]);
                }

                if (! empty($actor['student_prog'])) {
                    $existingSpe = $db->table('student_program_enrollments')->where('student_profile_id', $actor['id'])->get()->getRowArray();
                    if ($existingSpe === null) {
                        $db->table('student_program_enrollments')->insert([
                            'id'                  => $this->genUuid('spe-' . $actor['id']),
                            'student_profile_id'  => $actor['id'],
                            'academic_program_id' => $actor['student_prog'],
                            'year_level'          => '3rd Year',
                            'academic_year'       => '2025-2026',
                            'effective_from'      => date('Y-m-d'),
                            'is_active'           => 1,
                        ]);
                    }
                }
            }

            // Personnel profile & affiliations
            if (in_array($actor['account_type'], ['personnel', 'hr_admin', 'osad_admin'], true)) {
                $existingPp = $db->table('personnel_profiles')->where('profile_id', $actor['id'])->get()->getRowArray();
                if ($existingPp === null) {
                    $db->table('personnel_profiles')->insert([
                        'profile_id'               => $actor['id'],
                        'personnel_classification' => $actor['personnel_type'] ?? 'academic',
                        'employment_status'        => 'full_time',
                    ]);
                }

                if (! empty($actor['college_id'])) {
                    $existingPca = $db->table('personnel_college_affiliations')->where('personnel_profile_id', $actor['id'])->get()->getRowArray();
                    if ($existingPca === null) {
                        $db->table('personnel_college_affiliations')->insert([
                            'id'                   => $this->genUuid('pca-' . $actor['id']),
                            'personnel_profile_id' => $actor['id'],
                            'college_id'           => $actor['college_id'],
                            'effective_from'       => date('Y-m-d'),
                            'is_active'            => 1,
                        ]);
                    }
                }

                if (! empty($actor['prog_ids'])) {
                    foreach ($actor['prog_ids'] as $pid) {
                        if ($pid !== null) {
                            $existingPpa = $db->table('personnel_program_affiliations')
                                ->where('personnel_profile_id', $actor['id'])
                                ->where('academic_program_id', $pid)
                                ->get()->getRowArray();
                            if ($existingPpa === null) {
                                $db->table('personnel_program_affiliations')->insert([
                                    'id'                   => $this->genUuid('ppa-' . $actor['id'] . '-' . $pid),
                                    'personnel_profile_id' => $actor['id'],
                                    'academic_program_id'  => $pid,
                                    'effective_from'       => date('Y-m-d'),
                                    'is_active'            => 1,
                                ]);
                            }
                        }
                    }
                }

                if (! empty($actor['unit_id'])) {
                    $existingPau = $db->table('personnel_administrative_unit_affiliations')->where('personnel_profile_id', $actor['id'])->get()->getRowArray();
                    if ($existingPau === null) {
                        $db->table('personnel_administrative_unit_affiliations')->insert([
                            'id'                     => $this->genUuid('pau-' . $actor['id']),
                            'personnel_profile_id'   => $actor['id'],
                            'administrative_unit_id' => $actor['unit_id'],
                            'effective_from'         => date('Y-m-d'),
                            'is_active'              => 1,
                        ]);
                    }
                }

                // Dean assignment
                if (! empty($actor['dean_college_id'])) {
                    $existingDean = $db->table('dean_assignments')->where('personnel_profile_id', $actor['id'])->get()->getRowArray();
                    if ($existingDean === null) {
                        $db->table('dean_assignments')->insert([
                            'id'                   => $this->genUuid('dean-' . $actor['id']),
                            'personnel_profile_id' => $actor['id'],
                            'college_id'           => $actor['dean_college_id'],
                            'effective_from'       => date('Y-m-d'),
                            'is_active'            => 1,
                            'assigned_by'          => $actor['id'],
                        ]);
                    }
                }

                // Program coordinator assignment
                if (! empty($actor['coord_prog_id'])) {
                    $existingCoord = $db->table('program_coordinator_assignments')->where('personnel_profile_id', $actor['id'])->get()->getRowArray();
                    if ($existingCoord === null) {
                        $db->table('program_coordinator_assignments')->insert([
                            'id'                   => $this->genUuid('pca-asgn-' . $actor['id']),
                            'personnel_profile_id' => $actor['id'],
                            'academic_program_id'  => $actor['coord_prog_id'],
                            'effective_from'       => date('Y-m-d'),
                            'is_active'            => 1,
                            'assigned_by'          => $actor['id'],
                        ]);
                    }
                }

                // Organization moderator assignment
                if (! empty($actor['mod_org_id'])) {
                    $existingMod = $db->table('organization_moderator_assignments')->where('personnel_profile_id', $actor['id'])->get()->getRowArray();
                    if ($existingMod === null) {
                        $db->table('organization_moderator_assignments')->insert([
                            'id'                   => $this->genUuid('oma-' . $actor['id']),
                            'personnel_profile_id' => $actor['id'],
                            'organization_id'      => $actor['mod_org_id'],
                            'effective_from'       => date('Y-m-d'),
                            'is_active'            => 1,
                            'assigned_by'          => $actor['id'],
                        ]);
                    }
                }
            }

            // Profile roles
            foreach ($actor['roles'] as $rk) {
                if (isset($rolesByKey[$rk])) {
                    $existingPr = $db->table('profile_roles')
                        ->where('profile_id', $actor['id'])
                        ->where('role_id', $rolesByKey[$rk])
                        ->get()->getRowArray();
                    if ($existingPr === null) {
                        $db->table('profile_roles')->insert([
                            'id'          => $this->genUuid('pr-' . $actor['id'] . '-' . $rk),
                            'profile_id'  => $actor['id'],
                            'role_id'     => $rolesByKey[$rk],
                            'scope_type'  => 'university',
                            'scope_id'    => null,
                            'is_active'   => 1,
                            'assigned_by' => $actor['id'],
                            'assigned_at' => $now,
                        ]);
                    }
                }
            }
        }
    }

    private function genUuid(string $seed): string
    {
        $h = md5($seed);
        return sprintf('%s-%s-%s-%s-%s',
            substr($h, 0, 8),
            substr($h, 8, 4),
            substr($h, 12, 4),
            substr($h, 16, 4),
            substr($h, 20, 12)
        );
    }
}
