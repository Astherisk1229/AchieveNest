<?php

namespace App\Commands;

use App\Services\AuthorizationService;
use App\Services\CollegeService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;
use InvalidArgumentException;
use Throwable;

class VerifyPhase5IntegrityHistory extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:phase5-integrity-history';
    protected $description = 'Performs comprehensive Phase 5 Data Integrity and Historical Audit Verification';

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
        CLI::write("AchieveNest — Plan 01 Phase 5 Data Integrity & Historical Verification", 'white');
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

        // -------------------------------------------------------------
        // SECTION 1: Foreign-Key & Orphan Integrity Checks
        // -------------------------------------------------------------
        CLI::write("\n[1] FOREIGN KEY & ORPHAN INTEGRITY", 'yellow');

        // 1.1 Check academic_programs -> colleges FK
        $orphanedPrograms = $db->query("
            SELECT ap.id, ap.code
            FROM academic_programs ap
            LEFT JOIN colleges c ON c.id = ap.college_id
            WHERE c.id IS NULL
        ")->getResultArray();
        $runTest('FK-001', 'Academic Programs foreign key integrity (0 orphans)', count($orphanedPrograms) === 0, 'Found: ' . count($orphanedPrograms));

        // 1.2 Check program_coordinator_assignments -> academic_programs FK
        $orphanedProgAssignments = $db->query("
            SELECT pca.id
            FROM program_coordinator_assignments pca
            LEFT JOIN academic_programs ap ON ap.id = pca.academic_program_id
            WHERE ap.id IS NULL
        ")->getResultArray();
        $runTest('FK-002', 'Coordinator assignments -> program FK integrity (0 orphans)', count($orphanedProgAssignments) === 0, 'Found: ' . count($orphanedProgAssignments));

        // 1.3 Check program_coordinator_assignments -> profiles FK
        $orphanedPersonnelAssignments = $db->query("
            SELECT pca.id
            FROM program_coordinator_assignments pca
            LEFT JOIN profiles p ON p.id = pca.personnel_profile_id
            WHERE p.id IS NULL
        ")->getResultArray();
        $runTest('FK-003', 'Coordinator assignments -> personnel profile FK integrity (0 orphans)', count($orphanedPersonnelAssignments) === 0, 'Found: ' . count($orphanedPersonnelAssignments));

        // 1.4 Check personnel_program_affiliations -> profiles/programs FK
        $orphanedAffiliations = $db->query("
            SELECT ppa.id
            FROM personnel_program_affiliations ppa
            LEFT JOIN profiles p ON p.id = ppa.personnel_profile_id
            LEFT JOIN academic_programs ap ON ap.id = ppa.academic_program_id
            WHERE p.id IS NULL OR ap.id IS NULL
        ")->getResultArray();
        $runTest('FK-004', 'HR program affiliations FK integrity (0 orphans)', count($orphanedAffiliations) === 0, 'Found: ' . count($orphanedAffiliations));

        // -------------------------------------------------------------
        // SECTION 2: Active Uniqueness & Cardinality
        // -------------------------------------------------------------
        CLI::write("\n[2] ACTIVE ASSIGNMENT UNIQUENESS & CARDINALITY", 'yellow');

        // 2.1 Max 1 Active Coordinator per Academic Program
        $duplicateActiveCoordinators = $db->query("
            SELECT academic_program_id, COUNT(*) AS active_count
            FROM program_coordinator_assignments
            WHERE is_active = 1
            GROUP BY academic_program_id
            HAVING COUNT(*) > 1
        ")->getResultArray();
        $runTest('CARD-001', 'At most one active coordinator per program (0 duplicate programs)', count($duplicateActiveCoordinators) === 0, 'Duplicates found: ' . count($duplicateActiveCoordinators));

        // 2.2 No Duplicate Active (Personnel, Program) Pairs
        $duplicateActivePairs = $db->query("
            SELECT personnel_profile_id, academic_program_id, COUNT(*) AS active_count
            FROM program_coordinator_assignments
            WHERE is_active = 1
            GROUP BY personnel_profile_id, academic_program_id
            HAVING COUNT(*) > 1
        ")->getResultArray();
        $runTest('CARD-002', 'Zero duplicate active (personnel, program) assignment rows', count($duplicateActivePairs) === 0, 'Duplicates: ' . count($duplicateActivePairs));

        // 2.3 Verify Virtual Guard Constraint
        $uqConstraint = $db->query("
            SELECT CONSTRAINT_NAME 
            FROM information_schema.TABLE_CONSTRAINTS 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'program_coordinator_assignments' 
              AND CONSTRAINT_NAME = 'uq_active_program_coordinator'
        ")->getRowArray();
        $runTest('CARD-003', 'Database unique constraint uq_active_program_coordinator exists', $uqConstraint !== null);

        // -------------------------------------------------------------
        // SECTION 3: Transactional History, Reassignment & Removal
        // -------------------------------------------------------------
        CLI::write("\n[3] TRANSACTIONAL HISTORY, REASSIGNMENT & REMOVAL", 'yellow');

        $cetId = '20000000-0000-0000-0000-000000000001'; // CET
        $personnelA = '10000000-0000-0000-0000-000000000009'; // Cynthia Ramos
        $personnelB = '10000000-0000-0000-0000-000000000008'; // Carlos Mendoza

        // Create a controlled test program
        $testCode = strtoupper('INTG_' . substr(md5(uniqid()), 0, 4));
        $testProg = $collegeService->createProgram([
            'college_id'   => $cetId,
            'code'         => $testCode,
            'name'         => 'Data Integrity Verification Program',
            'degree_level' => 'undergraduate',
        ]);
        $testProgId = $testProg['id'];

        // Verify program starts Unassigned
        $initialCoverage = $db->table('program_coordinator_assignments')
            ->where('academic_program_id', $testProgId)
            ->countAllResults();
        $runTest('HIST-001', 'Program creation starts 100% unassigned (0 assignment rows)', $initialCoverage === 0);

        // Setup HR affiliations for A and B
        $affA = $this->genUuid();
        $affB = $this->genUuid();
        $db->table('personnel_program_affiliations')->insertBatch([
            [
                'id'                   => $affA,
                'personnel_profile_id' => $personnelA,
                'academic_program_id'  => $testProgId,
                'effective_from'       => date('Y-m-d'),
                'is_active'            => 1,
                'created_at'           => date('Y-m-d H:i:s'),
                'updated_at'           => date('Y-m-d H:i:s'),
            ],
            [
                'id'                   => $affB,
                'personnel_profile_id' => $personnelB,
                'academic_program_id'  => $testProgId,
                'effective_from'       => date('Y-m-d'),
                'is_active'            => 1,
                'created_at'           => date('Y-m-d H:i:s'),
                'updated_at'           => date('Y-m-d H:i:s'),
            ]
        ]);

        // Step 1: Assign to Coordinator A
        $assign1 = $collegeService->reassignCoordinator($cetId, $testProgId, $personnelA, $personnelA);
        $active1 = $db->table('program_coordinator_assignments')
            ->where('academic_program_id', $testProgId)
            ->where('personnel_profile_id', $personnelA)
            ->where('is_active', 1)
            ->get()->getRowArray();
        $runTest('HIST-002', 'Initial assignment creates active row with effective_from', $active1 !== null && ! empty($active1['effective_from']));

        // Step 2: Reassign from Coordinator A to Coordinator B
        $assign2 = $collegeService->reassignCoordinator($cetId, $testProgId, $personnelB, $personnelA);
        
        // Check old assignment (Coordinator A) is soft-deactivated with effective_until
        $oldInactive = $db->table('program_coordinator_assignments')
            ->where('id', $active1['id'])
            ->get()->getRowArray();
        $oldIsSoftDeactivated = $oldInactive !== null && (int) $oldInactive['is_active'] === 0 && ! empty($oldInactive['effective_until']);

        // Check new assignment (Coordinator B) is active
        $newActive = $db->table('program_coordinator_assignments')
            ->where('academic_program_id', $testProgId)
            ->where('personnel_profile_id', $personnelB)
            ->where('is_active', 1)
            ->get()->getRowArray();
        $newIsActive = $newActive !== null && (int) $newActive['is_active'] === 1;

        $runTest('HIST-003', 'Reassignment soft-deactivates prior row and inserts new active row', $oldIsSoftDeactivated && $newIsActive, "Old active: " . json_encode($oldInactive) . ", New active: " . json_encode($newActive));

        // Step 3: Removal / Unassignment
        $collegeService->updatePersonnelCoordinatorAssignments($cetId, $personnelB, [], $personnelB);
        
        $totalRowsForProg = $db->table('program_coordinator_assignments')
            ->where('academic_program_id', $testProgId)
            ->countAllResults();
        $activeRowsForProg = $db->table('program_coordinator_assignments')
            ->where('academic_program_id', $testProgId)
            ->where('is_active', 1)
            ->countAllResults();

        $runTest('HIST-004', 'Removal leaves program unassigned and preserves all 2 historic rows', $activeRowsForProg === 0 && $totalRowsForProg === 2);

        // -------------------------------------------------------------
        // SECTION 4: Master Data Isolation
        // -------------------------------------------------------------
        CLI::write("\n[4] MASTER DATA ISOLATION", 'yellow');

        // 4.1 Update Program Master Data
        $updatedProg = $collegeService->updateProgram($testProgId, [
            'name'         => 'Updated Title For Master Data Isolation',
            'degree_level' => 'graduate',
        ]);
        $progRowAfterUpdate = $db->table('academic_programs')->where('id', $testProgId)->get()->getRowArray();
        
        // Ensure no assignment rows were created or mutated by program edit
        $rowsAfterProgUpdate = $db->table('program_coordinator_assignments')
            ->where('academic_program_id', $testProgId)
            ->countAllResults();
        $runTest('ISOL-001', 'Program master data edit has zero side-effects on assignment table', $rowsAfterProgUpdate === 2 && $progRowAfterUpdate['name'] === 'Updated Title For Master Data Isolation');

        // 4.2 Verify academic_programs table has no coordinator column
        $progColumns = $db->getFieldNames('academic_programs');
        $hasCoordinatorColumn = in_array('coordinator_id', $progColumns, true) || 
                                in_array('coordinator_profile_id', $progColumns, true) ||
                                in_array('program_coordinator_id', $progColumns, true);
        $runTest('ISOL-002', 'academic_programs table contains 0 redundant coordinator columns', ! $hasCoordinatorColumn);

        // -------------------------------------------------------------
        // SECTION 5: Hard-Delete Audit & Temporal Coherence
        // -------------------------------------------------------------
        CLI::write("\n[5] HARD-DELETE & TEMPORAL COHERENCE", 'yellow');

        // Verify temporal integrity on inactive rows: effective_until >= effective_from
        $temporalViolations = $db->query("
            SELECT id, effective_from, effective_until
            FROM program_coordinator_assignments
            WHERE effective_until IS NOT NULL 
              AND effective_until < effective_from
        ")->getResultArray();
        $runTest('TEMP-001', 'Temporal validity on historical rows (effective_until >= effective_from)', count($temporalViolations) === 0);

        // -------------------------------------------------------------
        // SECTION 6: UI / API / DB Agreement
        // -------------------------------------------------------------
        CLI::write("\n[6] UI / API / DB STATE AGREEMENT", 'yellow');

        $allPrograms = $collegeService->listPrograms($cetId);
        $mismatches = 0;
        foreach ($allPrograms as $p) {
            $dbActiveCoord = $db->table('program_coordinator_assignments pca')
                ->select('p.full_name')
                ->join('profiles p', 'p.id = pca.personnel_profile_id', 'inner')
                ->where('pca.academic_program_id', $p['id'])
                ->where('pca.is_active', 1)
                ->get()->getRowArray();

            $expectedName = $dbActiveCoord['full_name'] ?? null;
            if ($p['coordinator_name'] !== $expectedName) {
                $mismatches++;
            }
        }
        $runTest('AGREE-001', 'API listPrograms coordinator_name matches database 100%', $mismatches === 0, "Mismatches: {$mismatches}");

        // -------------------------------------------------------------
        // CLEANUP
        // -------------------------------------------------------------
        $db->table('program_coordinator_assignments')->where('academic_program_id', $testProgId)->delete();
        $db->table('personnel_program_affiliations')->where('id', $affA)->delete();
        $db->table('personnel_program_affiliations')->where('id', $affB)->delete();
        $db->table('academic_programs')->where('id', $testProgId)->delete();

        CLI::write("\n========================================================================", 'cyan');
        CLI::write("Phase 5 Integrity & History Verification: {$passed} Passed, {$failed} Failed", $failed === 0 ? 'green' : 'red');
        CLI::write("========================================================================", 'cyan');

        return $failed === 0 ? 0 : 1;
    }
}
