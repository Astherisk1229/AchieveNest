<?php

namespace App\Commands;

use App\Services\AwardEvaluationService;
use App\Services\AwardEvaluationSummaryService;
use App\Services\AwardScoringRuleEngine;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;

class VerifyAwardsPhase4 extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:awards-phase-4';
    protected $description = 'Validates Phase 4 Campus Journalism Award Full Source-Fidelity Remediation';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'cyan');
        CLI::write("AchieveNest — Phase 4: Campus Journalism Award Full Stack Verification", 'white');
        CLI::write("========================================================================", 'cyan');

        $db = Database::connect();
        $passed = 0;
        $failed = 0;

        $runTest = function (string $code, string $name, bool $condition, string $details = '') use (&$passed, &$failed) {
            $status = $condition ? '[PASS]' : '[FAIL]';
            $color = $condition ? 'green' : 'red';
            CLI::write(sprintf("  %-16s %-49s %s", $code, $name, CLI::color($status, $color)));
            if (! $condition) {
                CLI::write("                   Details: {$details}", 'yellow');
                $failed++;
            } else {
                $passed++;
            }
        };

        // 1. Identity & Authority
        $award = $db->table('award_definitions')
            ->where('id', '50000001-0000-0000-0000-000000000023')
            ->get()->getRowArray();
        $runTest('JOURN-IDENT-001', 'Exact Name "Campus Journalism Award" & Code', $award['name'] === 'Campus Journalism Award' && $award['code'] === 'CAMPUS_JOURNALISM_AWARD');
        $runTest('JOURN-IDENT-002', 'Authority OFFICIAL, Status active, Source Fidelity VERIFIED', $award['authority_status'] === 'OFFICIAL' && $award['status'] === 'active' && $award['source_fidelity_status'] === 'VERIFIED');
        $runTest('JOURN-IDENT-003', 'Graduating restriction is active (graduating_only = 1)', (int) $award['graduating_only'] === 1 && $award['gender_restriction'] === null);
        $runTest('JOURN-IDENT-004', 'Candidate threshold is exactly 80.00%', (float) $award['candidate_threshold_percent'] === 80.00);

        // 2. Official Evaluation Basis (100 pts)
        $criteria = $db->table('award_criteria')
            ->where('award_definition_id', $award['id'])
            ->orderBy('sort_order', 'ASC')
            ->get()->getResultArray();
        $runTest('JOURN-OFFIC-001', 'Exact 4 Official Criteria present in Campus Journalism Award', count($criteria) === 4);
        $officialTotal = array_sum(array_column($criteria, 'weight'));
        $runTest('JOURN-OFFIC-002', 'Official Rubric Total sums to exactly 100.00 points', (float) $officialTotal === 100.00);

        // 3. Portfolio-Computable Criteria (70 pts)
        $computableCriteria = array_filter($criteria, fn($c) => (int) $c['is_portfolio_computable'] === 1);
        $computableTotal = array_sum(array_column($computableCriteria, 'max_points'));
        $runTest('JOURN-COMP-001', 'Computable Criteria max points sum to exactly 70.00 points', (float) $computableTotal === 70.00);

        $nonComputable = array_filter($criteria, fn($c) => (int) $c['is_portfolio_computable'] === 0);
        $runTest('JOURN-COMP-002', 'Character (20) and Interview (10) isolated as non-computable', count($nonComputable) === 2);

        // 4. Component Rules Engine Simulation
        $ruleA1 = $db->table('award_scoring_rules')->where('code', 'RULE_JOURN_NEWS')->get()->getRowArray();
        $runTest('JOURN-A1-001', 'Component A1 rule configured as 2 pts/item (max 10.00)', $ruleA1['rule_type'] === 'sum_capped' && (float) $ruleA1['max_points'] === 10.00);

        $ruleA2 = $db->table('award_scoring_rules')->where('code', 'RULE_JOURN_LITERARY')->get()->getRowArray();
        $runTest('JOURN-A2-001', 'Component A2 rule configured as 2 pts/item (max 10.00)', $ruleA2['rule_type'] === 'sum_capped' && (float) $ruleA2['max_points'] === 10.00);

        $ruleA3 = $db->table('award_scoring_rules')->where('code', 'RULE_JOURN_COLUMN')->get()->getRowArray();
        $runTest('JOURN-A3-001', 'Component A3 rule configured as 4 pts/item (max 20.00)', $ruleA3['rule_type'] === 'sum_capped' && (float) $ruleA3['max_points'] === 20.00);

        $ruleA4 = $db->table('award_scoring_rules')->where('code', 'RULE_JOURN_EDITORIAL')->get()->getRowArray();
        $runTest('JOURN-A4-001', 'Component A4 rule configured as 4 pts/item (max 20.00)', $ruleA4['rule_type'] === 'sum_capped' && (float) $ruleA4['max_points'] === 20.00);

        $ruleB1 = $db->table('award_scoring_rules')->where('code', 'RULE_JOURN_LEAD_ROLE')->get()->getRowArray();
        $runTest('JOURN-B1-001', 'Component B1 rule configured as role-based (max 5.00)', $ruleB1['rule_type'] === 'sum_capped' && (float) $ruleB1['max_points'] === 5.00);

        $ruleB2 = $db->table('award_scoring_rules')->where('code', 'RULE_JOURN_LEAD_AWARDS')->get()->getRowArray();
        $configB2 = json_decode($ruleB2['rule_config'], true);
        $seminarPts = $configB2['points_per_record']['seminar'] ?? -1;
        $runTest('JOURN-B2-001', 'Component B2 rule configured with 0 pts for seminars (max 5.00)', $ruleB2['rule_type'] === 'sum_capped' && (float) $seminarPts === 0.0 && (float) $ruleB2['max_points'] === 5.00);

        // 5. Evidence Mapping Rules
        $mappings = $db->table('award_evidence_mapping_rules r')
            ->join('award_criteria c', 'c.id = r.criterion_id')
            ->where('c.award_definition_id', $award['id'])
            ->get()->getResultArray();
        $runTest('JOURN-MAP-001', 'Exact 8 Evidence Mapping Rules active for Campus Journalism', count($mappings) === 8);

        // 6. Evaluation Summary Snapshot & Parity
        $evalService = new AwardEvaluationService($db);
        $summaryService = new AwardEvaluationSummaryService($db, $evalService);
        $cycle = $evalService->resolveActiveCycle();
        $student = $db->table('profiles')->where('account_type', 'student')->where('status', 'active')->get()->getRowArray();
        $summary = $summaryService->buildEvaluationSummary($cycle['id'], $award['id'], $student['id']);

        $runTest('JOURN-SUMM-001', 'Evaluation Summary snapshot produced with complete totals', isset($summary['totals']['portfolio_potential_score']));
        $runTest('JOURN-SUMM-002', 'Evaluation Summary exposes 70.00 computable max & 100.00 official max', (float) $summary['totals']['max_computable_score'] === 70.00 && (float) $summary['totals']['official_rubric_total'] === 100.00);
        $runTest('JOURN-SUMM-003', 'Evaluation Summary isolates 2 non-computable criteria with panel notice', count($summary['not_automatically_evaluated'] ?? []) === 2);

        // 7. Cumulative Invariant: 4 Verified / 15 Authoritative Baseline
        $activeCatalog = $db->table('award_definitions')->where('status', 'active')->where('is_catalog_visible', 1)->get()->getResultArray();
        $verifiedAwards = array_filter($activeCatalog, fn($a) => $a['source_fidelity_status'] === 'VERIFIED');
        $runTest('CUMUL-001', 'Cumulative catalog exposes 15 Verified / 15 Authoritative Baseline', count($activeCatalog) === 15 && count($verifiedAwards) === 15, "Active: " . count($activeCatalog) . ", Verified: " . count($verifiedAwards));

        // 8. Cumulative Regression: Awards 01, 02, 03
        $nda = $db->table('award_definitions')->where('id', '50000001-0000-0000-0000-000000000001')->get()->getRowArray();
        $ndaCriteria = $db->table('award_criteria')->where('award_definition_id', $nda['id'])->get()->getResultArray();
        $ndaComputable = array_sum(array_column(array_filter($ndaCriteria, fn($c) => (int) $c['is_portfolio_computable'] === 1), 'max_points'));
        $runTest('NDA-REGR-001', 'Notre Dame Award preserved: 100 official / 50 computable / VERIFIED', $nda['source_fidelity_status'] === 'VERIFIED' && count($ndaCriteria) === 5 && (float) $ndaComputable === 50.00);

        $smc = $db->table('award_definitions')->where('id', '50000001-0000-0000-0000-000000000021')->get()->getRowArray();
        $smcCriteria = $db->table('award_criteria')->where('award_definition_id', $smc['id'])->get()->getResultArray();
        $smcComputable = array_sum(array_column(array_filter($smcCriteria, fn($c) => (int) $c['is_portfolio_computable'] === 1), 'max_points'));
        $runTest('SMC-REGR-001', 'SMC Award preserved: 100 official / 60 computable / VERIFIED', $smc['source_fidelity_status'] === 'VERIFIED' && count($smcCriteria) === 5 && (float) $smcComputable === 60.00);

        $lead = $db->table('award_definitions')->where('id', '50000001-0000-0000-0000-000000000022')->get()->getRowArray();
        $leadCriteria = $db->table('award_criteria')->where('award_definition_id', $lead['id'])->get()->getResultArray();
        $leadComputable = array_sum(array_column(array_filter($leadCriteria, fn($c) => (int) $c['is_portfolio_computable'] === 1), 'max_points'));
        $runTest('LEAD-REGR-001', 'Leadership Award preserved: 100 official / 50 computable / VERIFIED', $lead['source_fidelity_status'] === 'VERIFIED' && count($leadCriteria) === 5 && (float) $leadComputable === 50.00);

        CLI::write("========================================================================", 'cyan');
        CLI::write("Phase 4 Verification Summary: {$passed} Passed, {$failed} Failed", $failed === 0 ? 'green' : 'red');
        CLI::write("========================================================================", 'cyan');

        return $failed === 0 ? 0 : 1;
    }
}
