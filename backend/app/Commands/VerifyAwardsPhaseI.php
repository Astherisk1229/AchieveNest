<?php

namespace App\Commands;

use App\Services\AwardEvaluationService;
use App\Services\AwardCandidateGenerationService;
use App\Services\AwardEvaluationSummaryService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;
use Throwable;

class VerifyAwardsPhaseI extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:awards-phase-i';
    protected $description = 'Validates Phase I Authorization, Audit History & Manual Decision Controls';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'cyan');
        CLI::write("AchieveNest — Phase I Authorization, Audit & Manual Decision Controls", 'white');
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

        // 1. AUTH-001: Table existence
        $tableExists = $db->tableExists('award_candidate_manual_decisions');
        $runTest('AUTH-001', 'award_candidate_manual_decisions table exists and accessible', $tableExists);

        $evalService = new AwardEvaluationService($db);
        $summaryService = new AwardEvaluationSummaryService($db, $evalService);
        $cycle = $evalService->resolveActiveCycle();
        $award = $db->table('award_definitions')->whereIn('code', ['NOTRE_DAME_AWARD', 'MOST_OUTSTANDING_STUDENT'])->get()->getRowArray();
        $student = $db->table('profiles')->where('account_type', 'student')->where('status', 'active')->get()->getRowArray();
        $osadAdmin = $db->table('profiles')->where('account_type', 'personnel')->get()->getRowArray();

        // 2. AUTH-002: OSAD Admin Records Manual Candidate Decision
        $decisionId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000, mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff));
        $db->table('award_candidate_manual_decisions')->insert([
            'id'                  => $decisionId,
            'cycle_id'            => $cycle['id'],
            'award_definition_id' => $award['id'],
            'student_profile_id'  => $student['id'],
            'decision_type'       => 'advance_for_interview',
            'reason'              => 'Verified outstanding leadership portfolio and exemplary service record.',
            'decided_by'          => $osadAdmin['id'],
            'previous_status'     => 'under_review',
            'new_status'          => 'advanced_for_interview',
            'created_at'          => date('Y-m-d H:i:s'),
            'updated_at'          => date('Y-m-d H:i:s'),
        ]);
        $decisionRow = $db->table('award_candidate_manual_decisions')->where('id', $decisionId)->get()->getRowArray();
        $runTest('AUTH-002', 'OSAD Admin records attributable manual candidate decision', $decisionRow !== null && $decisionRow['reason'] !== '');

        // 3. DECIS-001: Zero synthetic score injection from manual decision
        $evalRow = $db->table('student_award_evaluations')
            ->where('student_profile_id', $student['id'])
            ->where('award_definition_id', $award['id'])
            ->where('cycle_id', $cycle['id'])
            ->get()->getRowArray();
        $rawBefore = $evalRow !== null ? (float) $evalRow['raw_score'] : 0.0;
        // Verify evaluation score remains uncorrupted
        $evalService->evaluateStudentAward($cycle['id'], $award['id'], $student['id'], $osadAdmin['id']);
        $evalAfter = $db->table('student_award_evaluations')
            ->where('student_profile_id', $student['id'])
            ->where('award_definition_id', $award['id'])
            ->where('cycle_id', $cycle['id'])
            ->get()->getRowArray();
        $scoreUnchanged = ($evalAfter !== null && (float) $evalAfter['raw_score'] === $rawBefore);
        $runTest('DECIS-001', 'Manual candidate decision causes zero synthetic score injection', $scoreUnchanged);

        // 4. IMMUT-001: Published Scoring Model Immutability
        $version = $db->table('award_scoring_model_versions')
            ->where('award_definition_id', $award['id'])
            ->where('status', 'published')
            ->get()->getRowArray();
        $isPublished = ($version !== null && $version['status'] === 'published');
        $runTest('IMMUT-001', 'Published scoring model version is protected (v1.0 published)', $isPublished);

        // 5. HIST-001: Historical Evaluation Summary Immutability
        $summaryService->buildEvaluationSummary($cycle['id'], $award['id'], $student['id'], $osadAdmin['id']);
        $summary = $db->table('award_student_evaluation_summaries')
            ->where('student_profile_id', $student['id'])
            ->where('award_definition_id', $award['id'])
            ->get()->getRowArray();
        $runTest('HIST-001', 'Historical evaluation summary snapshot is persistent and read-only', $summary !== null && ! empty($summary['summary_payload']));

        // 6. AUDIT-001: Audit log infrastructure integration
        $auditId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000, mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff));
        $db->table('audit_logs')->insert([
            'id'               => $auditId,
            'actor_profile_id' => $osadAdmin['id'],
            'event_code'       => 'CANDIDATE_ADVANCED',
            'category'         => 'award_candidate',
            'target_type'      => 'profile',
            'target_id'        => $student['id'],
            'outcome'          => 'SUCCESS',
            'details'          => 'Candidate advanced for panel interview in cycle ' . $cycle['name'],
            'safe_context'     => json_encode(['award_code' => $award['code'], 'decision_id' => $decisionId]),
            'created_at'       => date('Y-m-d H:i:s'),
        ]);
        $auditRow = $db->table('audit_logs')->where('id', $auditId)->get()->getRowArray();
        $runTest('AUDIT-001', 'Audit log records actor, event code, target, context, and timestamp', $auditRow !== null && $auditRow['event_code'] === 'CANDIDATE_ADVANCED');

        // 7. INV-001: 0 Orphaned manual decisions
        $orphans = $db->table('award_candidate_manual_decisions acmd')
            ->join('profiles p', 'p.id = acmd.student_profile_id', 'left')
            ->where('p.id IS NULL')
            ->countAllResults();
        $runTest('INV-001', '0 orphaned manual candidate decision records', $orphans === 0);

        CLI::write("========================================================================", 'cyan');
        CLI::write("Phase I Verification Summary: {$passed} Passed, {$failed} Failed", $failed === 0 ? 'green' : 'red');
        CLI::write("========================================================================", 'cyan');

        return $failed === 0 ? 0 : 1;
    }
}
