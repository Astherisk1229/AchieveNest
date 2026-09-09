<?php

namespace App\Commands;

use App\Services\OrganizationService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;
use Throwable;

class VerifyPhase3OrganizationTransaction extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:phase3-org-transaction';
    protected $description = 'Verifies Phase 3 transactional organization creation, rollback, and normalization';

    public function run(array $params)
    {
        $db = Database::connect();
        $service = new OrganizationService($db);

        CLI::write("==================================================", 'cyan');
        CLI::write("Plan 02 Phase 3: Organization Transaction Verification", 'white');
        CLI::write("==================================================", 'cyan');

        $passed = 0;
        $failed = 0;

        // Helper test runner
        $runTest = function (string $name, callable $test) use (&$passed, &$failed) {
            CLI::write("Running: {$name} ... ", 'yellow');
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

        // Fetch sample fixtures from DB
        $college = $db->table('colleges')->where('status', 'active')->get()->getRowArray();
        $programs = $db->table('academic_programs')->where('college_id', $college['id'])->where('status', 'active')->get()->getResultArray();
        $personnel = $db->table('profiles')->where('account_type', 'personnel')->where('status', 'active')->get()->getRowArray();
        $admin = $db->table('profiles')->where('account_type', 'osad_admin')->where('status', 'active')->get()->getRowArray();

        $prog1 = $programs[0]['id'] ?? null;
        $prog2 = $programs[1]['id'] ?? null;
        $collegeId = $college['id'] ?? null;
        $personnelId = $personnel['id'] ?? null;
        $adminId = $admin['id'] ?? null;

        // Cleanup any pre-existing test orgs
        $db->table('organizations')->like('code', 'TEST_')->delete();

        // TEST 1: Organization-only creation (University scope, 0 programs, 0 moderator)
        $runTest('1. Organization-only creation (University Scope)', function () use ($service, $db) {
            $code = 'TEST_UNIV_' . random_int(1000, 9999);
            $res = $service->createOrganization([
                'name'     => 'Test University Society',
                'code'     => $code,
                'category' => 'student_council',
                'scope'    => 'university',
            ]);

            if (empty($res['id']) || $res['code'] !== $code) return 'Invalid returned organization';
            if ($res['configuration_status'] !== 'PARTIALLY_CONFIGURED') return 'Expected PARTIALLY_CONFIGURED status';
            if (! empty($res['program_ids'])) return 'Expected 0 program IDs';
            if ($res['current_moderator'] !== null) return 'Expected null moderator';

            // Verify in DB
            $dbRow = $db->table('organizations')->where('id', $res['id'])->get()->getRowArray();
            if (! $dbRow) return 'Organization row not found in DB';

            $affCount = $db->table('organization_program_affiliations')->where('organization_id', $res['id'])->countAllResults();
            if ($affCount !== 0) return "Expected 0 affiliations in DB, got {$affCount}";

            $modCount = $db->table('organization_moderator_assignments')->where('organization_id', $res['id'])->countAllResults();
            if ($modCount !== 0) return "Expected 0 moderator assignments in DB, got {$modCount}";

            return true;
        });

        // TEST 2: Organization + Program Scope Creation (Program scope, multiple programs, 0 moderator)
        $runTest('2. Organization + Multiple Program Scope creation', function () use ($service, $db, $collegeId, $prog1, $prog2) {
            $code = 'TEST_PROG_' . random_int(1000, 9999);
            $res = $service->createOrganization([
                'name'        => 'Test Computer Society',
                'code'        => $code,
                'category'    => 'academic_college',
                'scope'       => 'program',
                'college_id'  => $collegeId,
                'program_ids' => [$prog1, $prog2],
            ]);

            if (count($res['program_ids']) !== 2) return 'Expected 2 program IDs returned';
            if (count($res['programs']) !== 2) return 'Expected 2 program objects returned';
            if ($res['current_moderator'] !== null) return 'Expected null moderator';

            $affCount = $db->table('organization_program_affiliations')->where('organization_id', $res['id'])->countAllResults();
            if ($affCount !== 2) return "Expected 2 affiliations in DB, got {$affCount}";

            return true;
        });

        // TEST 3: Organization + Moderator Creation (University scope, 1 moderator)
        $runTest('3. Organization + Initial Moderator creation', function () use ($service, $db, $personnelId, $adminId) {
            $code = 'TEST_MOD_' . random_int(1000, 9999);
            $res = $service->createOrganization([
                'name'                 => 'Test Leadership Guild',
                'code'                 => $code,
                'category'             => 'special_interest',
                'scope'                => 'university',
                'moderator_profile_id' => $personnelId,
            ], null, $adminId);

            if ($res['current_moderator'] === null) return 'Expected current_moderator populated';
            if ($res['current_moderator']['profile_id'] !== $personnelId) return 'Moderator profile ID mismatch';
            if ($res['configuration_status'] !== 'COMPLETE') return 'Expected COMPLETE status';

            $modRow = $db->table('organization_moderator_assignments')
                ->where('organization_id', $res['id'])
                ->where('is_active', 1)
                ->get()->getRowArray();
            if (! $modRow) return 'Active moderator assignment not in DB';
            if ($modRow['personnel_profile_id'] !== $personnelId) return 'DB personnel ID mismatch';
            if ($modRow['assigned_by'] !== $adminId) return 'DB assigned_by mismatch';

            return true;
        });

        // TEST 4: Full Configuration Creation (Program scope + multiple programs + moderator)
        $runTest('4. Full Configuration (Program Scope + Programs + Moderator)', function () use ($service, $db, $collegeId, $prog1, $prog2, $personnelId, $adminId) {
            $code = 'TEST_FULL_' . random_int(1000, 9999);
            $res = $service->createOrganization([
                'name'                 => 'Test Full Stack League',
                'code'                 => $code,
                'category'             => 'academic_college',
                'scope'                => 'program',
                'college_id'           => $collegeId,
                'program_ids'          => [$prog1, $prog2],
                'moderator_profile_id' => $personnelId,
            ], null, $adminId);

            if ($res['configuration_status'] !== 'COMPLETE') return 'Expected COMPLETE status';
            if (count($res['programs']) !== 2) return 'Expected 2 programs';
            if ($res['current_moderator']['profile_id'] !== $personnelId) return 'Expected moderator';

            // Verify in DB
            $affCount = $db->table('organization_program_affiliations')->where('organization_id', $res['id'])->countAllResults();
            $modCount = $db->table('organization_moderator_assignments')->where('organization_id', $res['id'])->where('is_active', 1)->countAllResults();
            if ($affCount !== 2 || $modCount !== 1) return "DB mismatch: aff={$affCount}, mod={$modCount}";

            return true;
        });

        // TEST 5: Duplicate Program IDs in request (Automatic deduplication)
        $runTest('5. Duplicate Program IDs in creation payload (Deduplication)', function () use ($service, $db, $collegeId, $prog1) {
            $code = 'TEST_DEDUP_' . random_int(1000, 9999);
            $res = $service->createOrganization([
                'name'        => 'Test Dedup Society',
                'code'        => $code,
                'category'    => 'academic_college',
                'scope'       => 'program',
                'college_id'  => $collegeId,
                'program_ids' => [$prog1, $prog1, $prog1],
            ]);

            if (count($res['program_ids']) !== 1) return 'Expected 1 deduplicated program ID';
            $affCount = $db->table('organization_program_affiliations')->where('organization_id', $res['id'])->countAllResults();
            if ($affCount !== 1) return "Expected 1 DB affiliation row, got {$affCount}";

            return true;
        });

        // TEST 6: Rollback on Invalid Program ID
        $runTest('6. Rollback on Invalid Program ID', function () use ($service, $db, $collegeId, $prog1) {
            $code = 'TEST_FAIL_PROG_' . random_int(1000, 9999);
            $fakeProg = '99999999-9999-9999-9999-999999999999';

            $failed = false;
            try {
                $service->createOrganization([
                    'name'        => 'Test Failing Program Org',
                    'code'        => $code,
                    'category'    => 'academic_college',
                    'scope'       => 'program',
                    'college_id'  => $collegeId,
                    'program_ids' => [$prog1, $fakeProg],
                ]);
            } catch (Throwable $e) {
                $failed = true;
            }

            if (! $failed) return 'Expected createOrganization to throw exception on invalid program';

            $dbRow = $db->table('organizations')->where('code', $code)->get()->getRowArray();
            if ($dbRow) return 'Organization row was NOT rolled back';

            return true;
        });

        // TEST 7: Rollback on Invalid Moderator ID
        $runTest('7. Rollback on Invalid Moderator ID', function () use ($service, $db) {
            $code = 'TEST_FAIL_MOD_' . random_int(1000, 9999);
            $fakeMod = '99999999-9999-9999-9999-999999999999';

            $failed = false;
            try {
                $service->createOrganization([
                    'name'                 => 'Test Failing Mod Org',
                    'code'                 => $code,
                    'category'             => 'student_council',
                    'scope'                => 'university',
                    'moderator_profile_id' => $fakeMod,
                ]);
            } catch (Throwable $e) {
                $failed = true;
            }

            if (! $failed) return 'Expected createOrganization to throw exception on invalid moderator';

            $dbRow = $db->table('organizations')->where('code', $code)->get()->getRowArray();
            if ($dbRow) return 'Organization row was NOT rolled back';

            return true;
        });

        // TEST 8: Post-Creation Moderator Assignment & History Preservation
        $runTest('8. Post-creation Moderator Reassignment & History Preservation', function () use ($service, $db, $adminId) {
            $code = 'TEST_REASSIGN_' . random_int(1000, 9999);
            $personnelList = $db->table('profiles')->where('account_type', 'personnel')->where('status', 'active')->limit(2)->get()->getResultArray();
            if (count($personnelList) < 2) return 'Need at least 2 active personnel profiles in DB';

            $mod1 = $personnelList[0]['id'];
            $mod2 = $personnelList[1]['id'];

            // Create with initial moderator
            $org = $service->createOrganization([
                'name'                 => 'Test Reassign Club',
                'code'                 => $code,
                'category'             => 'sports',
                'scope'                => 'university',
                'moderator_profile_id' => $mod1,
            ], null, $adminId);

            // Reassign to mod2
            $updated = $service->assignModerator($org['id'], $mod2, $adminId);
            if ($updated['current_moderator']['profile_id'] !== $mod2) return 'Current moderator was not updated to mod2';

            // Check DB history
            $allAssignments = $db->table('organization_moderator_assignments')
                ->where('organization_id', $org['id'])
                ->orderBy('created_at', 'ASC')
                ->get()->getResultArray();

            if (count($allAssignments) !== 2) return "Expected 2 total assignment records, got " . count($allAssignments);

            $asgn1 = array_values(array_filter($allAssignments, fn($a) => $a['personnel_profile_id'] === $mod1))[0] ?? null;
            $asgn2 = array_values(array_filter($allAssignments, fn($a) => $a['personnel_profile_id'] === $mod2))[0] ?? null;

            if (! $asgn1 || ! $asgn2) return 'Assignments for mod1 or mod2 missing';

            // First assignment (mod1) must be inactive with effective_until set
            if ((int) $asgn1['is_active'] !== 0 || empty($asgn1['effective_until'])) {
                return 'First assignment was not soft-deactivated with effective_until';
            }

            // Second assignment (mod2) must be active with null effective_until
            if ((int) $asgn2['is_active'] !== 1 || ! empty($asgn2['effective_until'])) {
                return 'Second assignment is not active';
            }

            return true;
        });

        // TEST 9: Unique Code Constraint & Conflict Handling
        $runTest('9. Uniqueness Constraint & Conflict Rejection', function () use ($service) {
            $code = 'TEST_DUP_CODE';
            $service->createOrganization([
                'name'     => 'Original Org',
                'code'     => $code,
                'category' => 'socio_cultural',
                'scope'    => 'university',
            ]);

            $failed = false;
            try {
                $service->createOrganization([
                    'name'     => 'Duplicate Org',
                    'code'     => $code,
                    'category' => 'socio_cultural',
                    'scope'    => 'university',
                ]);
            } catch (Throwable $e) {
                $failed = true;
            }

            return $failed ? true : 'Expected duplicate code rejection';
        });

        // Cleanup test data
        $db->table('organizations')->like('code', 'TEST_')->delete();

        CLI::write("\n==================================================", 'cyan');
        CLI::write("Verification Summary: {$passed} PASSED, {$failed} FAILED", $failed === 0 ? 'green' : 'red');
        CLI::write("==================================================", 'cyan');

        return $failed === 0 ? 0 : 1;
    }
}
