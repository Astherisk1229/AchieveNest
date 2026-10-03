<?php

namespace App\Commands;

use App\Services\CollegeService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;
use InvalidArgumentException;
use Throwable;

class VerifyPhaseCCollegeIdentity extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:phase-c-college-identity';
    protected $description = 'Validates Phase C College Identity, Branding, and Transactional Creation';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'cyan');
        CLI::write("AchieveNest — Phase C College Identity & Creation Verification", 'white');
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

        // 1. Initial State Check
        $initialColleges = $db->table('colleges')->countAllResults();
        $initialPrograms = $db->table('academic_programs')->countAllResults();

        $runTest('CHK-001', 'Baseline contains 5 active colleges', $initialColleges >= 5, "Count: {$initialColleges}");
        $runTest('CHK-002', 'Baseline contains 14 active programs', $initialPrograms >= 14, "Count: {$initialPrograms}");

        // 2. Badge Color Validation
        try {
            $collegeService->createCollege([
                'name'                => 'Invalid Color College',
                'code'                => 'ICC',
                'acronym_badge_color' => 'invalid-color'
            ]);
            $runTest('VAL-001', 'Rejects invalid hex badge color', false, 'Should have thrown InvalidArgumentException');
        } catch (InvalidArgumentException $e) {
            $runTest('VAL-001', 'Rejects invalid hex badge color', str_contains($e->getMessage(), 'valid 6-digit hex'));
        }

        // 3. Duplicate College Code Validation
        try {
            $collegeService->createCollege([
                'name'                => 'Duplicate CET College',
                'code'                => 'CET',
                'acronym_badge_color' => '#16834A'
            ]);
            $runTest('VAL-002', 'Rejects duplicate college code (CET)', false, 'Should have thrown duplicate code error');
        } catch (InvalidArgumentException $e) {
            $runTest('VAL-002', 'Rejects duplicate college code (CET)', str_contains($e->getMessage(), 'already exists'));
        }

        // 4. Transactional College + Nested Programs Success
        $testCode = strtoupper('TST_' . substr(md5((string) microtime(true)), 0, 5));
        $progCode1 = strtoupper('P1_' . substr(md5((string) microtime(true)), 0, 4));
        $progCode2 = strtoupper('P2_' . substr(md5((string) microtime(true)), 0, 4));

        $createdCollegeId = null;
        try {
            $res = $collegeService->createCollege([
                'name'                => 'Test Academic College',
                'code'                => $testCode,
                'description'         => 'Test Division Description',
                'acronym_badge_color' => '#1B4D3E',
                'programs'            => [
                    ['code' => $progCode1, 'name' => 'Program Alpha Test'],
                    ['code' => $progCode2, 'name' => 'Program Beta Test']
                ]
            ]);

            $createdCollegeId = $res['college']['id'] ?? null;
            $hasCollege = $createdCollegeId && ($res['college']['code'] ?? '') === $testCode;
            $hasPrograms = count($res['programs'] ?? []) === 2;
            $colorNormalized = ($res['college']['acronym_badge_color'] ?? '') === '#1B4D3E';
            $details = sprintf("HasCollege: %s, CollegeCode: %s, ProgramsCount: %d, BadgeColor: %s", $hasCollege ? 'yes' : 'no', $res['college']['code'] ?? 'null', count($res['programs'] ?? []), $res['college']['acronym_badge_color'] ?? 'null');

            $runTest('TX-001', 'Transactional creation of College + nested Programs', $hasCollege && $hasPrograms && $colorNormalized, $details);
        } catch (Throwable $e) {
            $runTest('TX-001', 'Transactional creation of College + nested Programs', false, $e->getMessage());
        }

        // 5. Nested Programs Batch Duplicate Rollback Check
        $rollbackCode = 'RLB_' . substr(md5((string) microtime(true)), 0, 5);
        $dupProgCode = 'DUP_' . substr(md5((string) microtime(true)), 0, 4);

        try {
            $collegeService->createCollege([
                'name'                => 'Rollback Test College',
                'code'                => $rollbackCode,
                'acronym_badge_color' => '#2563EB',
                'programs'            => [
                    ['code' => $dupProgCode, 'name' => 'First Unique Program'],
                    ['code' => $dupProgCode, 'name' => 'Duplicate Program In Batch']
                ]
            ]);
            $runTest('TX-002', 'Batch duplicate program code rolls back College', false, 'Should have rolled back');
        } catch (InvalidArgumentException $e) {
            $rolledBackCollege = $db->table('colleges')->where('code', $rollbackCode)->countAllResults();
            $rolledBackProgram = $db->table('academic_programs')->where('code', $dupProgCode)->countAllResults();

            $isClean = ($rolledBackCollege === 0 && $rolledBackProgram === 0);
            $runTest('TX-002', 'Batch duplicate program code rolls back College', $isClean && str_contains($e->getMessage(), 'Duplicate program code'), "Colleges: {$rolledBackCollege}, Programs: {$rolledBackProgram}");
        }

        // 6. Conflict with Existing System Program Code Rollback Check
        $conflictCode = 'CNF_' . substr(md5((string) microtime(true)), 0, 5);
        try {
            $collegeService->createCollege([
                'name'                => 'Conflict Test College',
                'code'                => $conflictCode,
                'programs'            => [
                    ['code' => 'BSCS', 'name' => 'Conflicting with Existing BSCS']
                ]
            ]);
            $runTest('TX-003', 'Conflict with existing system program rolls back', false, 'Should have rolled back');
        } catch (InvalidArgumentException $e) {
            $conflictCollege = $db->table('colleges')->where('code', $conflictCode)->countAllResults();
            $isClean = ($conflictCollege === 0);
            $runTest('TX-003', 'Conflict with existing system program rolls back', $isClean && str_contains($e->getMessage(), 'already exists'), "Colleges: {$conflictCollege}");
        }

        // Cleanup test college
        if ($createdCollegeId) {
            $db->table('academic_programs')->where('college_id', $createdCollegeId)->delete();
            $db->table('colleges')->where('id', $createdCollegeId)->delete();
        }

        // 7. Verify Post-Test Baseline Invariants
        $finalColleges = $db->table('colleges')->countAllResults();
        $finalPrograms = $db->table('academic_programs')->countAllResults();

        $runTest('INV-001', 'Baseline Colleges preserved (5 original active)', $finalColleges === $initialColleges, "Initial: {$initialColleges}, Final: {$finalColleges}");
        $runTest('INV-002', 'Baseline Programs preserved (14 original active)', $finalPrograms === $initialPrograms, "Initial: {$initialPrograms}, Final: {$finalPrograms}");

        CLI::write("========================================================================", 'cyan');
        CLI::write("Phase C Verification Summary: {$passed} Passed, {$failed} Failed", $failed === 0 ? 'green' : 'red');
        CLI::write("========================================================================", 'cyan');

        return $failed === 0 ? 0 : 1;
    }
}
