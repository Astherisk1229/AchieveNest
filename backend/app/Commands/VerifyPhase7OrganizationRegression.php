<?php

namespace App\Commands;

use App\Services\OrganizationService;
use App\Services\CollegeService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;
use Throwable;

class VerifyPhase7OrganizationRegression extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:phase7-org-regression';
    protected $description = 'Complete End-to-End Regression Suite for OSAD Organization Creation & Management (Plan 02)';

    public function run(array $params)
    {
        $db = Database::connect();
        $orgService = new OrganizationService($db);
        $collegeService = new CollegeService($db);

        CLI::write("========================================================================", 'cyan');
        CLI::write("Plan 02 Phase 7: OSAD Organization Full Regression Suite", 'white');
        CLI::write("========================================================================", 'cyan');

        $passed = 0;
        $failed = 0;

        $runScenario = function (string $id, string $title, callable $test) use (&$passed, &$failed) {
            CLI::write("Scenario {$id}: {$title} ... ", 'yellow');
            try {
                $result = $test();
                if ($result === true) {
                    CLI::write("PASS", 'green');
                    $passed++;
                } else {
                    CLI::write("FAIL: " . (is_string($result) ? $result : 'Assertion failed'), 'red');
                    $failed++;
                }
            } catch (Throwable $e) {
                CLI::write("FAIL (Exception): " . $e->getMessage(), 'red');
                $failed++;
            }
        };

        // Fixtures
        $college = $db->table('colleges')->where('status', 'active')->get()->getRowArray();
        $collegeId = $college['id'];
        $programs = $db->table('academic_programs')->where('college_id', $collegeId)->where('status', 'active')->limit(4)->get()->getResultArray();
        $p1 = $programs[0]['id'];
        $p2 = $programs[1]['id'];
        $p3 = $programs[2]['id'] ?? null;
        $personnelList = $db->table('profiles')->where('account_type', 'personnel')->where('status', 'active')->limit(3)->get()->getResultArray();
        $mod1 = $personnelList[0]['id'];
        $mod2 = $personnelList[1]['id'];
        $mod3 = $personnelList[2]['id'] ?? null;
        $admin = $db->table('profiles')->where('account_type', 'osad_admin')->where('status', 'active')->get()->getRowArray();
        $adminId = $admin['id'] ?? null;

        // Cleanup pre-existing test data
        $db->table('organizations')->like('code', 'REG_')->delete();

        // -------------------------------------------------------------
        // SECTION 1: CREATION SCENARIOS (1 - 13)
        // -------------------------------------------------------------
        $runScenario('01', 'Create Organization Only (University Scope)', function () use ($orgService, $db) {
            $code = 'REG_01_' . random_int(1000, 9999);
            $org = $orgService->createOrganization([
                'name'     => 'Reg Univ Club',
                'code'     => $code,
                'category' => 'socio_cultural',
                'scope'    => 'university',
            ]);
            if (!$org || $org['code'] !== $code) return 'Creation failed';
            $affCount = $db->table('organization_program_affiliations')->where('organization_id', $org['id'])->countAllResults();
            if ($affCount !== 0) return 'Unexpected affiliations';
            $modCount = $db->table('organization_moderator_assignments')->where('organization_id', $org['id'])->countAllResults();
            if ($modCount !== 0) return 'Unexpected moderator assignments';
            return true;
        });

        $runScenario('02', 'Create with One Program Scope', function () use ($orgService, $db, $collegeId, $p1) {
            $code = 'REG_02_' . random_int(1000, 9999);
            $org = $orgService->createOrganization([
                'name'        => 'Reg Single Prog Org',
                'code'        => $code,
                'category'    => 'academic_college',
                'scope'       => 'program',
                'college_id'  => $collegeId,
                'program_ids' => [$p1],
            ]);
            $affCount = $db->table('organization_program_affiliations')->where('organization_id', $org['id'])->countAllResults();
            return $affCount === 1;
        });

        $runScenario('03', 'Create with Multiple Programs', function () use ($orgService, $db, $collegeId, $p1, $p2) {
            $code = 'REG_03_' . random_int(1000, 9999);
            $org = $orgService->createOrganization([
                'name'        => 'Reg Multi Prog Org',
                'code'        => $code,
                'category'    => 'academic_college',
                'scope'       => 'program',
                'college_id'  => $collegeId,
                'program_ids' => [$p1, $p2],
            ]);
            $affCount = $db->table('organization_program_affiliations')->where('organization_id', $org['id'])->countAllResults();
            return $affCount === 2;
        });

        $runScenario('04', 'Create with Moderator Only', function () use ($orgService, $db, $mod1, $adminId) {
            $code = 'REG_04_' . random_int(1000, 9999);
            $org = $orgService->createOrganization([
                'name'                 => 'Reg Mod Only Org',
                'code'                 => $code,
                'category'             => 'student_council',
                'scope'                => 'university',
                'moderator_profile_id' => $mod1,
            ], null, $adminId);
            $modRow = $db->table('organization_moderator_assignments')->where('organization_id', $org['id'])->where('is_active', 1)->get()->getRowArray();
            return ($modRow && $modRow['personnel_profile_id'] === $mod1);
        });

        $runScenario('05', 'Full Configuration Creation', function () use ($orgService, $db, $collegeId, $p1, $p2, $mod1, $adminId) {
            $code = 'REG_05_' . random_int(1000, 9999);
            $org = $orgService->createOrganization([
                'name'                 => 'Reg Full Org',
                'code'                 => $code,
                'category'             => 'academic_college',
                'scope'                => 'program',
                'college_id'           => $collegeId,
                'program_ids'          => [$p1, $p2],
                'moderator_profile_id' => $mod1,
            ], null, $adminId);
            if (count($org['programs']) !== 2) return 'Programs count mismatch';
            if (($org['current_moderator']['profile_id'] ?? null) !== $mod1) return 'Moderator mismatch';
            return true;
        });

        $runScenario('06', 'Duplicate Program Selection Deduplication', function () use ($orgService, $db, $collegeId, $p1) {
            $code = 'REG_06_' . random_int(1000, 9999);
            $org = $orgService->createOrganization([
                'name'        => 'Reg Dedup Org',
                'code'        => $code,
                'category'    => 'academic_college',
                'scope'       => 'program',
                'college_id'  => $collegeId,
                'program_ids' => [$p1, $p1, $p1],
            ]);
            $count = $db->table('organization_program_affiliations')->where('organization_id', $org['id'])->countAllResults();
            return $count === 1;
        });

        $runScenario('07', 'Invalid Program Rollback (Zero Partial Persistence)', function () use ($orgService, $db, $collegeId) {
            $code = 'REG_07_' . random_int(1000, 9999);
            $failed = false;
            try {
                $orgService->createOrganization([
                    'name'        => 'Reg Invalid Prog Org',
                    'code'        => $code,
                    'category'    => 'academic_college',
                    'scope'       => 'program',
                    'college_id'  => $collegeId,
                    'program_ids' => ['00000000-0000-0000-0000-000000000000'],
                ]);
            } catch (Throwable $e) {
                $failed = true;
            }
            if (!$failed) return 'Expected creation to fail on invalid program';
            $dbRow = $db->table('organizations')->where('code', $code)->get()->getRowArray();
            return $dbRow === null;
        });

        $runScenario('09', 'Invalid Moderator Rollback (Zero Partial Persistence)', function () use ($orgService, $db) {
            $code = 'REG_09_' . random_int(1000, 9999);
            $failed = false;
            try {
                $orgService->createOrganization([
                    'name'                 => 'Reg Invalid Mod Org',
                    'code'                 => $code,
                    'category'             => 'sports',
                    'scope'                => 'university',
                    'moderator_profile_id' => '00000000-0000-0000-0000-000000000000',
                ]);
            } catch (Throwable $e) {
                $failed = true;
            }
            if (!$failed) return 'Expected creation to fail on invalid moderator';
            $dbRow = $db->table('organizations')->where('code', $code)->get()->getRowArray();
            return $dbRow === null;
        });

        // -------------------------------------------------------------
        // SECTION 2: EDIT ORGANIZATION & MASTER DATA ISOLATION (21 - 24)
        // -------------------------------------------------------------
        $runScenario('21', 'Edit Organization Name (Master Data Only)', function () use ($orgService, $collegeId, $p1) {
            $code = 'REG_21_' . random_int(1000, 9999);
            $org = $orgService->createOrganization([
                'name'        => 'Original Name',
                'code'        => $code,
                'category'    => 'academic_college',
                'scope'       => 'program',
                'college_id'  => $collegeId,
                'program_ids' => [$p1],
            ]);
            $updated = $orgService->updateOrganization($org['id'], ['name' => 'Renamed Organization']);
            if ($updated['name'] !== 'Renamed Organization') return 'Name was not updated';
            if (count($updated['programs']) !== 1) return 'Program scope was corrupted';
            return true;
        });

        $runScenario('22', 'Edit Organization Acronym / Code', function () use ($orgService) {
            $code = 'REG_22A';
            $org = $orgService->createOrganization([
                'name'     => 'Acronym Edit Org',
                'code'     => $code,
                'category' => 'co_curricular',
                'scope'    => 'university',
            ]);
            $updated = $orgService->updateOrganization($org['id'], ['code' => 'REG_22B']);
            return $updated['code'] === 'REG_22B';
        });

        $runScenario('24', 'Duplicate Name / Code Conflict Protection', function () use ($orgService) {
            $code = 'REG_24_DUP';
            $orgService->createOrganization([
                'name'     => 'Original Conflict Org',
                'code'     => $code,
                'category' => 'special_interest',
                'scope'    => 'university',
            ]);
            $failed = false;
            try {
                $orgService->createOrganization([
                    'name'     => 'Duplicate Code Org',
                    'code'     => $code,
                    'category' => 'special_interest',
                    'scope'    => 'university',
                ]);
            } catch (Throwable $e) {
                $failed = true;
            }
            return $failed;
        });

        // -------------------------------------------------------------
        // SECTION 3: PROGRAM SCOPE MANAGEMENT (25 - 30)
        // -------------------------------------------------------------
        $runScenario('25', 'Add Program to Scope Post-Creation', function () use ($orgService, $collegeId, $p1, $p2) {
            $code = 'REG_25_' . random_int(1000, 9999);
            $org = $orgService->createOrganization([
                'name'        => 'Scope Add Org',
                'code'        => $code,
                'category'    => 'academic_college',
                'scope'       => 'program',
                'college_id'  => $collegeId,
                'program_ids' => [$p1],
            ]);
            $updated = $orgService->addProgramAffiliations($org['id'], [$p2]);
            return count($updated['programs']) === 2;
        });

        $runScenario('28', 'Remove Program from Scope & Integrity Protection', function () use ($orgService, $collegeId, $p1, $p2) {
            $code = 'REG_28_' . random_int(1000, 9999);
            $org = $orgService->createOrganization([
                'name'        => 'Scope Remove Org',
                'code'        => $code,
                'category'    => 'academic_college',
                'scope'       => 'program',
                'college_id'  => $collegeId,
                'program_ids' => [$p1, $p2],
            ]);
            $step1 = $orgService->removeProgramAffiliation($org['id'], $p2);
            if (count($step1['programs']) !== 1) return 'Failed to remove p2';

            // Attempt removing last program -> must be blocked
            $failed = false;
            try {
                $orgService->removeProgramAffiliation($org['id'], $p1);
            } catch (Throwable $e) {
                $failed = true;
            }
            return $failed;
        });

        // -------------------------------------------------------------
        // SECTION 4: MODERATOR LIFECYCLE & HISTORY (31 - 40)
        // -------------------------------------------------------------
        $runScenario('31', 'Assign, Replace, and Remove Moderator with History', function () use ($orgService, $db, $mod1, $mod2, $adminId) {
            $code = 'REG_31_' . random_int(1000, 9999);
            $org = $orgService->createOrganization([
                'name'     => 'Mod History Org',
                'code'     => $code,
                'category' => 'religious',
                'scope'    => 'university',
            ]);

            // 1. Assign Mod1
            $s1 = $orgService->assignModerator($org['id'], $mod1, $adminId);
            if (($s1['current_moderator']['profile_id'] ?? null) !== $mod1) return 'Mod1 assignment failed';

            // 2. Replace with Mod2
            $s2 = $orgService->assignModerator($org['id'], $mod2, $adminId);
            if (($s2['current_moderator']['profile_id'] ?? null) !== $mod2) return 'Mod2 replacement failed';

            // 3. Remove Moderator
            $s3 = $orgService->removeModerator($org['id'], $adminId);
            if ($s3['current_moderator'] !== null) return 'Moderator removal failed';

            // Verify History rows
            $history = $db->table('organization_moderator_assignments')->where('organization_id', $org['id'])->get()->getResultArray();
            if (count($history) !== 2) return 'Expected 2 historical records, got ' . count($history);

            foreach ($history as $h) {
                if ((int)$h['is_active'] !== 0) return 'Historical row remains active';
                if (empty($h['effective_until'])) return 'Historical row missing effective_until';
            }
            return true;
        });

        $runScenario('36', 'One Active Moderator per Organization Constraint', function () use ($orgService, $db, $mod1, $adminId) {
            $code = 'REG_36_' . random_int(1000, 9999);
            $org = $orgService->createOrganization([
                'name'                 => 'Single Mod Org',
                'code'                 => $code,
                'category'             => 'sports',
                'scope'                => 'university',
                'moderator_profile_id' => $mod1,
            ], null, $adminId);

            $activeCount = $db->table('organization_moderator_assignments')
                ->where('organization_id', $org['id'])
                ->where('is_active', 1)
                ->countAllResults();

            return $activeCount === 1;
        });

        // -------------------------------------------------------------
        // SECTION 5: DATABASE INTEGRITY QUERIES (77 - 81)
        // -------------------------------------------------------------
        $runScenario('77', 'DB Integrity: Orphan Program Affiliations = 0', function () use ($db) {
            $orphans = $db->query("
                SELECT opa.id
                FROM organization_program_affiliations opa
                LEFT JOIN organizations o ON o.id = opa.organization_id
                LEFT JOIN academic_programs ap ON ap.id = opa.academic_program_id
                WHERE o.id IS NULL OR ap.id IS NULL
            ")->getResultArray();
            return count($orphans) === 0;
        });

        $runScenario('78', 'DB Integrity: Orphan Moderator Assignments = 0', function () use ($db) {
            $orphans = $db->query("
                SELECT oma.id
                FROM organization_moderator_assignments oma
                LEFT JOIN organizations o ON o.id = oma.organization_id
                LEFT JOIN profiles p ON p.id = oma.personnel_profile_id
                WHERE o.id IS NULL OR p.id IS NULL
            ")->getResultArray();
            return count($orphans) === 0;
        });

        $runScenario('79', 'DB Integrity: Multiple Active Moderators Violations = 0', function () use ($db) {
            $violations = $db->query("
                SELECT organization_id, COUNT(*) as active_cnt
                FROM organization_moderator_assignments
                WHERE is_active = 1
                GROUP BY organization_id
                HAVING COUNT(*) > 1
            ")->getResultArray();
            return count($violations) === 0;
        });

        $runScenario('80', 'DB Integrity: Moderator Temporal Validity', function () use ($db) {
            $invalid = $db->query("
                SELECT id
                FROM organization_moderator_assignments
                WHERE effective_until IS NOT NULL AND effective_until < effective_from
            ")->getResultArray();
            return count($invalid) === 0;
        });

        $runScenario('81', 'DB Integrity: Duplicate Active Program Affiliations = 0', function () use ($db) {
            $dups = $db->query("
                SELECT organization_id, academic_program_id, COUNT(*) as cnt
                FROM organization_program_affiliations
                GROUP BY organization_id, academic_program_id
                HAVING COUNT(*) > 1
            ")->getResultArray();
            return count($dups) === 0;
        });

        // -------------------------------------------------------------
        // SECTION 6: PLAN 01 REGRESSION CHECKS (82 - 83)
        // -------------------------------------------------------------
        $runScenario('82', 'Plan 01 Regression: Academic Programs & Coordinator Read Contracts', function () use ($collegeService, $collegeId) {
            $programs = $collegeService->listPrograms();
            if (!is_array($programs) || count($programs) === 0) return 'listPrograms failed';
            $personnel = $collegeService->listCoordinatorPersonnel($collegeId);
            if (!is_array($personnel) || count($personnel) === 0) return 'listCoordinatorPersonnel failed';
            return true;
        });

        // Cleanup
        $db->table('organizations')->like('code', 'REG_')->delete();

        CLI::write("\n========================================================================", 'cyan');
        CLI::write("Phase 7 Regression Verification Summary: {$passed} PASSED, {$failed} FAILED", $failed === 0 ? 'green' : 'red');
        CLI::write("========================================================================", 'cyan');

        return $failed === 0 ? 0 : 1;
    }
}
