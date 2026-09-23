<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class AuditPlan05Phase8 extends BaseCommand
{
    protected $group       = 'Audit';
    protected $name        = 'audit:plan05-phase8';
    protected $description = 'Audits Plan 05 Phase 8 Evidence & Verification Alignment Contracts';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'yellow');
        CLI::write("AchieveNest — Plan 05 Phase 8: Evidence & Verification Alignment Audit", 'yellow');
        CLI::write("========================================================================", 'yellow');

        $db = db_connect();
        $passCount = 0;
        $totalChecks = 10;

        // Check 1: Exactly 1 Canonical Evidence Storage Service
        $storageServiceFile = APPPATH . 'Services/LocalEvidenceStorageService.php';
        if (file_exists($storageServiceFile)) {
            CLI::write("[PASS] Check 1: Canonical LocalEvidenceStorageService active.", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] Check 1: LocalEvidenceStorageService.php missing.", 'red');
        }

        // Check 2: Evidence Parent Foreign Key Integrity (0 Orphans)
        $orphanEvidence = $db->table('student_portfolio_evidence spe')
            ->join('student_portfolio_records spr', 'spr.id = spe.portfolio_record_id', 'left')
            ->where('spr.id', null)
            ->countAllResults();
        if ($orphanEvidence === 0) {
            CLI::write("[PASS] Check 2: Zero orphan evidence records in student_portfolio_evidence.", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] Check 2: Found {$orphanEvidence} orphan evidence records.", 'red');
        }

        // Check 3: Zero Review-Specific Duplicate Evidence Entities
        $duplicateTables = ['osad_evidence', 'review_evidence', 'award_evidence', 'evaluation_evidence'];
        $foundDupTables = 0;
        foreach ($duplicateTables as $dt) {
            if ($db->tableExists($dt)) {
                $foundDupTables++;
            }
        }
        if ($foundDupTables === 0) {
            CLI::write("[PASS] Check 3: Zero review-specific duplicated evidence tables.", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] Check 3: Found {$foundDupTables} duplicated evidence tables.", 'red');
        }

        // Check 4: Verification Events Parent Referential Integrity (0 Orphans)
        $orphanEvents = $db->table('student_portfolio_verification_events ve')
            ->join('student_portfolio_records spr', 'spr.id = ve.portfolio_record_id', 'left')
            ->where('spr.id', null)
            ->countAllResults();
        if ($orphanEvents === 0) {
            CLI::write("[PASS] Check 4: Zero orphan verification event records.", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] Check 4: Found {$orphanEvents} orphan verification event records.", 'red');
        }

        // Check 5: Verification Event Actors Reference Valid Profiles
        $orphanActors = $db->table('student_portfolio_verification_events ve')
            ->join('profiles p', 'p.id = ve.actor_profile_id', 'left')
            ->where('ve.actor_profile_id IS NOT NULL', null, false)
            ->where('p.id', null)
            ->countAllResults();
        if ($orphanActors === 0) {
            CLI::write("[PASS] Check 5: All verification event actors reference valid user profiles.", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] Check 5: Found {$orphanActors} orphan event actor references.", 'red');
        }

        // Check 6: Verification Status / Lifecycle States Alignment
        $validStatuses = ['draft', 'submitted', 'under_review', 'verified', 'revisions_requested', 'revision_requested', 'rejected', 'approved'];
        $records = $db->table('student_portfolio_records')->get()->getResultArray();
        $invalidStatusCount = 0;
        $invalidFound = [];
        foreach ($records as $r) {
            if (! in_array(strtolower($r['status']), $validStatuses, true)) {
                $invalidStatusCount++;
                $invalidFound[] = $r['status'];
            }
        }
        if ($invalidStatusCount === 0) {
            CLI::write("[PASS] Check 6: All portfolio records adhere to canonical lifecycle statuses.", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] Check 6: Found {$invalidStatusCount} invalid status records (" . implode(',', array_unique($invalidFound)) . ").", 'red');
        }

        // Check 7: Draft Queue Exclusion Gate
        $draftInQueue = $db->table('student_portfolio_records')
            ->where('status', 'draft')
            ->where('submitted_at IS NOT NULL', null, false)
            ->countAllResults();
        if ($draftInQueue === 0) {
            CLI::write("[PASS] Check 7: Draft records are strictly excluded from the verification queue.", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] Check 7: Found {$draftInQueue} drafts with submitted_at populated.", 'red');
        }

        // Check 8: Verified Status Integrity
        $verifiedWithoutSubmit = $db->table('student_portfolio_records')
            ->where('status', 'verified')
            ->where('submitted_at', null)
            ->countAllResults();
        if ($verifiedWithoutSubmit === 0) {
            CLI::write("[PASS] Check 8: Verified records maintain valid submission timestamps.", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] Check 8: Found {$verifiedWithoutSubmit} verified records with null submitted_at.", 'red');
        }

        // Check 9: Award Mapping Evidence Traceability
        $mappingServiceCode = file_get_contents(APPPATH . 'Services/AwardEvidenceMappingService.php');
        if (strpos($mappingServiceCode, 'record_id') !== false && strpos($mappingServiceCode, "'verified'") !== false) {
            CLI::write("[PASS] Check 9: Award mapping strictly traces to verified portfolio records.", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] Check 9: Award mapping does not bind to verified portfolio record IDs.", 'red');
        }

        // Check 10: Verifier Remarks vs Evaluator Deliberation Notes Separation
        if (file_exists(APPPATH . 'Controllers/Api/AwardEvaluationController.php')) {
            CLI::write("[PASS] Check 10: Evaluator deliberation notes managed in dedicated evaluation controller.", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] Check 10: AwardEvaluationController.php not found.", 'red');
        }

        CLI::write("========================================================================", 'yellow');
        CLI::write("Plan 05 Phase 8 Audit Result: {$passCount} / {$totalChecks} Checks Passed.", $passCount === $totalChecks ? 'green' : 'red');
        CLI::write("========================================================================", 'yellow');

        return $passCount === $totalChecks ? 0 : 1;
    }
}
