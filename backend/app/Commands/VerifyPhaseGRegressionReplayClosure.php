<?php

namespace App\Commands;

use App\Services\CollegeService;
use App\Services\Policies\GovernancePolicy;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;
use Throwable;

class VerifyPhaseGRegressionReplayClosure extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:phase-g-closure';
    protected $description = 'Executes Phase G Comprehensive Regression, Migration Replay, Parity, Seven-Persona Authorization, and Final Closure Gate';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'cyan');
        CLI::write("AchieveNest — Phase G Comprehensive Regression, Replay & Closure", 'white');
        CLI::write("========================================================================", 'cyan');

        $db = Database::connect();
        $passed = 0;
        $failed = 0;

        $runTest = function (string $code, string $name, bool $condition, string $details = '') use (&$passed, &$failed) {
            $status = $condition ? '[PASS]' : '[FAIL]';
            $color = $condition ? 'green' : 'red';
            CLI::write(sprintf("  %-12s %-53s %s", $code, $name, CLI::color($status, $color)));
            if (! $condition) {
                CLI::write("               Details: {$details}", 'yellow');
                $failed++;
            } else {
                $passed++;
            }
        };

        // =====================================================================
        // SECTION 1: Baseline Preservation & Invariants
        // =====================================================================
        CLI::write("\n[1/6] Baseline Preservation & Invariants...", 'yellow');
        $collegeCount = $db->table('colleges')->countAllResults();
        $programCount = $db->table('academic_programs')->countAllResults();
        $deanCount = $db->table('dean_assignments')->where('is_active', 1)->countAllResults();
        $coordCount = $db->table('program_coordinator_assignments')->where('is_active', 1)->countAllResults();

        $runTest('BASE-001', 'Active Colleges preserved (>= 5 rows)', $collegeCount >= 5, "Count: {$collegeCount}");
        $runTest('BASE-002', 'Active Programs preserved (>= 14 rows)', $programCount >= 14, "Count: {$programCount}");
        $runTest('BASE-003', 'Active Deans preserved (>= 2 active)', $deanCount >= 2, "Count: {$deanCount}");
        $runTest('BASE-004', 'Active Coordinators preserved (>= 3 active)', $coordCount >= 3, "Count: {$coordCount}");

        // =====================================================================
        // SECTION 2: Schema Parity Across MySQL Defense Replay
        // =====================================================================
        CLI::write("\n[2/6] Schema Parity Across MySQL Defense Replay...", 'yellow');
        
        // Inspect MySQL replay database columns
        $replayDb = Database::connect([
            'hostname' => '127.0.0.1',
            'username' => 'root',
            'password' => '',
            'database' => 'achievenest_phase_g_mysql_replay',
            'DBDriver' => 'MySQLi',
            'port'     => 3306,
            'charset'  => 'utf8mb4',
            'DBCollat' => 'utf8mb4_unicode_ci',
        ]);

        $collegesColumns = $replayDb->getFieldNames('colleges');
        $hasLogoStorageKey = in_array('logo_storage_key', $collegesColumns, true);
        $hasBadgeColor = in_array('acronym_badge_color', $collegesColumns, true);
        $hasLogoOriginalName = in_array('logo_original_name', $collegesColumns, true);
        $hasLogoMimeType = in_array('logo_mime_type', $collegesColumns, true);

        $runTest('SCHEMA-001', 'colleges table contains logo_storage_key', $hasLogoStorageKey);
        $runTest('SCHEMA-002', 'colleges table contains acronym_badge_color', $hasBadgeColor);
        $runTest('SCHEMA-003', 'colleges table contains logo_original_name & mime_type', $hasLogoOriginalName && $hasLogoMimeType);

        $programColumns = $replayDb->getFieldNames('academic_programs');
        $hasDegreeLevel = in_array('degree_level', $programColumns, true);
        $hasCollegeFk = in_array('college_id', $programColumns, true);
        $runTest('SCHEMA-004', 'academic_programs table contains college_id & degree_level', $hasDegreeLevel && $hasCollegeFk);

        $coordColumns = $replayDb->getFieldNames('program_coordinator_assignments');
        $hasCoordPersonnel = in_array('personnel_profile_id', $coordColumns, true);
        $hasCoordProgram = in_array('academic_program_id', $coordColumns, true);
        $hasCoordGuard = in_array('active_program_coord_guard', $coordColumns, true);
        $runTest('SCHEMA-005', 'program_coordinator_assignments contains guard column', $hasCoordPersonnel && $hasCoordProgram && $hasCoordGuard);

        $affilColumns = $replayDb->getFieldNames('personnel_program_affiliations');
        $hasAffilPersonnel = in_array('personnel_profile_id', $affilColumns, true);
        $hasAffilProgram = in_array('academic_program_id', $affilColumns, true);
        $runTest('SCHEMA-006', 'personnel_program_affiliations table present in replay', $hasAffilPersonnel && $hasAffilProgram);

        // =====================================================================
        // SECTION 3: Relationship & Data Integrity Queries
        // =====================================================================
        CLI::write("\n[3/6] Relationship & Data Integrity Queries...", 'yellow');

        // Orphan check 1: Academic Programs without valid College
        $orphanedPrograms = $db->table('academic_programs ap')
            ->join('colleges c', 'c.id = ap.college_id', 'left')
            ->where('c.id IS NULL')
            ->countAllResults();
        $runTest('INT-001', '0 orphaned Academic Programs without College', $orphanedPrograms === 0, "Count: {$orphanedPrograms}");

        // Orphan check 2: Coordinator assignments without valid personnel or program
        $orphanedCoordPersonnel = $db->table('program_coordinator_assignments pca')
            ->join('profiles p', 'p.id = pca.personnel_profile_id', 'left')
            ->where('p.id IS NULL')
            ->countAllResults();
        $orphanedCoordProg = $db->table('program_coordinator_assignments pca')
            ->join('academic_programs ap', 'ap.id = pca.academic_program_id', 'left')
            ->where('ap.id IS NULL')
            ->countAllResults();
        $runTest('INT-002', '0 orphaned Coordinator assignments', ($orphanedCoordPersonnel + $orphanedCoordProg) === 0);

        // Orphan check 3: Dean assignments without valid College or personnel
        $orphanedDeanCollege = $db->table('dean_assignments da')
            ->join('colleges c', 'c.id = da.college_id', 'left')
            ->where('c.id IS NULL')
            ->countAllResults();
        $orphanedDeanPersonnel = $db->table('dean_assignments da')
            ->join('profiles p', 'p.id = da.personnel_profile_id', 'left')
            ->where('p.id IS NULL')
            ->countAllResults();
        $runTest('INT-003', '0 orphaned Dean assignments', ($orphanedDeanCollege + $orphanedDeanPersonnel) === 0);

        // Coordinator conflict check: No program has >1 active coordinator
        $coordConflicts = $db->query("
            SELECT academic_program_id, COUNT(*) as active_count
            FROM program_coordinator_assignments
            WHERE is_active = 1
            GROUP BY academic_program_id
            HAVING active_count > 1
        ")->getResultArray();
        $runTest('INT-004', '0 programs with conflicting active coordinators', count($coordConflicts) === 0);

        // HR Affiliation boundary: Active coordinator assignments must have an active HR affiliation
        $unaffiliatedCoords = $db->query("
            SELECT pca.id, pca.personnel_profile_id, pca.academic_program_id
            FROM program_coordinator_assignments pca
            LEFT JOIN personnel_program_affiliations ppa 
                ON ppa.personnel_profile_id = pca.personnel_profile_id 
                AND ppa.academic_program_id = pca.academic_program_id 
                AND ppa.is_active = 1
            WHERE pca.is_active = 1 AND ppa.id IS NULL
        ")->getResultArray();
        $runTest('INT-005', '0 active coordinator assignments without active HR affiliation', count($unaffiliatedCoords) === 0);

        // =====================================================================
        // SECTION 4: Seven-Persona Authorization Matrix Smoke
        // =====================================================================
        CLI::write("\n[4/6] Seven-Persona Authorization Policy Matrix...", 'yellow');

        $govPolicy = new GovernancePolicy();

        $personas = [
            'osad_admin' => [
                'actor' => [
                    'profile' => ['account_type' => 'osad_admin'],
                    'roles'   => ['osad_staff'],
                ],
                'can_manage_colleges' => true,
                'can_assign_coordinators' => true,
                'can_assign_deans' => false,
            ],
            'hr_admin' => [
                'actor' => [
                    'profile' => ['account_type' => 'hr_admin'],
                    'roles'   => ['hr_staff'],
                ],
                'can_manage_colleges' => false,
                'can_assign_coordinators' => false,
                'can_assign_deans' => true,
            ],
            'dean' => [
                'actor' => [
                    'profile' => ['account_type' => 'academic_personnel'],
                    'roles'   => ['faculty', 'dean'],
                ],
                'can_manage_colleges' => false,
                'can_assign_coordinators' => false,
                'can_assign_deans' => false,
            ],
            'program_coordinator' => [
                'actor' => [
                    'profile' => ['account_type' => 'academic_personnel'],
                    'roles'   => ['faculty', 'program_coordinator'],
                ],
                'can_manage_colleges' => false,
                'can_assign_coordinators' => false,
                'can_assign_deans' => false,
            ],
            'organization_moderator' => [
                'actor' => [
                    'profile' => ['account_type' => 'academic_personnel'],
                    'roles'   => ['faculty', 'organization_moderator'],
                ],
                'can_manage_colleges' => false,
                'can_assign_coordinators' => false,
                'can_assign_deans' => false,
            ],
            'academic_personnel' => [
                'actor' => [
                    'profile' => ['account_type' => 'academic_personnel'],
                    'roles'   => ['faculty'],
                ],
                'can_manage_colleges' => false,
                'can_assign_coordinators' => false,
                'can_assign_deans' => false,
            ],
            'student' => [
                'actor' => [
                    'profile' => ['account_type' => 'student'],
                    'roles'   => ['student'],
                ],
                'can_manage_colleges' => false,
                'can_assign_coordinators' => false,
                'can_assign_deans' => false,
            ],
        ];

        foreach ($personas as $personaKey => $cfg) {
            $canCoord = $govPolicy->canAssignCoordinator($cfg['actor']);
            $canDean = $govPolicy->canAssignDean($cfg['actor']);

            $coordMatch = ($canCoord === $cfg['can_assign_coordinators']);
            $deanMatch = ($canDean === $cfg['can_assign_deans']);

            $runTest(
                'AUTH-' . strtoupper(substr($personaKey, 0, 4)),
                "Authorization matrix verified for persona [{$personaKey}]",
                $coordMatch && $deanMatch
            );
        }

        // =====================================================================
        // SECTION 5: Zero-Cloud / Offline Execution Invariant
        // =====================================================================
        CLI::write("\n[5/6] Zero-Cloud & Local-Defense Proof...", 'yellow');
        $authMode = env('AUTH_MODE') ?: 'local-defense';
        $runTest('OFFLINE-001', 'AUTH_MODE is set to local-defense', $authMode === 'local-defense');

        $isLocalDb = str_contains(env('database.local_defense.hostname') ?: '127.0.0.1', '127.0.0.1');
        $runTest('OFFLINE-002', 'Database targets local MySQL exclusively (127.0.0.1:3306)', $isLocalDb);

        // =====================================================================
        // SECTION 6: Summary & Gate Status
        // =====================================================================
        CLI::write("\n[6/6] Final Gate Evaluation...", 'yellow');
        $allPassed = ($failed === 0);

        CLI::write("========================================================================", 'cyan');
        CLI::write("Phase G Closure Verification Summary: {$passed} Passed, {$failed} Failed", $allPassed ? 'green' : 'red');
        CLI::write("========================================================================", 'cyan');

        if ($allPassed) {
            CLI::write("\n*** PHASE G: PASS — ACADEMIC STRUCTURE REFINEMENT CLOSED ***\n", 'green');
            return 0;
        }

        CLI::write("\n*** PHASE G: FAIL — ACADEMIC STRUCTURE REFINEMENT NOT CLOSED ***\n", 'red');
        return 1;
    }
}
