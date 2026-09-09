<?php

namespace App\Commands;

use App\Services\CollegeService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;
use InvalidArgumentException;
use Throwable;

class VerifyPhaseFCoordinatorAssignment extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:phase-f-coordinator-assignment';
    protected $description = 'Validates Phase F Personnel-First Multi-Program Coordinator Assignment, Diff Updates, and HR Governance Boundaries';

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
        CLI::write("AchieveNest — Phase F Program Coordinator Assignment Verification", 'white');
        CLI::write("========================================================================", 'cyan');

        $db = Database::connect();
        $collegeService = new CollegeService($db);

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

        // 1. Baseline Verification
        $initialColleges = $db->table('colleges')->countAllResults();
        $initialPrograms = $db->table('academic_programs')->countAllResults();
        $activeDeans = $db->table('dean_assignments')->where('is_active', 1)->countAllResults();
        $activeCoords = $db->table('program_coordinator_assignments')->where('is_active', 1)->countAllResults();

        $runTest('CHK-001', 'Baseline contains 5 active colleges', $initialColleges >= 5, "Count: {$initialColleges}");
        $runTest('CHK-002', 'Baseline contains 14 active programs', $initialPrograms >= 14, "Count: {$initialPrograms}");
        $runTest('CHK-003', 'Active Dean assignments exist (2 active)', $activeDeans >= 2, "Count: {$activeDeans}");
        $runTest('CHK-004', 'Active Coordinator assignments exist (3 active)', $activeCoords >= 3, "Count: {$activeCoords}");

        $cetId = '20000000-0000-0000-0000-000000000001'; // CET
        $cbaId = '20000000-0000-0000-0000-000000000002'; // CBA
        $bscsId = '30000000-0000-0000-0000-000000000001'; // BSCS (under CET)
        $bsitId = '30000000-0000-0000-0000-000000000002'; // BSIT (under CET)
        $bsaId  = '30000000-0000-0000-0000-000000000005'; // BSA (under CBA)

        // Personnel A is Cynthia Ramos (already coordinator for BSCS)
        $personnelA = '10000000-0000-0000-0000-000000000009'; 
        // Personnel B is Carlos Mendoza
        $personnelB = '10000000-0000-0000-0000-000000000008';

        // 2. Eligible Personnel Query
        $eligibleData = $collegeService->listCoordinatorPersonnel($cetId);
        $hasCollegeInfo = ($eligibleData['college']['id'] ?? '') === $cetId;
        $personnelList = $eligibleData['personnel'] ?? [];
        $runTest('ELIG-001', 'listCoordinatorPersonnel returns college and affiliated personnel list', $hasCollegeInfo && is_array($personnelList) && count($personnelList) > 0);

        // 3. Personnel Context Query
        $context = $collegeService->getPersonnelCoordinatorContext($cetId, $personnelA);
        $contextValid = ($context['personnel']['profile_id'] ?? '') === $personnelA && isset($context['eligible_programs']) && is_array($context['eligible_programs']);
        $runTest('CTX-001', 'getPersonnelCoordinatorContext returns eligible programs with assignment state', $contextValid);

        // Setup a multi-program affiliation for testing: Affiliate personnelA with both BSCS and BSIT
        $testAffiliationId = $this->genUuid();
        $db->table('personnel_program_affiliations')->insert([
            'id'                   => $testAffiliationId,
            'personnel_profile_id' => $personnelA,
            'academic_program_id'  => $bsitId,
            'effective_from'       => date('Y-m-d'),
            'is_active'            => 1,
            'created_at'           => date('Y-m-d H:i:s'),
            'updated_at'           => date('Y-m-d H:i:s'),
        ]);

        // 4. Multi-Program Assignment Save (One Personnel -> Multiple Programs: BSCS + BSIT)
        try {
            $saveRes = $collegeService->updatePersonnelCoordinatorAssignments($cetId, $personnelA, [$bscsId, $bsitId], $personnelA);
            $hasUpdatedContext = ($saveRes['context']['selected_count'] ?? 0) === 2;
            $hasDiff = isset($saveRes['diff']['added']) || isset($saveRes['diff']['kept']);

            // Verify in database: personnelA now has 2 active assignments
            $activeCountInDb = $db->table('program_coordinator_assignments')
                ->where('personnel_profile_id', $personnelA)
                ->where('is_active', 1)
                ->countAllResults();

            $runTest('DIFF-001', 'Atomically assigns one personnel to multiple programs (BSCS + BSIT)', $hasUpdatedContext && $hasDiff && $activeCountInDb >= 2);
        } catch (Throwable $e) {
            $runTest('DIFF-001', 'Atomically assigns one personnel to multiple programs (BSCS + BSIT)', false, $e->getMessage());
        }

        // 5. Diff-Based Deassignment (Reduce from BSCS + BSIT -> only BSCS)
        try {
            $diffRes = $collegeService->updatePersonnelCoordinatorAssignments($cetId, $personnelA, [$bscsId], $personnelA);
            $keptBscs = in_array($bscsId, $diffRes['diff']['kept'] ?? []);
            $removedBsit = in_array($bsitId, $diffRes['diff']['removed'] ?? []);

            // Check that BSIT is soft-deactivated (is_active = 0)
            $bsitDeactivated = $db->table('program_coordinator_assignments')
                ->where('personnel_profile_id', $personnelA)
                ->where('academic_program_id', $bsitId)
                ->where('is_active', 0)
                ->countAllResults() > 0;

            $runTest('DIFF-002', 'Diff update preserves kept program and soft-deactivates removed program', $keptBscs && $removedBsit && $bsitDeactivated);
        } catch (Throwable $e) {
            $runTest('DIFF-002', 'Diff update preserves kept program and soft-deactivates removed program', false, $e->getMessage());
        }

        // 6. Governance Rule: Rejects Program with NO HR Affiliation
        try {
            // BSA belongs to CBA and personnelA has no affiliation with BSA
            $collegeService->updatePersonnelCoordinatorAssignments($cetId, $personnelA, [$bsaId], $personnelA);
            $runTest('GOV-001', 'Rejects assignment when program belongs to different college', false, 'Should have thrown exception');
        } catch (InvalidArgumentException $e) {
            $runTest('GOV-001', 'Rejects assignment when program belongs to different college', str_contains($e->getMessage(), 'does not belong to the selected College'));
        }

        // 7. Governance Rule: Rejects Program within College if personnel has no HR affiliation
        $bsceId = '30000000-0000-0000-0000-000000000003'; // BSCE (under CET, no affiliation for personnelA)
        try {
            $collegeService->updatePersonnelCoordinatorAssignments($cetId, $personnelA, [$bsceId], $personnelA);
            $runTest('GOV-002', 'Rejects assignment when personnel has no HR affiliation with program', false, 'Should have thrown exception');
        } catch (InvalidArgumentException $e) {
            $runTest('GOV-002', 'Rejects assignment when personnel has no HR affiliation with program', str_contains($e->getMessage(), 'no active HR affiliation'));
        }

        // 8. Conflict Rule: Rejects assignment if program already has another active coordinator
        // Affiliate personnelB to BSCS and try to assign personnelB to BSCS (while personnelA is active coordinator)
        $testAffiliationBId = $this->genUuid();
        $db->table('personnel_program_affiliations')->insert([
            'id'                   => $testAffiliationBId,
            'personnel_profile_id' => $personnelB,
            'academic_program_id'  => $bscsId,
            'effective_from'       => date('Y-m-d'),
            'is_active'            => 1,
            'created_at'           => date('Y-m-d H:i:s'),
            'updated_at'           => date('Y-m-d H:i:s'),
        ]);

        try {
            // Attempt to assign personnelB to BSCS while personnelA is active coordinator
            $collegeService->updatePersonnelCoordinatorAssignments($cetId, $personnelB, [$bscsId], $personnelB);
            $runTest('CONF-001', 'Rejects assignment when program already has active coordinator', false, 'Should have thrown conflict error');
        } catch (InvalidArgumentException $e) {
            $runTest('CONF-001', 'Rejects assignment when program already has active coordinator', str_contains($e->getMessage(), 'already has an active Program Coordinator'));
        }

        // Cleanup test fixtures
        $db->table('personnel_program_affiliations')->where('id', $testAffiliationId)->delete();
        $db->table('personnel_program_affiliations')->where('id', $testAffiliationBId)->delete();
        $db->table('program_coordinator_assignments')->where('personnel_profile_id', $personnelA)->where('academic_program_id', $bsitId)->delete();

        // 9. Final Invariants
        $finalColleges = $db->table('colleges')->countAllResults();
        $finalPrograms = $db->table('academic_programs')->countAllResults();
        $finalDeans = $db->table('dean_assignments')->where('is_active', 1)->countAllResults();
        $finalCoords = $db->table('program_coordinator_assignments')->where('is_active', 1)->countAllResults();

        $runTest('INV-001', 'Colleges preserved (5 original active)', $finalColleges === $initialColleges);
        $runTest('INV-002', 'Programs preserved (14 original active)', $finalPrograms === $initialPrograms);
        $runTest('INV-003', 'Deans preserved (2 active assignments)', $finalDeans === $activeDeans);
        $runTest('INV-004', 'Coordinators preserved (3 active assignments)', $finalCoords === $activeCoords);

        CLI::write("========================================================================", 'cyan');
        CLI::write("Phase F Verification Summary: {$passed} Passed, {$failed} Failed", $failed === 0 ? 'green' : 'red');
        CLI::write("========================================================================", 'cyan');

        return $failed === 0 ? 0 : 1;
    }
}
