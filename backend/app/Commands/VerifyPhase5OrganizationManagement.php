<?php

namespace App\Commands;

use App\Services\OrganizationService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;
use Throwable;

class VerifyPhase5OrganizationManagement extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:phase5-org-management';
    protected $description = 'Verifies Plan 02 Phase 5 Organization Post-Creation Management';

    public function run(array $params)
    {
        $db = Database::connect();
        $service = new OrganizationService($db);

        CLI::write("==================================================", 'cyan');
        CLI::write("Plan 02 Phase 5: Organization Management Verification", 'white');
        CLI::write("==================================================", 'cyan');

        $passed = 0;
        $failed = 0;

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

        // Fetch fixtures
        $college = $db->table('colleges')->where('status', 'active')->get()->getRowArray();
        $programs = $db->table('academic_programs')->where('college_id', $college['id'])->where('status', 'active')->limit(3)->get()->getResultArray();
        $personnelList = $db->table('profiles')->where('account_type', 'personnel')->where('status', 'active')->limit(2)->get()->getResultArray();
        $admin = $db->table('profiles')->where('account_type', 'osad_admin')->where('status', 'active')->get()->getRowArray();

        $collegeId = $college['id'];
        $prog1 = $programs[0]['id'];
        $prog2 = $programs[1]['id'];
        $prog3 = $programs[2]['id'] ?? null;
        $mod1 = $personnelList[0]['id'];
        $mod2 = $personnelList[1]['id'];
        $adminId = $admin['id'] ?? null;

        // Cleanup any pre-existing test orgs
        $db->table('organizations')->like('code', 'TEST_MGT_')->delete();

        // TEST 1: Update Organization Master Data (Master data only)
        $runTest('1. Update Organization Master Data', function () use ($service, $db, $collegeId, $prog1) {
            $code = 'TEST_MGT_01';
            $org = $service->createOrganization([
                'name'        => 'Original Master Name',
                'code'        => $code,
                'category'    => 'academic_college',
                'scope'       => 'program',
                'college_id'  => $collegeId,
                'program_ids' => [$prog1],
            ]);

            $updated = $service->updateOrganization($org['id'], [
                'name'     => 'Updated Master Name',
                'code'     => 'TEST_MGT_01B',
                'category' => 'co_curricular',
                'scope'    => 'program',
                'status'   => 'active',
            ]);

            if ($updated['name'] !== 'Updated Master Name') return 'Name was not updated';
            if ($updated['code'] !== 'TEST_MGT_01B') return 'Code was not updated';
            if ($updated['category'] !== 'co_curricular') return 'Category was not updated';

            // Affiliations must remain untouched
            if (count($updated['program_ids']) !== 1) return 'Program affiliations were corrupted';

            return true;
        });

        // TEST 2: Add Program Scope Post-Creation (Multi-program add + deduplication)
        $runTest('2. Add Program Scope Post-Creation', function () use ($service, $db, $collegeId, $prog1, $prog2) {
            $code = 'TEST_MGT_02';
            $org = $service->createOrganization([
                'name'        => 'Scope Expansion Org',
                'code'        => $code,
                'category'    => 'academic_college',
                'scope'       => 'program',
                'college_id'  => $collegeId,
                'program_ids' => [$prog1],
            ]);

            // Add prog2
            $updated = $service->addProgramAffiliations($org['id'], [$prog2, $prog2]); // testing dedup
            if (count($updated['program_ids']) !== 2) return 'Expected 2 programs after addition';

            $dbCount = $db->table('organization_program_affiliations')->where('organization_id', $org['id'])->countAllResults();
            if ($dbCount !== 2) return "Expected 2 DB affiliation rows, got {$dbCount}";

            return true;
        });

        // TEST 3: Remove Program Scope & Scope Integrity Protection
        $runTest('3. Remove Program Scope & Last Program Protection', function () use ($service, $collegeId, $prog1, $prog2) {
            $code = 'TEST_MGT_03';
            $org = $service->createOrganization([
                'name'        => 'Scope Removal Org',
                'code'        => $code,
                'category'    => 'academic_college',
                'scope'       => 'program',
                'college_id'  => $collegeId,
                'program_ids' => [$prog1, $prog2],
            ]);

            // Remove prog2
            $updated = $service->removeProgramAffiliation($org['id'], $prog2);
            if (count($updated['program_ids']) !== 1) return 'Expected 1 program after removing prog2';
            if ($updated['program_ids'][0] !== $prog1) return 'Remaining program mismatch';

            // Attempt removing prog1 (last program for program-scoped org) -> MUST be blocked
            $failed = false;
            try {
                $service->removeProgramAffiliation($org['id'], $prog1);
            } catch (Throwable $e) {
                $failed = true;
            }

            if (! $failed) return 'Expected exception when removing the last program from a program-scoped org';

            return true;
        });

        // TEST 4: Assign, Replace, and Remove Moderator with History Preservation
        $runTest('4. Moderator Lifecycle (Assign -> Replace -> Remove) & History', function () use ($service, $db, $mod1, $mod2, $adminId) {
            $code = 'TEST_MGT_04';
            $org = $service->createOrganization([
                'name'     => 'Mod Lifecycle Org',
                'code'     => $code,
                'category' => 'student_council',
                'scope'    => 'university',
            ]);

            // 1. Assign mod1
            $step1 = $service->assignModerator($org['id'], $mod1, $adminId);
            if ($step1['current_moderator']['profile_id'] !== $mod1) return 'Mod1 assignment failed';

            // 2. Replace with mod2
            $step2 = $service->assignModerator($org['id'], $mod2, $adminId);
            if ($step2['current_moderator']['profile_id'] !== $mod2) return 'Mod2 replacement failed';

            // 3. Remove moderator
            $step3 = $service->removeModerator($org['id'], $adminId);
            if ($step3['current_moderator'] !== null) return 'Moderator removal failed (still populated)';

            // Check history: must have 2 historical records, both inactive
            $history = $db->table('organization_moderator_assignments')
                ->where('organization_id', $org['id'])
                ->get()->getResultArray();

            if (count($history) !== 2) return 'Expected 2 historical records in DB, got ' . count($history);

            foreach ($history as $h) {
                if ((int) $h['is_active'] !== 0) return 'Historical record is still marked active';
                if (empty($h['effective_until'])) return 'Historical record has null effective_until';
            }

            return true;
        });

        // Cleanup
        $db->table('organizations')->like('code', 'TEST_MGT_')->delete();

        CLI::write("\n==================================================", 'cyan');
        CLI::write("Verification Summary: {$passed} PASSED, {$failed} FAILED", $failed === 0 ? 'green' : 'red');
        CLI::write("==================================================", 'cyan');

        return $failed === 0 ? 0 : 1;
    }
}
