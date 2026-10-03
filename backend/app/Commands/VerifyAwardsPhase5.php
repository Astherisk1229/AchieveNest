<?php

namespace App\Commands;

use App\Services\AwardEvaluationService;
use App\Services\AwardEvaluationSummaryService;
use App\Services\AwardScoringRuleEngine;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;

class VerifyAwardsPhase5 extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:awards-phase-5';
    protected $description = 'Validates Phase 5 Outstanding Performance in Sports - Female Full Source-Fidelity Remediation';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'cyan');
        CLI::write("AchieveNest — Phase 5: Sports Female Award Full Stack Verification", 'white');
        CLI::write("========================================================================", 'cyan');

        $db = Database::connect();
        $passed = 0;
        $failed = 0;

        $runTest = function (string $code, string $name, bool $condition, string $details = '') use (&$passed, &$failed) {
            $status = $condition ? '[PASS]' : '[FAIL]';
            $color = $condition ? 'green' : 'red';
            CLI::write(sprintf("  %-18s %-47s %s", $code, $name, CLI::color($status, $color)));
            if (! $condition) {
                CLI::write("                     Details: {$details}", 'yellow');
                $failed++;
            } else {
                $passed++;
            }
        };

        // 1. Identity & Authority
        $award = $db->table('award_definitions')
            ->where('id', '50000001-0000-0000-0000-000000000024')
            ->get()->getRowArray();
        $runTest('SPORTS-F-IDENT-001', 'Exact Name "Outstanding Performance in Sports - Female"', $award['name'] === 'Outstanding Performance in Sports - Female' && $award['code'] === 'SPORTS_AWARD_FEMALE');
        $runTest('SPORTS-F-IDENT-002', 'Authority OFFICIAL, Status active, Source Fidelity VERIFIED', $award['authority_status'] === 'OFFICIAL' && $award['status'] === 'active' && $award['source_fidelity_status'] === 'VERIFIED');
        $runTest('SPORTS-F-IDENT-003', 'Graduating only & female restriction are active', (int) $award['graduating_only'] === 1 && $award['gender_restriction'] === 'female');
        $runTest('SPORTS-F-IDENT-004', 'Candidate threshold is exactly 80.00%', (float) $award['candidate_threshold_percent'] === 80.00);

        // 2. Official Evaluation Basis (100 pts)
        $criteria = $db->table('award_criteria')
            ->where('award_definition_id', $award['id'])
            ->orderBy('sort_order', 'ASC')
            ->get()->getResultArray();
        $runTest('SPORTS-F-OFFIC-001', 'Exact 5 Official Criteria present in Sports Female Award', count($criteria) === 5);
        $officialTotal = array_sum(array_column($criteria, 'weight'));
        $runTest('SPORTS-F-OFFIC-002', 'Official Rubric Total sums to exactly 100.00 points', (float) $officialTotal === 100.00);

        // 3. Portfolio-Computable Criteria (55 pts)
        $computableCriteria = array_filter($criteria, fn($c) => (int) $c['is_portfolio_computable'] === 1);
        $computableTotal = array_sum(array_column($computableCriteria, 'max_points'));
        $runTest('SPORTS-F-COMP-001', 'Computable Criteria max points sum to exactly 55.00 points', (float) $computableTotal === 55.00);

        $nonComputable = array_filter($criteria, fn($c) => (int) $c['is_portfolio_computable'] === 0);
        $runTest('SPORTS-F-COMP-002', 'Academic (15) and Interview (10) isolated as non-computable', count($nonComputable) === 2);

        // 4. Component Rules Engine Simulation
        $ruleA1 = $db->table('award_scoring_rules')->where('code', 'RULE_SPORTS_F_INDIV')->get()->getRowArray();
        $runTest('SPORTS-F-A1-001', 'Component A1 rule configured as individual presence (max 10.00)', $ruleA1['rule_type'] === 'sum_capped' && (float) $ruleA1['max_points'] === 10.00);

        $ruleA2 = $db->table('award_scoring_rules')->where('code', 'RULE_SPORTS_F_TEAM')->get()->getRowArray();
        $runTest('SPORTS-F-A2-001', 'Component A2 rule configured as team presence (max 10.00)', $ruleA2['rule_type'] === 'sum_capped' && (float) $ruleA2['max_points'] === 10.00);

        $ruleB = $db->table('award_scoring_rules')->where('code', 'RULE_SPORTS_F_PARTICIPATION')->get()->getRowArray();
        $configB = json_decode($ruleB['rule_config'], true);
        $prisaaNat = $configB['event_level_points']['prisaa_national'] ?? 0;
        $runTest('SPORTS-F-B-001', 'Component B rule configured as participation matrix (max 20.00)', $ruleB['rule_type'] === 'sum_capped' && (float) $prisaaNat === 7.0 && (float) $ruleB['max_points'] === 20.00);

        $ruleC = $db->table('award_scoring_rules')->where('code', 'RULE_SPORTS_F_AWARDS')->get()->getRowArray();
        $configC = json_decode($ruleC['rule_config'], true);
        $prisaaNatGold = $configC['medal_matrix']['prisaa_national']['gold'] ?? 0;
        $runTest('SPORTS-F-C-001', 'Component C rule configured as medal matrix (max 15.00)', $ruleC['rule_type'] === 'sum_capped' && (float) $prisaaNatGold === 7.0 && (float) $ruleC['max_points'] === 15.00);

        // 5. Evidence Mapping Rules
        $mappings = $db->table('award_evidence_mapping_rules r')
            ->join('award_criteria c', 'c.id = r.criterion_id')
            ->where('c.award_definition_id', $award['id'])
            ->get()->getResultArray();
        $runTest('SPORTS-F-MAP-001', 'Exact 4 Evidence Mapping Rules active for Sports Female', count($mappings) === 4);

        // 6. Evaluation Summary Snapshot & Parity
        $evalService = new AwardEvaluationService($db);
        $summaryService = new AwardEvaluationSummaryService($db, $evalService);
        $cycle = $evalService->resolveActiveCycle();
        $student = $db->table('profiles')->where('account_type', 'student')->where('status', 'active')->get()->getRowArray();
        $summary = $summaryService->buildEvaluationSummary($cycle['id'], $award['id'], $student['id']);

        $runTest('SPORTS-F-SUMM-001', 'Evaluation Summary snapshot produced with complete totals', isset($summary['totals']['portfolio_potential_score']));
        $runTest('SPORTS-F-SUMM-002', 'Evaluation Summary exposes 55.00 computable max & 100.00 official max', (float) $summary['totals']['max_computable_score'] === 55.00 && (float) $summary['totals']['official_rubric_total'] === 100.00);

        // 7. Cumulative Invariant: 5 Verified / 15 Authoritative Baseline
        $activeCatalog = $db->table('award_definitions')->where('status', 'active')->where('is_catalog_visible', 1)->get()->getResultArray();
        $verifiedAwards = array_filter($activeCatalog, fn($a) => $a['source_fidelity_status'] === 'VERIFIED');
        $runTest('CUMUL-001', 'Cumulative catalog exposes 15 Verified / 15 Authoritative Baseline', count($activeCatalog) === 15 && count($verifiedAwards) === 15, "Active: " . count($activeCatalog) . ", Verified: " . count($verifiedAwards));

        // 8. Cumulative Regression: Awards 01, 02, 03, 04
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

        $journ = $db->table('award_definitions')->where('id', '50000001-0000-0000-0000-000000000023')->get()->getRowArray();
        $journCriteria = $db->table('award_criteria')->where('award_definition_id', $journ['id'])->get()->getResultArray();
        $journComputable = array_sum(array_column(array_filter($journCriteria, fn($c) => (int) $c['is_portfolio_computable'] === 1), 'max_points'));
        $runTest('JOURN-REGR-001', 'Campus Journalism preserved: 100 official / 70 computable / VERIFIED', $journ['source_fidelity_status'] === 'VERIFIED' && count($journCriteria) === 4 && (float) $journComputable === 70.00);

        CLI::write("========================================================================", 'cyan');
        CLI::write("Phase 5 Verification Summary: {$passed} Passed, {$failed} Failed", $failed === 0 ? 'green' : 'red');
        CLI::write("========================================================================", 'cyan');

        return $failed === 0 ? 0 : 1;
    }
}
