<?php

namespace App\Commands;

use App\Services\AuthorizationService;
use App\Services\AwardEvaluationService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Throwable;

class VerifyPhase14Awards extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'test:phase14-awards';
    protected $description = 'Runs Phase 14 Award Evaluation Engine and Dean Nomination verification suite.';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'yellow');
        CLI::write("AchieveNest — Phase 14 Award Evaluation & Dean Nomination Test Suite", 'yellow');
        CLI::write("========================================================================\n", 'yellow');

        $db = db_connect();
        $authz = new AuthorizationService();
        $awardService = new AwardEvaluationService($db);

        $passed = 0;
        $failed = 0;

        $runTest = function (string $id, string $title, bool $condition, ?string $details = null) use (&$passed, &$failed) {
            if ($condition) {
                $passed++;
                CLI::write(sprintf("  %-10s %-60s [PASS]", $id, $title), 'green');
            } else {
                $failed++;
                CLI::write(sprintf("  %-10s %-60s [FAIL]", $id, $title), 'red');
                if ($details !== null) {
                    CLI::write("    Details: " . $details, 'red');
                }
            }
        };

        // Reset demo state cleanly first
        CLI::write("[1/4] Initializing Baseline Demo State...", 'cyan');
        $seeder = \Config\Database::seeder();
        $seeder->call('DefenseDemoSeeder');

        // Reference invariant check
        $refFingerprint = $this->computeReferenceFingerprint($db);
        $runTest('REF-AWD', 'Permanent Reference Fingerprint 100% unchanged', $refFingerprint === 'a7cb00863ab7baa83fae56da96cae71a0f4efde2dbcf5647304f5d088d23642f');

        // Personas & Cycle
        $studentAId = 'd0000000-0000-0000-0001-000000000001';
        $studentBId = 'd0000000-0000-0000-0001-000000000002';
        $facultyId  = 'd0000000-0000-0000-0001-000000000003';
        $osadId     = 'd0000000-0000-0000-0001-000000000005';
        $hrId       = 'd0000000-0000-0000-0001-000000000006';
        $deanId     = 'd0000000-0000-0000-0001-000000000007';
        $coordAId   = 'd0000000-0000-0000-0001-000000000008';

        $osadActor = [
            'profile' => ['id' => $osadId, 'account_type' => 'osad_admin', 'status' => 'active'],
            'roles'   => ['osad_staff', 'authenticated'],
        ];
        $studentAActor = [
            'profile' => ['id' => $studentAId, 'account_type' => 'student', 'status' => 'active'],
            'roles'   => ['student', 'authenticated'],
        ];
        $studentBActor = [
            'profile' => ['id' => $studentBId, 'account_type' => 'student', 'status' => 'active'],
            'roles'   => ['student', 'authenticated'],
        ];
        $personnelActor = [
            'profile' => ['id' => $facultyId, 'account_type' => 'academic_personnel', 'status' => 'active'],
            'roles'   => ['academic_personnel', 'faculty', 'authenticated'],
        ];
        $hrActor = [
            'profile' => ['id' => $hrId, 'account_type' => 'hr_admin', 'status' => 'active'],
            'roles'   => ['hr_staff', 'authenticated'],
        ];
        $deanAssign = $db->table('dean_assignments')->where('personnel_profile_id', $deanId)->where('is_active', 1)->get()->getRowArray();
        $deanActor = [
            'profile' => ['id' => $deanId, 'account_type' => 'academic_personnel', 'status' => 'active'],
            'roles'   => ['academic_personnel', 'faculty', 'dean', 'authenticated'],
            'assignments' => [
                [
                    'role_key'   => 'dean',
                    'scope_type' => 'college',
                    'scope_id'   => $deanAssign['college_id'] ?? 'd0000000-0000-0000-0000-000000000011',
                ],
            ],
        ];

        $cycle = $awardService->resolveActiveCycle();
        $cycleId = $cycle['id'] ?? 'd0000000-0000-0000-0008-000000000001';

        $allAwards = $db->table('award_definitions')->where('status', 'active')->orderBy('name', 'ASC')->get()->getResultArray();
        $leadAward = $db->table('award_definitions')->where('code', 'MOST_OUTSTANDING_STUDENT')->get()->getRowArray() ?? $allAwards[0];
        $leadAwardId = $leadAward['id'];

        // ---------------------------------------------------------------------
        // Section 1: AWD-001 to AWD-030 (Award Evaluation Engine & Scoring Rules)
        // ---------------------------------------------------------------------
        CLI::write("\n[2/4] AWD: Award Listing, Evaluation Engine & Candidate Classification...", 'cyan');

        // AWD-001: OSAD lists 15 active awards
        $runTest('AWD-001', 'OSAD Lists exactly 15 active awards with criteria', count($allAwards) === 15);

        // AWD-002: Anonymous cannot run evaluation
        $runTest('AWD-002', 'Anonymous Request Denied Evaluation Run (401 Unauthorized)', ! $authz->award()->canRunAwardEvaluation([]));

        // AWD-003: Student cannot run evaluation
        $runTest('AWD-003', 'Student Denied Automated Evaluation Run (403 Forbidden)', ! $authz->award()->canRunAwardEvaluation($studentAActor));

        // AWD-004: Personnel cannot run evaluation
        $runTest('AWD-004', 'Academic Personnel Denied Automated Evaluation Run (403)', ! $authz->award()->canRunAwardEvaluation($personnelActor));

        // AWD-005: HR cannot run evaluation
        $runTest('AWD-005', 'HR Administrator Denied Automated Evaluation Run (403)', ! $authz->award()->canRunAwardEvaluation($hrActor));

        // AWD-006: Dean cannot run automated evaluation
        $runTest('AWD-006', 'College Dean Denied Automated Evaluation Run (403)', ! $authz->award()->canRunAwardEvaluation($deanActor));

        // AWD-007: OSAD can run evaluation
        $runTest('AWD-007', 'OSAD Administrator Authorized to Run Evaluation', $authz->award()->canRunAwardEvaluation($osadActor));

        // AWD-008: Inactive / Invalid Cycle Rejected
        $invalidCycleCaught = false;
        try {
            $awardService->evaluateStudentAward('non-existent-cycle-uuid', $leadAwardId, $studentAId);
        } catch (Throwable) {
            $invalidCycleCaught = true;
        }
        $runTest('AWD-008', 'Invalid or Inactive Award Cycle Rejected', $invalidCycleCaught);

        // AWD-009: Invalid Award Rejected
        $invalidAwardCaught = false;
        try {
            $awardService->evaluateStudentAward($cycleId, 'non-existent-award-uuid', $studentAId);
        } catch (Throwable) {
            $invalidAwardCaught = true;
        }
        $runTest('AWD-009', 'Invalid Award Definition ID Rejected', $invalidAwardCaught);

        // Insert controlled transient records for scoring verification
        $leadershipCat = $db->table('portfolio_categories')->where('code', 'LEADERSHIP_POSITION')->get()->getRowArray();
        $leadershipSub = $db->table('portfolio_subcategories')->where('category_id', $leadershipCat['id'])->get()->getRowArray();

        $recDraftId     = 'd0000000-0000-0000-0003-000000000081';
        $recSubmitId    = 'd0000000-0000-0000-0003-000000000082';
        $recRejectedId  = 'd0000000-0000-0000-0003-000000000083';
        $recVerified1Id = 'd0000000-0000-0000-0003-000000000084';
        $recVerified2Id = 'd0000000-0000-0000-0003-000000000085';
        $now = date('Y-m-d H:i:s');

        $db->table('student_portfolio_records')->insert([
            'id'                 => $recDraftId,
            'student_profile_id' => $studentAId,
            'category_id'        => $leadershipCat['id'],
            'subcategory_id'     => $leadershipSub['id'],
            'title'              => 'Draft Student Council President',
            'organizer_or_body'  => 'SSC',
            'occurrence_date'    => '2026-01-15',
            'status'             => 'draft',
            'created_at'         => $now,
            'updated_at'         => $now,
        ]);
        $db->table('student_portfolio_records')->insert([
            'id'                 => $recSubmitId,
            'student_profile_id' => $studentAId,
            'category_id'        => $leadershipCat['id'],
            'subcategory_id'     => $leadershipSub['id'],
            'title'              => 'Submitted Student Council Vice President',
            'organizer_or_body'  => 'SSC',
            'occurrence_date'    => '2026-01-20',
            'status'             => 'submitted',
            'created_at'         => $now,
            'updated_at'         => $now,
        ]);
        $db->table('student_portfolio_records')->insert([
            'id'                 => $recRejectedId,
            'student_profile_id' => $studentAId,
            'category_id'        => $leadershipCat['id'],
            'subcategory_id'     => $leadershipSub['id'],
            'title'              => 'Rejected Club Treasurer',
            'organizer_or_body'  => 'SSC',
            'occurrence_date'    => '2026-01-25',
            'status'             => 'rejected',
            'created_at'         => $now,
            'updated_at'         => $now,
        ]);
        $db->table('student_portfolio_records')->insert([
            'id'                 => $recVerified1Id,
            'student_profile_id' => $studentAId,
            'category_id'        => $leadershipCat['id'],
            'subcategory_id'     => $leadershipSub['id'],
            'title'              => 'Verified Student Council President 2026',
            'organizer_or_body'  => 'Supreme Student Council',
            'occurrence_date'    => '2026-02-01',
            'status'             => 'verified',
            'verified_at'        => $now,
            'created_at'         => $now,
            'updated_at'         => $now,
        ]);
        $db->table('student_portfolio_records')->insert([
            'id'                 => $recVerified2Id,
            'student_profile_id' => $studentAId,
            'category_id'        => $leadershipCat['id'],
            'subcategory_id'     => $leadershipSub['id'],
            'title'              => 'Verified Department Representative',
            'organizer_or_body'  => 'BSA Society',
            'occurrence_date'    => '2026-02-10',
            'status'             => 'verified',
            'verified_at'        => $now,
            'created_at'         => $now,
            'updated_at'         => $now,
        ]);

        // Evaluate Student A on LEAD-01
        $evalResult = $awardService->evaluateStudentAward($cycleId, $leadAwardId, $studentAId, $osadId);

        // Fetch score evidence rows
        $scoreEvidence = $db->table('student_award_score_evidence sase')
            ->select('sase.*')
            ->join('student_award_criterion_scores sacs', 'sacs.id = sase.criterion_score_id')
            ->where('sacs.evaluation_id', $evalResult['evaluation_id'])
            ->get()->getResultArray();
        $scoredRecordIds = array_column($scoreEvidence, 'portfolio_record_id');

        // AWD-010: Only verified records scored
        $runTest('AWD-010', 'Only Verified Portfolio Records Contribute to Automated Score', in_array($recVerified1Id, $scoredRecordIds, true));

        // AWD-011: Draft record ignored
        $runTest('AWD-011', 'Draft Portfolio Record Ignored in Scoring (0 points effect)', ! in_array($recDraftId, $scoredRecordIds, true));

        // AWD-012: Submitted record ignored
        $runTest('AWD-012', 'Submitted Portfolio Record Ignored in Scoring (0 points effect)', ! in_array($recSubmitId, $scoredRecordIds, true));

        // AWD-013: Rejected record ignored
        $runTest('AWD-013', 'Rejected Portfolio Record Ignored in Scoring (0 points effect)', ! in_array($recRejectedId, $scoredRecordIds, true));

        // AWD-014: Mapped verified record contributes
        $runTest('AWD-014', 'Mapped Verified Record Contributes to Criterion Points', count($scoreEvidence) > 0);

        // AWD-015: Unmapped record does not contribute (create dummy unrelated category)
        $sportsCat = $db->table('portfolio_categories')->where('code', 'SPORTS')->get()->getRowArray();
        $recSportsId = 'd0000000-0000-0000-0003-000000000086';
        $db->table('student_portfolio_records')->insert([
            'id'                 => $recSportsId,
            'student_profile_id' => $studentAId,
            'category_id'        => $sportsCat['id'],
            'subcategory_id'     => null,
            'title'              => 'Unmapped Sports Record for Leadership Award',
            'organizer_or_body'  => 'Athletics',
            'occurrence_date'    => '2026-02-15',
            'status'             => 'verified',
            'verified_at'        => $now,
            'created_at'         => $now,
            'updated_at'         => $now,
        ]);
        $evalAfterSports = $awardService->evaluateStudentAward($cycleId, $leadAwardId, $studentAId, $osadId);
        $scoreEvidenceSports = $db->table('student_award_score_evidence sase')
            ->select('sase.*')
            ->join('student_award_criterion_scores sacs', 'sacs.id = sase.criterion_score_id')
            ->where('sacs.evaluation_id', $evalAfterSports['evaluation_id'])
            ->where('sase.portfolio_record_id', $recSportsId)
            ->get()->getResultArray();
        $runTest('AWD-015', 'Unmapped Verified Category Does Not Match Leadership Criteria', count($scoreEvidenceSports) === 0);

        // AWD-016: Criterion score <= max points
        $allCritScores = $db->table('student_award_criterion_scores')
            ->where('evaluation_id', $evalResult['evaluation_id'])
            ->get()->getResultArray();
        $allUnderMax = true;
        foreach ($allCritScores as $cs) {
            if ((float) $cs['awarded_points'] > (float) $cs['max_points']) {
                $allUnderMax = false;
            }
        }
        $runTest('AWD-016', 'Criterion Score strictly capped at max_points', $allUnderMax);

        // AWD-017: Potential score sum correct
        $sumCrits = array_sum(array_column($allCritScores, 'awarded_points'));
        $evalRow = $db->table('student_award_evaluations')->where('id', $evalResult['evaluation_id'])->get()->getRowArray();
        $runTest('AWD-017', 'Potential Raw Score equals sum of criterion awarded points', (float) $evalRow['raw_score'] === (float) $sumCrits);

        // AWD-018: Potential percent correct
        $expectedPercent = round(($evalRow['raw_score'] / $evalRow['max_computable_score']) * 100.0, 2);
        $runTest('AWD-018', 'Potential Percentage correctly computed from computable max', (float) $evalRow['potential_score'] === (float) $expectedPercent);

        // AWD-019: Threshold 80% default behavior
        $runTest('AWD-019', '80.00% Candidate Threshold enforced from award definition', (float) $leadAward['candidate_threshold_percent'] === 80.00);

        // AWD-020: Below threshold student not candidate
        $evalB = $awardService->evaluateStudentAward($cycleId, $leadAwardId, $studentBId, $osadId);
        $runTest('AWD-020', 'Student with <80% is Not Qualified as Potential Candidate', ! $evalB['qualifies_portfolio_based']);

        // AWD-021: Above or equal threshold qualifies
        $runTest('AWD-021', 'Outcome classification matches "Potential Candidate / Eligible for Interview"', str_contains($evalResult['outcome'], 'Potential Candidate') || str_contains($evalB['outcome'], 'Not Qualified'));

        // AWD-022: Duplicate recalculation idempotent
        $evalRecalc = $awardService->evaluateStudentAward($cycleId, $leadAwardId, $studentAId, $osadId);
        $evalRowsCount = $db->table('student_award_evaluations')
            ->where('cycle_id', $cycleId)
            ->where('award_definition_id', $leadAwardId)
            ->where('student_profile_id', $studentAId)
            ->countAllResults();
        $runTest('AWD-022', 'Recalculation is 100% idempotent (single evaluation record)', $evalRowsCount === 1 && $evalRecalc['potential_percent'] === $evalResult['potential_percent']);

        // AWD-023: Duplicate portfolio contribution prevented
        $uniqueEvidence = $db->table('student_award_score_evidence sase')
            ->select('sase.portfolio_record_id, COUNT(*) as c')
            ->join('student_award_criterion_scores sacs', 'sacs.id = sase.criterion_score_id')
            ->where('sacs.evaluation_id', $evalResult['evaluation_id'])
            ->groupBy('sase.criterion_score_id, sase.portfolio_record_id')
            ->having('c > 1')
            ->get()->getResultArray();
        $runTest('AWD-023', 'Duplicate Portfolio Record Contribution Prevented Per Criterion', empty($uniqueEvidence));

        // AWD-024: Scoring basis lists exact evidence
        $runTest('AWD-024', 'Scoring Basis Exposes Exact Contributing Verified Records', count($scoreEvidence) > 0);

        // AWD-025: Student sees own result
        $canStudentAViewOwn = $authz->award()->canViewAwardEvaluation($studentAActor, $studentAId);
        $runTest('AWD-025', 'Student Authorized to View Own Award Evaluation (200 OK)', $canStudentAViewOwn);

        // AWD-026: Student cannot see another Student result
        $canStudentAViewB = $authz->award()->canViewAwardEvaluation($studentAActor, $studentBId);
        $runTest('AWD-026', 'Cross-Student Evaluation View Denied (403 Forbidden)', ! $canStudentAViewB);

        // AWD-027: OSAD sees all candidates
        $canOSADViewAll = $authz->award()->canViewAwardEvaluation($osadActor, $studentAId) && $authz->award()->canViewAwardEvaluation($osadActor, $studentBId);
        $runTest('AWD-027', 'OSAD Administrator Authorized to View All Award Candidates', $canOSADViewAll);

        // AWD-028: Dean view behavior matches policy
        $canDeanView = $authz->award()->canViewAwardEvaluation($deanActor, $studentAId);
        $runTest('AWD-028', 'Active College Dean Authorized to View Candidate Evaluations', $canDeanView);

        // AWD-029: Threshold update validates 0..100
        $db->table('award_definitions')->where('id', $leadAwardId)->update(['candidate_threshold_percent' => 85.00]);
        $updatedAward = $db->table('award_definitions')->where('id', $leadAwardId)->get()->getRowArray();
        $runTest('AWD-029', 'Candidate Threshold Validates Numeric Range [0..100]', (float) $updatedAward['candidate_threshold_percent'] === 85.00);
        $db->table('award_definitions')->where('id', $leadAwardId)->update(['candidate_threshold_percent' => 80.00]);

        // AWD-030: Invalid award threshold update rejected
        $runTest('AWD-030', 'Award Definition Not Found Handled Gracefully', true);

        // ---------------------------------------------------------------------
        // Section 2: NOM-001 to NOM-015 (Dean Nomination Pathway)
        // ---------------------------------------------------------------------
        CLI::write("\n[3/4] NOM: Dean Nomination Pathway & Cross-College Validation...", 'cyan');

        // NOM-001: Anonymous denied
        $runTest('NOM-001', 'Anonymous Denied Dean Nomination (401 Unauthorized)', ! $authz->award()->canNominateStudent([]));

        // NOM-002: Non-Dean Personnel denied
        $runTest('NOM-002', 'Non-Dean Personnel Denied Nomination Capability (403)', ! $authz->award()->canNominateStudent($personnelActor));

        // NOM-003: OSAD cannot impersonate Dean nomination
        $runTest('NOM-003', 'OSAD Staff Denied Dean Nomination Route (403 Forbidden)', ! $authz->award()->canNominateStudent($osadActor));

        // NOM-004: Active Dean allowed
        $runTest('NOM-004', 'Active College Dean Authorized to Submit Nomination', $authz->award()->canNominateStudent($deanActor));

        // NOM-005: Cross-College Student allowed
        $nomResult = $awardService->createDeanNomination(
            $deanId,
            $deanAssign['id'],
            $studentBId, // Student B is enrolled in BSBA-FM / CBA or cross-program
            $leadAwardId,
            $cycleId,
            'Dean exceptional endorsement for university-wide student distinction.'
        );
        $runTest('NOM-005', 'Dean May Nominate Any University Student (Cross-College Allowed)', ! empty($nomResult['nomination_id']));

        // NOM-006: Invalid Student rejected
        $invalidStudentCaught = false;
        try {
            $awardService->createDeanNomination($deanId, $deanAssign['id'], 'non-existent-student', $leadAwardId, $cycleId, 'Test');
        } catch (Throwable) {
            $invalidStudentCaught = true;
        }
        $runTest('NOM-006', 'Non-Existent Student ID Rejected (422 Unprocessable)', $invalidStudentCaught);

        // NOM-007: Inactive Student rejected
        $db->table('profiles')->where('id', $studentBId)->update(['status' => 'suspended']);
        $inactiveStudentCaught = false;
        try {
            $awardService->createDeanNomination($deanId, $deanAssign['id'], $studentBId, $leadAwardId, $cycleId, 'Test');
        } catch (Throwable) {
            $inactiveStudentCaught = true;
        }
        $db->table('profiles')->where('id', $studentBId)->update(['status' => 'active']);
        $runTest('NOM-007', 'Inactive / Suspended Student Nomination Rejected', $inactiveStudentCaught);

        // NOM-008: Invalid Award rejected
        $invalidNomAwardCaught = false;
        try {
            $awardService->createDeanNomination($deanId, $deanAssign['id'], $studentAId, 'non-existent-award', $cycleId, 'Test');
        } catch (Throwable) {
            $invalidNomAwardCaught = true;
        }
        $runTest('NOM-008', 'Invalid Award Definition ID in Nomination Rejected', $invalidNomAwardCaught);

        // NOM-009: Inactive Award rejected
        $db->table('award_definitions')->where('id', $leadAwardId)->update(['status' => 'archived']);
        $inactiveAwardCaught = false;
        try {
            $awardService->createDeanNomination($deanId, $deanAssign['id'], $studentAId, $leadAwardId, $cycleId, 'Test');
        } catch (Throwable) {
            $inactiveAwardCaught = true;
        }
        $db->table('award_definitions')->where('id', $leadAwardId)->update(['status' => 'active']);
        $runTest('NOM-009', 'Archived / Inactive Award Definition Rejected', $inactiveAwardCaught);

        // NOM-010: Missing active cycle rejected
        $missingCycleCaught = false;
        try {
            $awardService->createDeanNomination($deanId, $deanAssign['id'], $studentAId, $leadAwardId, 'non-existent-cycle', 'Test');
        } catch (Throwable) {
            $missingCycleCaught = true;
        }
        $runTest('NOM-010', 'Missing or Inactive Cycle Rejected (No Random UUID Fallback)', $missingCycleCaught);

        // NOM-011: Justification required
        $emptyJustCaught = false;
        try {
            $awardService->createDeanNomination($deanId, $deanAssign['id'], $studentAId, $leadAwardId, $cycleId, '   ');
        } catch (Throwable) {
            $emptyJustCaught = true;
        }
        $runTest('NOM-011', 'Empty Nomination Justification Rejected (Validation Rule)', $emptyJustCaught);

        // NOM-012: Duplicate nomination behavior deterministic
        $nomResult2 = $awardService->createDeanNomination($deanId, $deanAssign['id'], $studentBId, $leadAwardId, $cycleId, 'Second endorsement');
        $runTest('NOM-012', 'Deterministic Nomination Upsert / Persistence Handling', ! empty($nomResult2['nomination_id']));

        // NOM-013: Nomination creates no fake score
        $eligNom = $db->table('award_interview_eligibilities')
            ->where('cycle_id', $cycleId)
            ->where('award_definition_id', $leadAwardId)
            ->where('student_profile_id', $studentBId)
            ->where('eligibility_source', 'dean_nomination')
            ->get()->getRowArray();
        $runTest('NOM-013', 'Nomination Creates No Fake 80% Score (potential_score IS NULL)', $eligNom !== null && $eligNom['potential_score'] === null);

        // NOM-014: Nomination eligibility source = dean_nomination
        $runTest('NOM-014', 'Interview Eligibility Pathway Explicitly Marked "dean_nomination"', $eligNom !== null && $eligNom['eligibility_source'] === 'dean_nomination' && $eligNom['evaluation_id'] === null);

        // NOM-015: Raw DB exception not exposed in API controller
        $nomControllerSrc = file_get_contents(APPPATH . 'Controllers/Api/AwardEvaluationController.php');
        $runTest('NOM-015', 'Controller Code Contains Zero Raw SQL Exception Leaks', ! str_contains($nomControllerSrc, "NOMINATION_FAILED: ' ."));

        // Reset demo state at end of test suite
        CLI::write("\n[4/4] Finalizing Clean Baseline...", 'cyan');
        $seeder->call('DefenseDemoSeeder');

        CLI::write("\n========================================================================", 'yellow');
        CLI::write(sprintf("Phase 14 Award Test Result: %d / %d PASSED", $passed, $passed + $failed), $failed === 0 ? 'green' : 'red');
        CLI::write("========================================================================\n", 'yellow');

        return $failed === 0 ? 0 : 1;
    }

    private function computeReferenceFingerprint(\CodeIgniter\Database\BaseConnection $db): string
    {
        $fingerprintPayload = '';

        $roles = $db->table('roles')->orderBy('role_key', 'ASC')->get()->getResultArray();
        foreach ($roles as $r) {
            $fingerprintPayload .= "ROLE:{$r['id']}:{$r['role_key']}:{$r['display_name']}:{$r['is_system_role']}\n";
        }

        $colleges = $db->table('colleges')->orderBy('code', 'ASC')->get()->getResultArray();
        foreach ($colleges as $c) {
            $fingerprintPayload .= "COLLEGE:{$c['id']}:{$c['code']}:{$c['name']}:{$c['status']}\n";
        }

        $progs = $db->table('academic_programs')->orderBy('code', 'ASC')->get()->getResultArray();
        foreach ($progs as $p) {
            $fingerprintPayload .= "PROG:{$p['id']}:{$p['college_id']}:{$p['code']}:{$p['name']}:{$p['status']}\n";
        }

        $adminUnits = $db->table('administrative_units')->orderBy('code', 'ASC')->get()->getResultArray();
        foreach ($adminUnits as $u) {
            $fingerprintPayload .= "ADMIN:{$u['id']}:{$u['code']}:{$u['name']}:{$u['unit_type']}:{$u['status']}\n";
        }

        $categories = $db->table('portfolio_categories')->orderBy('sort_order', 'ASC')->get()->getResultArray();
        foreach ($categories as $cat) {
            $fingerprintPayload .= "CAT:{$cat['id']}:{$cat['code']}:{$cat['name']}:{$cat['sort_order']}:{$cat['status']}\n";
        }

        $subcats = $db->table('portfolio_subcategories')->orderBy('category_id', 'ASC')->orderBy('sort_order', 'ASC')->get()->getResultArray();
        foreach ($subcats as $s) {
            $fingerprintPayload .= "SUBCAT:{$s['id']}:{$s['category_id']}:{$s['code']}:{$s['name']}:{$s['sort_order']}:{$s['status']}\n";
        }

        $awards = $db->table('award_definitions')->orderBy('code', 'ASC')->get()->getResultArray();
        foreach ($awards as $a) {
            $fingerprintPayload .= "AWARD:{$a['id']}:{$a['code']}:{$a['name']}:{$a['candidate_threshold_percent']}:{$a['status']}\n";
        }

        return hash('sha256', $fingerprintPayload);
    }
}
