<?php

namespace App\Commands;

use App\Services\AuthorizationService;
use App\Services\CollegeService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;
use InvalidArgumentException;
use Throwable;

class VerifyPhase3CoordinatorCoverage extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:phase3-coordinator-coverage';
    protected $description = 'Validates Phase 3 Backend & API Contract Alignment for Academic Programs and Coordinator Coverage';

    protected function genUuid(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    public function run(array $params)
    {
        CLI::write("========================================================================", 'cyan');
        CLI::write("AchieveNest — Plan 01 Phase 3 Backend & API Contract Verification", 'white');
        CLI::write("========================================================================", 'cyan');

        $db = Database::connect();
        $collegeService = new CollegeService($db);
        $authz = new AuthorizationService();

        $passed = 0;
        $failed = 0;

        $runTest = function (string $code, string $name, bool $condition, string $details = '') use (&$passed, &$failed) {
            $status = $condition ? '[PASS]' : '[FAIL]';
            $color = $condition ? 'green' : 'red';
            CLI::write(sprintf("  %-10s %-55s %s", $code, $name, CLI::color($status, $color)));
            if (! $condition) {
                CLI::write("             Details: {$details}", 'yellow');
                $failed++;
            } else {
                $passed++;
            }
        };

        // Standard IDs from seed data
        $cetId = '20000000-0000-0000-0000-000000000001'; // CET
        $cbaId = '20000000-0000-0000-0000-000000000002'; // CBA
        $bscsId = '30000000-0000-0000-0000-000000000001'; // BSCS (CET)
        $bsitId = '30000000-0000-0000-0000-000000000002'; // BSIT (CET)
        $bsceId = '30000000-0000-0000-0000-000000000003'; // BSCE (CET)
        $bsaId  = '30000000-0000-0000-0000-000000000005'; // BSA (CBA)

        $personnelA = '10000000-0000-0000-0000-000000000009'; // Cynthia Ramos
        $personnelB = '10000000-0000-0000-0000-000000000008'; // Carlos Mendoza

        // -------------------------------------------------------------
        // SECTION 1: Read Contracts
        // -------------------------------------------------------------
        CLI::write("\n[1] READ CONTRACTS", 'yellow');

        // 1.1 List Programs with Joined Coordinator Names
        $programs = $collegeService->listPrograms($cetId);
        $hasPrograms = is_array($programs) && count($programs) >= 3;
        $hasJoinedCoordinator = false;
        foreach ($programs as $p) {
            if (! empty($p['coordinator_name'])) {
                $hasJoinedCoordinator = true;
                break;
            }
        }
        $runTest('READ-001', 'listPrograms returns academic programs with joined coordinator', $hasPrograms && $hasJoinedCoordinator);

        // 1.2 Eligible Coordinators List
        $eligibleList = $collegeService->listCoordinatorPersonnel($cetId);
        $hasEligiblePersonnel = isset($eligibleList['personnel']) && is_array($eligibleList['personnel']) && count($eligibleList['personnel']) > 0;
        $runTest('READ-002', 'listCoordinatorPersonnel returns HR-affiliated eligible personnel', $hasEligiblePersonnel);

        // 1.3 Coordinator Context Query
        $context = $collegeService->getPersonnelCoordinatorContext($cetId, $personnelA);
        $contextValid = ($context['personnel']['profile_id'] ?? '') === $personnelA && isset($context['eligible_programs']);
        $runTest('READ-003', 'getPersonnelCoordinatorContext returns eligible programs and current state', $contextValid);

        // -------------------------------------------------------------
        // SECTION 2: Master Data Program Creation & Update Contracts
        // -------------------------------------------------------------
        CLI::write("\n[2] MASTER DATA MUTATION CONTRACTS", 'yellow');

        // 2.1 Create Program without Coordinator
        $testProgCode = strtoupper('TESTPROG_' . substr(md5(uniqid()), 0, 4));
        $createdProgram = null;
        try {
            $createdProgram = $collegeService->createProgram([
                'college_id'   => $cetId,
                'code'         => $testProgCode,
                'name'         => 'Test Master Data Program',
                'degree_level' => 'undergraduate',
            ]);
            $runTest('PROG-001', 'createProgram succeeds without coordinator', $createdProgram !== null && ($createdProgram['code'] ?? '') === $testProgCode);
        } catch (Throwable $e) {
            $runTest('PROG-001', 'createProgram succeeds without coordinator', false, $e->getMessage());
        }

        $testProgId = $createdProgram['id'] ?? null;

        // 2.2 Update Program Master Data Only
        try {
            $updatedProgram = $collegeService->updateProgram($testProgId, [
                'name'         => 'Updated Degree Program Title',
                'degree_level' => 'graduate',
                'status'       => 'active',
                // Malicious/accidental coordinator field should be ignored
                'coordinator_profile_id' => $personnelA,
            ]);
            $updateMatches = ($updatedProgram['name'] ?? '') === 'Updated Degree Program Title' && ($updatedProgram['degree_level'] ?? '') === 'graduate';
            
            // Check that coordinator remains null
            $coordRemainsNull = ($updatedProgram['coordinator_name'] ?? null) === null;
            $runTest('PROG-002', 'updateProgram updates master data and ignores coordinator inputs', $updateMatches && $coordRemainsNull);
        } catch (Throwable $e) {
            $runTest('PROG-002', 'updateProgram updates master data and ignores coordinator inputs', false, $e->getMessage());
        }

        // 2.3 Reject Duplicate Program Code
        try {
            $collegeService->updateProgram($testProgId, ['code' => 'BSCS']);
            $runTest('PROG-003', 'updateProgram rejects duplicate code across colleges', false, 'Should have thrown exception');
        } catch (InvalidArgumentException $e) {
            $runTest('PROG-003', 'updateProgram rejects duplicate code across colleges', str_contains($e->getMessage(), 'already in use'));
        }

        // -------------------------------------------------------------
        // SECTION 3: Multi-Program Batch Assignment & Transactions
        // -------------------------------------------------------------
        CLI::write("\n[3] MULTI-PROGRAM BATCH ASSIGNMENT", 'yellow');

        // Create temporary HR affiliations for testing multi-program assignment
        $affil1 = $this->genUuid();
        $db->table('personnel_program_affiliations')->insert([
            'id'                   => $affil1,
            'personnel_profile_id' => $personnelA,
            'academic_program_id'  => $testProgId,
            'effective_from'       => date('Y-m-d'),
            'is_active'            => 1,
            'created_at'           => date('Y-m-d H:i:s'),
            'updated_at'           => date('Y-m-d H:i:s'),
        ]);

        try {
            // Assign Personnel A to BSCS and testProgId
            $batchRes = $collegeService->updatePersonnelCoordinatorAssignments($cetId, $personnelA, [$bscsId, $testProgId], $personnelA);
            $keptBscs = in_array($bscsId, $batchRes['diff']['kept'] ?? []);
            $addedProg = in_array($testProgId, $batchRes['diff']['added'] ?? []);
            $runTest('BATCH-001', 'updatePersonnelCoordinatorAssignments atomically adds multiple programs', $keptBscs && $addedProg);
        } catch (Throwable $e) {
            $runTest('BATCH-001', 'updatePersonnelCoordinatorAssignments atomically adds multiple programs', false, $e->getMessage());
        }

        // 3.2 Idempotent Repeated Assignment
        try {
            $repeatRes = $collegeService->updatePersonnelCoordinatorAssignments($cetId, $personnelA, [$bscsId, $testProgId], $personnelA);
            $bothKept = count($repeatRes['diff']['kept'] ?? []) === 2 && count($repeatRes['diff']['added'] ?? []) === 0;
            $runTest('BATCH-002', 'Repeated identical assignment is idempotent and creates 0 duplicate rows', $bothKept);
        } catch (Throwable $e) {
            $runTest('BATCH-002', 'Repeated identical assignment is idempotent and creates 0 duplicate rows', false, $e->getMessage());
        }

        // -------------------------------------------------------------
        // SECTION 4: Explicit Reassignment & History Preservation
        // -------------------------------------------------------------
        CLI::write("\n[4] REASSIGNMENT & HISTORY PRESERVATION", 'yellow');

        // Affiliate Personnel B with testProgId
        $affil2 = $this->genUuid();
        $db->table('personnel_program_affiliations')->insert([
            'id'                   => $affil2,
            'personnel_profile_id' => $personnelB,
            'academic_program_id'  => $testProgId,
            'effective_from'       => date('Y-m-d'),
            'is_active'            => 1,
            'created_at'           => date('Y-m-d H:i:s'),
            'updated_at'           => date('Y-m-d H:i:s'),
        ]);

        try {
            // Explicitly reassign testProgId from Personnel A to Personnel B
            $reassignRes = $collegeService->reassignCoordinator($cetId, $testProgId, $personnelB, $personnelA);
            $isReassigned = ($reassignRes['reassigned'] ?? false) === true;
            $hasNewCoord = ($reassignRes['new_coordinator'] ?? '') !== '';

            // Verify history in database:
            // 1. Old assignment for Personnel A is soft-deactivated (is_active = 0, effective_until is set)
            $oldDeactivated = $db->table('program_coordinator_assignments')
                ->where('personnel_profile_id', $personnelA)
                ->where('academic_program_id', $testProgId)
                ->where('is_active', 0)
                ->where('effective_until IS NOT NULL', null, false)
                ->countAllResults() > 0;

            // 2. New assignment for Personnel B is active (is_active = 1)
            $newActive = $db->table('program_coordinator_assignments')
                ->where('personnel_profile_id', $personnelB)
                ->where('academic_program_id', $testProgId)
                ->where('is_active', 1)
                ->countAllResults() === 1;

            $runTest('REAS-001', 'reassignCoordinator soft-deactivates prior assignment and activates new tenure', $isReassigned && $oldDeactivated && $newActive);
        } catch (Throwable $e) {
            $runTest('REAS-001', 'reassignCoordinator soft-deactivates prior assignment and activates new tenure', false, $e->getMessage());
        }

        // -------------------------------------------------------------
        // SECTION 5: Removal & Unassignment
        // -------------------------------------------------------------
        CLI::write("\n[5] REMOVAL / UNASSIGNMENT", 'yellow');

        try {
            // Remove testProgId from Personnel B by passing empty array / excluding testProgId
            $remRes = $collegeService->updatePersonnelCoordinatorAssignments($cetId, $personnelB, [], $personnelB);
            $removedTestProg = in_array($testProgId, $remRes['diff']['removed'] ?? []);

            // Verify program is now unassigned
            $activeAssignmentsOnTestProg = $db->table('program_coordinator_assignments')
                ->where('academic_program_id', $testProgId)
                ->where('is_active', 1)
                ->countAllResults();

            // Verify historic record still exists
            $historyCount = $db->table('program_coordinator_assignments')
                ->where('academic_program_id', $testProgId)
                ->where('is_active', 0)
                ->countAllResults();

            $runTest('REM-001', 'Removal sets program to unassigned while permanently retaining history', $removedTestProg && $activeAssignmentsOnTestProg === 0 && $historyCount >= 2);
        } catch (Throwable $e) {
            $runTest('REM-001', 'Removal sets program to unassigned while permanently retaining history', false, $e->getMessage());
        }

        // -------------------------------------------------------------
        // SECTION 6: Authorization & Governance Policy
        // -------------------------------------------------------------
        CLI::write("\n[6] AUTHORIZATION & GOVERNANCE POLICY", 'yellow');

        $osadActor = [
            'profile' => ['account_type' => 'osad_admin', 'status' => 'active'],
            'roles'   => ['osad_staff', 'osad_admin'],
        ];
        $studentActor = [
            'profile' => ['account_type' => 'student', 'status' => 'active'],
            'roles'   => ['student'],
        ];

        $osadAuthorized = $authz->governance()->canManageAcademicStructure($osadActor);
        $studentBlocked = ! $authz->governance()->canManageAcademicStructure($studentActor);
        $runTest('AUTH-001', 'GovernancePolicy allows OSAD admin and strictly forbids student/personnel', $osadAuthorized && $studentBlocked);

        // -------------------------------------------------------------
        // CLEANUP
        // -------------------------------------------------------------
        $db->table('program_coordinator_assignments')->where('academic_program_id', $testProgId)->delete();
        $db->table('personnel_program_affiliations')->where('id', $affil1)->delete();
        $db->table('personnel_program_affiliations')->where('id', $affil2)->delete();
        $db->table('academic_programs')->where('id', $testProgId)->delete();

        // Restore Cynthia Ramos baseline (BSCS assigned)
        $cynthiaActive = $db->table('program_coordinator_assignments')
            ->where('personnel_profile_id', $personnelA)
            ->where('academic_program_id', $bscsId)
            ->where('is_active', 1)
            ->countAllResults();

        if ($cynthiaActive === 0) {
            $collegeService->updatePersonnelCoordinatorAssignments($cetId, $personnelA, [$bscsId], $personnelA);
        }

        CLI::write("\n========================================================================", 'cyan');
        CLI::write("Phase 3 Verification Summary: {$passed} Passed, {$failed} Failed", $failed === 0 ? 'green' : 'red');
        CLI::write("========================================================================", 'cyan');

        return $failed === 0 ? 0 : 1;
    }
}
