<?php

namespace App\Commands;

use App\Services\AwardEvaluationService;
use App\Services\AwardEvaluationSummaryService;
use App\Services\AwardScoringRuleEngine;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;

class VerifyAwardsPhase2 extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:awards-phase-2';
    protected $description = 'Validates Phase 2 Saint Marcellin Champagnat (SMC) Award Full Source-Fidelity Remediation';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'cyan');
        CLI::write("AchieveNest — Phase 2: SMC Award Full Source-Fidelity Verification", 'white');
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
            ->where('id', '50000001-0000-0000-0000-000000000021')
            ->get()->getRowArray();
        $runTest('SMC-IDENT-001', 'Exact Name "Saint Marcellin Champagnat (SMC) Award"', $award['name'] === 'Saint Marcellin Champagnat (SMC) Award' && $award['code'] === 'SMC_AWARD');
        $runTest('SMC-IDENT-002', 'Authority OFFICIAL, Status active, Source Fidelity VERIFIED', $award['authority_status'] === 'OFFICIAL' && $award['status'] === 'active' && $award['source_fidelity_status'] === 'VERIFIED');
        $runTest('SMC-IDENT-003', 'Graduating restriction is active (graduating_only = 1)', (int) $award['graduating_only'] === 1 && $award['gender_restriction'] === null);
        $runTest('SMC-IDENT-004', 'Candidate threshold is exactly 80.00%', (float) $award['candidate_threshold_percent'] === 80.00);

        // 2. Official Evaluation Basis (100 pts)
        $criteria = $db->table('award_criteria')
            ->where('award_definition_id', $award['id'])
            ->orderBy('sort_order', 'ASC')
            ->get()->getResultArray();
        $runTest('SMC-OFFIC-001', 'Exact 5 Official Criteria present in SMC Award', count($criteria) === 5);
        $officialTotal = array_sum(array_column($criteria, 'weight'));
        $runTest('SMC-OFFIC-002', 'Official Rubric Total sums to exactly 100.00 points', (float) $officialTotal === 100.00);

        // 3. Portfolio-Computable Criteria (60 pts)
        $computableCriteria = array_filter($criteria, fn($c) => (int) $c['is_portfolio_computable'] === 1);
        $computableTotal = array_sum(array_column($computableCriteria, 'max_points'));
        $runTest('SMC-COMP-001', 'Computable Criteria max points sum to exactly 60.00 points', (float) $computableTotal === 60.00);

        $nonComputable = array_filter($criteria, fn($c) => (int) $c['is_portfolio_computable'] === 0);
        $runTest('SMC-COMP-002', 'Scholastic (20) and Character (20) isolated as non-computable', count($nonComputable) === 2);

        // 4. Component Rules Engine Simulation
        $ruleA1 = $db->table('award_scoring_rules')->where('code', 'RULE_SMC_LEAD_INVOLVE')->get()->getRowArray();
        $runTest('SMC-A1-001', 'Component A1 rule configured as highest_only (max 10.00)', $ruleA1['rule_type'] === 'highest_only' && (float) $ruleA1['max_points'] === 10.00);

        $ruleA2 = $db->table('award_scoring_rules')->where('code', 'RULE_SMC_LEAD_AWARDS')->get()->getRowArray();
        $runTest('SMC-A2-001', 'Component A2 rule configured as sum_capped (max 10.00)', $ruleA2['rule_type'] === 'sum_capped' && (float) $ruleA2['max_points'] === 10.00);

        $ruleB1 = $db->table('award_scoring_rules')->where('code', 'RULE_SMC_COMM_INVOLVE')->get()->getRowArray();
        $runTest('SMC-B1-001', 'Component B1 rule configured as matrix_mapping count (max 15.00)', $ruleB1['rule_type'] === 'matrix_mapping' && (float) $ruleB1['max_points'] === 15.00);

        $ruleB2 = $db->table('award_scoring_rules')->where('code', 'RULE_SMC_COMM_INITIATED')->get()->getRowArray();
        $runTest('SMC-B2-001', 'Component B2 rule configured as role-based sum_capped (max 15.00)', $ruleB2['rule_type'] === 'sum_capped' && (float) $ruleB2['max_points'] === 15.00);

        $ruleC = $db->table('award_scoring_rules')->where('code', 'RULE_SMC_NONACAD_CITATIONS')->get()->getRowArray();
        $runTest('SMC-C-001', 'Component C rule configured as 2 pts/item capped at 10.00', $ruleC['rule_type'] === 'sum_capped' && (float) $ruleC['max_points'] === 10.00);

        // 5. Evidence Mapping Rules
        $mappings = $db->table('award_evidence_mapping_rules r')
            ->join('award_criteria c', 'c.id = r.criterion_id')
            ->where('c.award_definition_id', $award['id'])
            ->get()->getResultArray();
        $runTest('SMC-MAP-001', 'Exact 8 Evidence Mapping Rules active for SMC Award', count($mappings) === 8);

        // 6. Evaluation Summary Snapshot & Parity
        $evalService = new AwardEvaluationService($db);
        $summaryService = new AwardEvaluationSummaryService($db, $evalService);
        $cycle = $evalService->resolveActiveCycle();
        $student = $db->table('profiles')->where('account_type', 'student')->where('status', 'active')->get()->getRowArray();
        $summary = $summaryService->buildEvaluationSummary($cycle['id'], $award['id'], $student['id']);

        $runTest('SMC-SUMM-001', 'Evaluation Summary snapshot produced with complete totals', isset($summary['totals']['portfolio_potential_score']));
        $runTest('SMC-SUMM-002', 'Evaluation Summary exposes 60.00 computable max & 100.00 official max', (float) $summary['totals']['max_computable_score'] === 60.00 && (float) $summary['totals']['official_rubric_total'] === 100.00);
        $runTest('SMC-SUMM-003', 'Evaluation Summary isolates non-computable criteria with panel notice', count($summary['not_automatically_evaluated'] ?? []) === 2);

        // 7. Cumulative Invariant: 2 Verified / 15 Authoritative Baseline
        $activeCatalog = $db->table('award_definitions')->where('status', 'active')->where('is_catalog_visible', 1)->get()->getResultArray();
        $verifiedAwards = array_filter($activeCatalog, fn($a) => $a['source_fidelity_status'] === 'VERIFIED');
        $runTest('CUMUL-001', 'Cumulative catalog exposes 15 Verified / 15 Authoritative Baseline', count($activeCatalog) === 15 && count($verifiedAwards) === 15, "Active: " . count($activeCatalog) . ", Verified: " . count($verifiedAwards));

        // 8. Cumulative Notre Dame Award Invariant
        $nda = $db->table('award_definitions')->where('id', '50000001-0000-0000-0000-000000000001')->get()->getRowArray();
        $ndaCriteria = $db->table('award_criteria')->where('award_definition_id', $nda['id'])->get()->getResultArray();
        $ndaComputable = array_sum(array_column(array_filter($ndaCriteria, fn($c) => (int) $c['is_portfolio_computable'] === 1), 'max_points'));
        $runTest('NDA-REGR-001', 'Notre Dame Award preserved: 100 official / 50 computable / VERIFIED', $nda['source_fidelity_status'] === 'VERIFIED' && count($ndaCriteria) === 5 && (float) $ndaComputable === 50.00);

        CLI::write("========================================================================", 'cyan');
        CLI::write("Phase 2 Verification Summary: {$passed} Passed, {$failed} Failed", $failed === 0 ? 'green' : 'red');
        CLI::write("========================================================================", 'cyan');

        return $failed === 0 ? 0 : 1;
    }
}
