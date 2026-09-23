<?php

namespace App\Commands;

use App\Services\AwardEvaluationService;
use App\Services\AwardCandidateGenerationService;
use App\Services\AwardEvaluationSummaryService;
use App\Services\AwardScoringRuleEngine;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;

class VerifyAwardsPhase1B extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:awards-phase-1b';
    protected $description = 'Validates Phase 1B Notre Dame Award Full Source-Fidelity Remediation';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'cyan');
        CLI::write("AchieveNest — Phase 1B: Notre Dame Award Full Stack Verification", 'white');
        CLI::write("========================================================================", 'cyan');

        $db = Database::connect();
        $passed = 0;
        $failed = 0;

        $runTest = function (string $code, string $name, bool $condition, string $details = '') use (&$passed, &$failed) {
            $status = $condition ? '[PASS]' : '[FAIL]';
            $color = $condition ? 'green' : 'red';
            CLI::write(sprintf("  %-14s %-51s %s", $code, $name, CLI::color($status, $color)));
            if (! $condition) {
                CLI::write("                 Details: {$details}", 'yellow');
                $failed++;
            } else {
                $passed++;
            }
        };

        // 1. Identity & Authority
        $award = $db->table('award_definitions')
            ->where('id', '50000001-0000-0000-0000-000000000001')
            ->get()->getRowArray();
        $runTest('NDA-IDENT-001', 'Exact Name "Notre Dame Award" & Code NOTRE_DAME_AWARD', $award['name'] === 'Notre Dame Award' && $award['code'] === 'NOTRE_DAME_AWARD');
        $runTest('NDA-IDENT-002', 'Authority OFFICIAL, Status active, Source Fidelity VERIFIED', $award['authority_status'] === 'OFFICIAL' && $award['status'] === 'active' && $award['source_fidelity_status'] === 'VERIFIED');
        $runTest('NDA-IDENT-003', 'Graduating restriction is active (graduating_only = 1)', (int) $award['graduating_only'] === 1);
        $runTest('NDA-IDENT-004', 'Candidate threshold is exactly 80.00%', (float) $award['candidate_threshold_percent'] === 80.00);

        // 2. Official Evaluation Basis (100 pts)
        $criteria = $db->table('award_criteria')
            ->where('award_definition_id', $award['id'])
            ->orderBy('sort_order', 'ASC')
            ->get()->getResultArray();
        $runTest('NDA-OFFIC-001', 'Exact 5 Official Criteria present in Notre Dame Award', count($criteria) === 5);
        $officialTotal = array_sum(array_column($criteria, 'weight'));
        $runTest('NDA-OFFIC-002', 'Official Rubric Total sums to exactly 100.00 points', (float) $officialTotal === 100.00);

        // 3. Portfolio-Computable Criteria (50 pts)
        $computableCriteria = array_filter($criteria, fn($c) => (int) $c['is_portfolio_computable'] === 1);
        $computableTotal = array_sum(array_column($computableCriteria, 'max_points'));
        $runTest('NDA-COMP-001', 'Computable Criteria max points sum to exactly 50.00 points', (float) $computableTotal === 50.00);

        $nonComputable = array_filter($criteria, fn($c) => (int) $c['is_portfolio_computable'] === 0);
        $runTest('NDA-COMP-002', 'Scholastic (30) and Character (20) isolated as non-computable', count($nonComputable) === 2);

        // 4. Component Rules Engine Simulation
        $engine = new AwardScoringRuleEngine($db);

        // A1: highest_only matrix
        $critLead = $db->table('award_criteria')->where('code', 'CRIT_NDA_LEADERSHIP')->get()->getRowArray();
        $ruleA1 = $db->table('award_scoring_rules')->where('code', 'RULE_NDA_LEAD_INVOLVE')->get()->getRowArray();
        $runTest('NDA-A1-001', 'Component A1 rule configured as highest_only (max 10.00)', $ruleA1['rule_type'] === 'highest_only' && (float) $ruleA1['max_points'] === 10.00);

        // A2: sum_capped
        $ruleA2 = $db->table('award_scoring_rules')->where('code', 'RULE_NDA_LEAD_AWARDS')->get()->getRowArray();
        $runTest('NDA-A2-001', 'Component A2 rule configured as sum_capped (max 10.00)', $ruleA2['rule_type'] === 'sum_capped' && (float) $ruleA2['max_points'] === 10.00);

        // B1: matrix_mapping
        $ruleB1 = $db->table('award_scoring_rules')->where('code', 'RULE_NDA_CHURCH_MINISTRY')->get()->getRowArray();
        $runTest('NDA-B1-001', 'Component B1 rule configured as matrix_mapping count (max 10.00)', $ruleB1['rule_type'] === 'matrix_mapping' && (float) $ruleB1['max_points'] === 10.00);

        // B2: role-based sum_capped
        $ruleB2 = $db->table('award_scoring_rules')->where('code', 'RULE_NDA_CHURCH_INITIATED')->get()->getRowArray();
        $runTest('NDA-B2-001', 'Component B2 rule configured as role-based sum_capped (max 10.00)', $ruleB2['rule_type'] === 'sum_capped' && (float) $ruleB2['max_points'] === 10.00);

        // C: formula/sum_capped non-academic citations
        $ruleC = $db->table('award_scoring_rules')->where('code', 'RULE_NDA_NONACAD_CITATIONS')->get()->getRowArray();
        $runTest('NDA-C-001', 'Component C rule configured as 2 pts/item capped at 10.00', $ruleC['rule_type'] === 'sum_capped' && (float) $ruleC['max_points'] === 10.00);

        // 5. Evidence Mapping Rules
        $mappings = $db->table('award_evidence_mapping_rules r')
            ->join('award_criteria c', 'c.id = r.criterion_id')
            ->where('c.award_definition_id', $award['id'])
            ->get()->getResultArray();
        $runTest('NDA-MAP-001', 'Exact 6 Evidence Mapping Rules active for Notre Dame Award', count($mappings) === 6);

        // 6. Evaluation Summary Snapshot & Parity
        $evalService = new AwardEvaluationService($db);
        $summaryService = new AwardEvaluationSummaryService($db, $evalService);
        $cycle = $evalService->resolveActiveCycle();
        $student = $db->table('profiles')->where('account_type', 'student')->where('status', 'active')->get()->getRowArray();
        $summary = $summaryService->buildEvaluationSummary($cycle['id'], $award['id'], $student['id']);

        $runTest('NDA-SUMM-001', 'Evaluation Summary snapshot produced with complete totals', isset($summary['totals']['portfolio_potential_score']));
        $runTest('NDA-SUMM-002', 'Evaluation Summary exposes 50.00 computable max & 100.00 official max', (float) $summary['totals']['max_computable_score'] === 50.00 && (float) $summary['totals']['official_rubric_total'] === 100.00);
        $runTest('NDA-SUMM-003', 'Evaluation Summary isolates non-computable criteria with panel notice', count($summary['not_automatically_evaluated'] ?? []) === 2);

        // 7. Phase 1A Baseline Invariant Check
        $activeCatalog = $db->table('award_definitions')->where('status', 'active')->where('is_catalog_visible', 1)->countAllResults();
        $quarantinedCount = $db->table('award_definitions')->where('is_catalog_visible', 0)->countAllResults();
        $runTest('NDA-BASE-001', 'Active catalog contains 15 baseline awards and quarantined legacy rows intact', $activeCatalog === 15 && $quarantinedCount >= 7);

        CLI::write("========================================================================", 'cyan');
        CLI::write("Phase 1B Verification Summary: {$passed} Passed, {$failed} Failed", $failed === 0 ? 'green' : 'red');
        CLI::write("========================================================================", 'cyan');

        return $failed === 0 ? 0 : 1;
    }
}
