<?php

namespace App\Commands;

use App\Services\CollegeService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;
use InvalidArgumentException;
use Throwable;

class VerifyPhaseDAcademicProgramFlow extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:phase-d-academic-program-flow';
    protected $description = 'Validates Phase D Standalone Academic Program Flow, College Scoping, and Default Degree Level';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'cyan');
        CLI::write("AchieveNest — Phase D Academic Program Flow Verification", 'white');
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

        // 1. Baseline Schema & Data Invariant
        $initialColleges = $db->table('colleges')->countAllResults();
        $initialPrograms = $db->table('academic_programs')->countAllResults();
        $nonUndergrad = $db->table('academic_programs')->where('degree_level !=', 'undergraduate')->countAllResults();

        $runTest('CHK-001', 'Baseline contains 5 active colleges', $initialColleges >= 5, "Count: {$initialColleges}");
        $runTest('CHK-002', 'Baseline contains 14 active programs', $initialPrograms >= 14, "Count: {$initialPrograms}");
        $runTest('CHK-003', 'All baseline programs are degree_level = undergraduate', $nonUndergrad === 0, "Non-undergrad: {$nonUndergrad}");

        // 2. Missing College ID Validation
        try {
            $collegeService->createProgram([
                'code' => 'TEST_P',
                'name' => 'Test Program Without College'
            ]);
            $runTest('VAL-001', 'Rejects creation when college_id is omitted', false, 'Should have thrown InvalidArgumentException');
        } catch (InvalidArgumentException $e) {
            $runTest('VAL-001', 'Rejects creation when college_id is omitted', str_contains($e->getMessage(), 'College ID is required'));
        }

        // 3. Non-Existent College ID Validation
        try {
            $collegeService->createProgram([
                'college_id' => '00000000-0000-0000-0000-000000000000',
                'code'       => 'TEST_P2',
                'name'       => 'Test Program With Fake College'
            ]);
            $runTest('VAL-002', 'Rejects creation when college_id does not exist', false, 'Should have thrown InvalidArgumentException');
        } catch (InvalidArgumentException $e) {
            $runTest('VAL-002', 'Rejects creation when college_id does not exist', str_contains($e->getMessage(), 'Selected College not found'));
        }

        // 4. Duplicate Program Code Validation
        try {
            $collegeService->createProgram([
                'college_id' => '20000000-0000-0000-0000-000000000001', // CET
                'code'       => 'BSCS',
                'name'       => 'Duplicate Computer Science'
            ]);
            $runTest('VAL-003', 'Rejects duplicate program code (BSCS)', false, 'Should have thrown duplicate code error');
        } catch (InvalidArgumentException $e) {
            $runTest('VAL-003', 'Rejects duplicate program code (BSCS)', str_contains($e->getMessage(), 'already exists'));
        }

        // 5. Standalone Creation under College with Default Degree Level
        $cetId = '20000000-0000-0000-0000-000000000001';
        $testCode = strtoupper('T_' . substr(md5((string) microtime(true)), 0, 4));
        $createdProgramId = null;

        try {
            $res = $collegeService->createProgram([
                'college_id' => $cetId,
                'code'       => $testCode,
                'name'       => 'Bachelor of Science in Robotics Engineering'
            ]);

            $createdProgramId = $res['id'] ?? null;
            $hasId = ! empty($createdProgramId);
            $hasCorrectCollege = ($res['college_id'] ?? '') === $cetId;
            $hasCorrectCode = ($res['code'] ?? '') === $testCode;
            $defaultsUndergrad = ($res['degree_level'] ?? '') === 'undergraduate';
            $isActive = ($res['status'] ?? '') === 'active';

            // Verify in DB directly
            $rowInDb = $db->table('academic_programs')->where('id', $createdProgramId)->get()->getRowArray();
            $dbConfirmedUndergrad = ($rowInDb['degree_level'] ?? '') === 'undergraduate';

            $runTest('CRT-001', 'Creates Program and defaults degree_level = undergraduate', $hasId && $hasCorrectCollege && $hasCorrectCode && $defaultsUndergrad && $isActive && $dbConfirmedUndergrad);
        } catch (Throwable $e) {
            $runTest('CRT-001', 'Creates Program and defaults degree_level = undergraduate', false, $e->getMessage());
        }

        // 6. Verify Scoped List and College Relationship
        if ($createdProgramId) {
            $cetPrograms = $collegeService->listPrograms($cetId);
            $foundInScopedList = false;
            foreach ($cetPrograms as $p) {
                if (($p['id'] ?? '') === $createdProgramId) {
                    $foundInScopedList = true;
                    break;
                }
            }

            $collegeDetails = $collegeService->getCollege($cetId);
            $foundInCollegeDetails = false;
            foreach ($collegeDetails['programs'] ?? [] as $cp) {
                if (($cp['id'] ?? '') === $createdProgramId) {
                    $foundInCollegeDetails = true;
                    break;
                }
            }

            $runTest('REL-001', 'Program appears in scoped College program list & details', $foundInScopedList && $foundInCollegeDetails);

            // Cleanup test program
            $db->table('academic_programs')->where('id', $createdProgramId)->delete();
        }

        // 7. Verify Post-Test Invariants
        $finalColleges = $db->table('colleges')->countAllResults();
        $finalPrograms = $db->table('academic_programs')->countAllResults();

        $runTest('INV-001', 'Baseline Colleges preserved (5 original active)', $finalColleges === $initialColleges, "Initial: {$initialColleges}, Final: {$finalColleges}");
        $runTest('INV-002', 'Baseline Programs preserved (14 original active)', $finalPrograms === $initialPrograms, "Initial: {$initialPrograms}, Final: {$finalPrograms}");

        CLI::write("========================================================================", 'cyan');
        CLI::write("Phase D Verification Summary: {$passed} Passed, {$failed} Failed", $failed === 0 ? 'green' : 'red');
        CLI::write("========================================================================", 'cyan');

        return $failed === 0 ? 0 : 1;
    }
}
