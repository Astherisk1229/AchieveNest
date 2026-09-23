<?php

namespace App\Commands;

use App\Services\CollegeService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;
use Throwable;

class VerifyPhaseECollegeDetails extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:phase-e-college-details';
    protected $description = 'Validates Phase E College Details API, Program Listings, and Coordinator Coverage Calculations';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'cyan');
        CLI::write("AchieveNest — Phase E College Details Verification", 'white');
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
        $runTest('CHK-004', 'Active Program Coordinator assignments exist (3 active)', $activeCoords >= 3, "Count: {$activeCoords}");

        // 2. Single College Details Fetch (CET)
        $cetId = '20000000-0000-0000-0000-000000000001';
        $cet = $collegeService->getCollege($cetId);

        $hasBasicInfo = $cet && ($cet['code'] ?? '') === 'CET' && ($cet['status'] ?? '') === 'active';
        $runTest('DTL-001', 'getCollege returns valid College record with status', $hasBasicInfo);

        // 3. Dean Leadership Information
        $hasDeanInfo = array_key_exists('dean_name', $cet) && array_key_exists('dean_profile_id', $cet);
        $runTest('DTL-002', 'getCollege includes authoritative Dean metadata fields', $hasDeanInfo);

        // 4. Programs List & Coordinator Fields
        $programs = $cet['programs'] ?? [];
        $hasPrograms = is_array($programs) && count($programs) === 4;
        $hasProgramFields = true;
        foreach ($programs as $p) {
            if (! array_key_exists('code', $p) || ! array_key_exists('name', $p) || ! array_key_exists('coordinator_name', $p) || ! array_key_exists('has_coordinator', $p)) {
                $hasProgramFields = false;
                break;
            }
        }
        $runTest('DTL-003', 'getCollege includes all 4 CET programs with coordinator data', $hasPrograms && $hasProgramFields, "Programs count: " . count($programs));

        // 5. Coordinator Coverage Summary Metrics
        $summary = $cet['summary'] ?? [];
        $totalProg = $summary['program_count'] ?? -1;
        $assignedProg = $summary['assigned_coordinators_count'] ?? -1;
        $unassignedProg = $summary['unassigned_coordinators_count'] ?? -1;

        $summaryValid = ($totalProg === 4) && ($assignedProg + $unassignedProg === 4) && ($assignedProg >= 0) && ($unassignedProg >= 0);
        $runTest('SUM-001', 'getCollege generates exact summary metrics (total = assigned + unassigned)', $summaryValid, "Total: {$totalProg}, Assigned: {$assignedProg}, Unassigned: {$unassignedProg}");

        // 6. Non-Existent College Returns Null
        $fakeCollege = $collegeService->getCollege('00000000-0000-0000-0000-000000000000');
        $runTest('ERR-001', 'getCollege returns null safely for non-existent ID', $fakeCollege === null);

        // 7. Preservation of Invariants
        $finalColleges = $db->table('colleges')->countAllResults();
        $finalPrograms = $db->table('academic_programs')->countAllResults();
        $finalDeans = $db->table('dean_assignments')->where('is_active', 1)->countAllResults();
        $finalCoords = $db->table('program_coordinator_assignments')->where('is_active', 1)->countAllResults();

        $runTest('INV-001', 'Colleges preserved (5 original active)', $finalColleges === $initialColleges);
        $runTest('INV-002', 'Programs preserved (14 original active)', $finalPrograms === $initialPrograms);
        $runTest('INV-003', 'Deans preserved (2 active assignments)', $finalDeans === $activeDeans);
        $runTest('INV-004', 'Coordinators preserved (3 active assignments)', $finalCoords === $activeCoords);

        CLI::write("========================================================================", 'cyan');
        CLI::write("Phase E Verification Summary: {$passed} Passed, {$failed} Failed", $failed === 0 ? 'green' : 'red');
        CLI::write("========================================================================", 'cyan');

        return $failed === 0 ? 0 : 1;
    }
}
