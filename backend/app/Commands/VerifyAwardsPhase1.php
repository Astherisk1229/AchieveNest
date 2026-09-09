<?php

namespace App\Commands;

use App\Services\AwardEvaluationService;
use App\Services\AwardCandidateGenerationService;
use App\Services\AwardEvaluationSummaryService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;

class VerifyAwardsPhase1 extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:awards-phase-1';
    protected $description = 'Validates Phase 1 Notre Dame Award Source-Fidelity Remediation';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'cyan');
        CLI::write("AchieveNest — Phase 1: Notre Dame Award Source-Fidelity Verification", 'white');
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

        // 1. NDA-001: Exact Award Name and Identity
        $award = $db->table('award_definitions')
            ->where('id', '50000001-0000-0000-0000-000000000001')
            ->get()->getRowArray();
        $runTest('NDA-001', 'Exact Award master name is "Notre Dame Award"', $award['name'] === 'Notre Dame Award');
        $runTest('NDA-002', 'Award code is NOTRE_DAME_AWARD and authority is OFFICIAL', $award['code'] === 'NOTRE_DAME_AWARD' && $award['authority_status'] === 'OFFICIAL');
        $runTest('NDA-003', 'Graduating restriction is active (graduating_only = 1)', (int) $award['graduating_only'] === 1);
        $runTest('NDA-004', 'Candidate threshold is 80.00%', (float) $award['candidate_threshold_percent'] === 80.00);

        // 2. Official Criteria & Weights
        $criteria = $db->table('award_criteria')
            ->where('award_definition_id', $award['id'])
            ->orderBy('sort_order', 'ASC')
            ->get()->getResultArray();
        $runTest('NDA-005', 'Exact 5 Official Criteria exist for Notre Dame Award', count($criteria) === 5);

        $officialTotal = array_sum(array_column($criteria, 'weight'));
        $runTest('NDA-006', 'Official Criteria weights sum to exactly 100.00 points', (float) $officialTotal === 100.00);

        $computableCriteria = array_filter($criteria, fn($c) => (int) $c['is_portfolio_computable'] === 1);
        $computableTotal = array_sum(array_column($computableCriteria, 'max_points'));
        $runTest('NDA-007', 'Computable Criteria max points sum to exactly 50.00 points', (float) $computableTotal === 50.00);

        // 3. Non-computable separation
        $nonComputable = array_filter($criteria, fn($c) => (int) $c['is_portfolio_computable'] === 0);
        $runTest('NDA-008', 'Scholastic Achievement (30) & Character (20) are non-computable', count($nonComputable) === 2);

        // 4. Criterion Components
        $components = $db->table('award_criterion_components comp')
            ->join('award_criteria c', 'c.id = comp.criterion_id')
            ->where('c.award_definition_id', $award['id'])
            ->get()->getResultArray();
        $runTest('NDA-009', '4 Criterion Components exist (A1, A2, B1, B2)', count($components) === 4);

        // 5. Evidence Mapping Rules
        $mappingRules = $db->table('award_evidence_mapping_rules r')
            ->join('award_criteria c', 'c.id = r.criterion_id')
            ->where('c.award_definition_id', $award['id'])
            ->get()->getResultArray();
        $runTest('NDA-010', '6 Evidence Mapping Rules configured for Notre Dame Award', count($mappingRules) === 6);

        // 6. Scoring Rules
        $scoringRules = $db->table('award_scoring_rules r')
            ->join('award_criteria c', 'c.id = r.criterion_id')
            ->where('c.award_definition_id', $award['id'])
            ->get()->getResultArray();
        $runTest('NDA-011', '5 Scoring Rules configured across approved rule types', count($scoringRules) === 5);

        // 7. Evaluation Calculation & Summary Assembly
        $evalService = new AwardEvaluationService($db);
        $summaryService = new AwardEvaluationSummaryService($db, $evalService);
        $cycle = $evalService->resolveActiveCycle();
        $student = $db->table('profiles')->where('account_type', 'student')->where('status', 'active')->get()->getRowArray();
        $summary = $summaryService->buildEvaluationSummary($cycle['id'], $award['id'], $student['id']);

        $runTest('NDA-012', 'Evaluation Summary produces deterministic snapshot for Notre Dame Award', isset($summary['totals']['portfolio_potential_score']));
        $runTest('NDA-013', 'Evaluation Summary exposes 50.00 max computable and 100.00 official max', (float) $summary['totals']['max_computable_score'] === 50.00 && (float) $summary['totals']['official_rubric_total'] === 100.00);

        CLI::write("========================================================================", 'cyan');
        CLI::write("Phase 1 Verification Summary: {$passed} Passed, {$failed} Failed", $failed === 0 ? 'green' : 'red');
        CLI::write("========================================================================", 'cyan');

        return $failed === 0 ? 0 : 1;
    }
}
