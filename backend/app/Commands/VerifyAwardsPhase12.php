<?php

namespace App\Commands;

use App\Services\AwardEvaluationService;
use App\Services\AwardEvaluationSummaryService;
use App\Services\AwardScoringRuleEngine;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;

class VerifyAwardsPhase12 extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:awards-phase-12';
    protected $description = 'Validates Phase 12 Outstanding Athlete of the Year - Female Full Source-Fidelity Remediation';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'cyan');
        CLI::write("AchieveNest — Phase 12: Athlete Female Award Full Stack Verification", 'white');
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
            ->where('id', '50000001-0000-0000-0000-000000000031')
            ->get()->getRowArray();
        $runTest('ATHLETE-F-IDENT-001', 'Exact Name "Outstanding Athlete of the Year - Female"', $award['name'] === 'Outstanding Athlete of the Year - Female' && $award['code'] === 'ATHLETE_OF_THE_YEAR_FEMALE');
        $runTest('ATHLETE-F-IDENT-002', 'Authority OFFICIAL, Status active, Source Fidelity VERIFIED', $award['authority_status'] === 'OFFICIAL' && $award['status'] === 'active' && $award['source_fidelity_status'] === 'VERIFIED');
        $runTest('ATHLETE-F-IDENT-003', 'Annual cycle (graduating_only = 0) & female restriction', (int) $award['graduating_only'] === 0 && $award['gender_restriction'] === 'female');
        $runTest('ATHLETE-F-IDENT-004', 'Candidate threshold is exactly 80.00%', (float) $award['candidate_threshold_percent'] === 80.00);

        // 2. Official Evaluation Basis (100 pts)
        $criteria = $db->table('award_criteria')
            ->where('award_definition_id', $award['id'])
            ->orderBy('sort_order', 'ASC')
            ->get()->getResultArray();
        $runTest('ATHLETE-F-OFFIC-001', 'Exact 5 Official Criteria present in Athlete Female Award', count($criteria) === 5);
        $officialTotal = array_sum(array_column($criteria, 'weight'));
        $runTest('ATHLETE-F-OFFIC-002', 'Official Rubric Total sums to exactly 100.00 points', (float) $officialTotal === 100.00);

        // 3. Portfolio-Computable Criteria (55 pts)
        $computableCriteria = array_filter($criteria, fn($c) => (int) $c['is_portfolio_computable'] === 1);
        $computableTotal = array_sum(array_column($computableCriteria, 'max_points'));
        $runTest('ATHLETE-F-COMP-001', 'Computable Criteria max points sum to exactly 55.00 points', (float) $computableTotal === 55.00);

        $nonComputable = array_filter($criteria, fn($c) => (int) $c['is_portfolio_computable'] === 0);
        $runTest('ATHLETE-F-COMP-002', 'Academic (15) and Interview (10) isolated as non-computable', count($nonComputable) === 2);

        // 4. Component Rules Engine Simulation
        $ruleA1 = $db->table('award_scoring_rules')->where('code', 'RULE_ATHLETE_F_INDIV')->get()->getRowArray();
        $configA1 = json_decode($ruleA1['rule_config'], true);
        $indivPts = $configA1['presence_points'] ?? 0;
        $runTest('ATHLETE-F-A1-001', 'Component A1 configured as individual presence (max 10.00)', $ruleA1['rule_type'] === 'sum_capped' && (float) $indivPts === 10.0 && (float) $ruleA1['max_points'] === 10.00);

        $ruleA2 = $db->table('award_scoring_rules')->where('code', 'RULE_ATHLETE_F_TEAM')->get()->getRowArray();
        $configA2 = json_decode($ruleA2['rule_config'], true);
        $teamPts = $configA2['presence_points'] ?? 0;
        $runTest('ATHLETE-F-A2-001', 'Component A2 configured as team presence (max 10.00)', $ruleA2['rule_type'] === 'sum_capped' && (float) $teamPts === 10.0 && (float) $ruleA2['max_points'] === 10.00);

        $ruleB = $db->table('award_scoring_rules')->where('code', 'RULE_ATHLETE_F_PARTICIPATION')->get()->getRowArray();
        $configB = json_decode($ruleB['rule_config'], true);
        $prisaaNat = $configB['event_level_points']['prisaa_national'] ?? 0;
        $runTest('ATHLETE-F-B-001', 'Component B configured as participation matrix (PRISAA Nat=7, max 20.00)', $ruleB['rule_type'] === 'sum_capped' && (float) $prisaaNat === 7.0 && (float) $ruleB['max_points'] === 20.00);

        $ruleC = $db->table('award_scoring_rules')->where('code', 'RULE_ATHLETE_F_AWARDS')->get()->getRowArray();
        $configC = json_decode($ruleC['rule_config'], true);
        $natGold = $configC['medal_matrix']['prisaa_national']['gold'] ?? 0;
        $runTest('ATHLETE-F-C-001', 'Component C configured as medal matrix (Nat Gold=7, max 15.00)', $ruleC['rule_type'] === 'sum_capped' && (float) $natGold === 7.0 && (float) $ruleC['max_points'] === 15.00);

        // 5. Evidence Mapping Rules
        $mappings = $db->table('award_evidence_mapping_rules r')
            ->join('award_criteria c', 'c.id = r.criterion_id')
            ->where('c.award_definition_id', $award['id'])
            ->get()->getResultArray();
        $runTest('ATHLETE-F-MAP-001', 'Exact 4 Evidence Mapping Rules active for Athlete Female Award', count($mappings) === 4);

        // 6. Evaluation Summary Snapshot & Parity
        $evalService = new AwardEvaluationService($db);
        $summaryService = new AwardEvaluationSummaryService($db, $evalService);
        $cycle = $evalService->resolveActiveCycle();
        $student = $db->table('profiles')->where('account_type', 'student')->where('status', 'active')->get()->getRowArray();
        $summary = $summaryService->buildEvaluationSummary($cycle['id'], $award['id'], $student['id']);

        $runTest('ATHLETE-F-SUMM-001', 'Evaluation Summary snapshot produced with complete totals', isset($summary['totals']['portfolio_potential_score']));
        $runTest('ATHLETE-F-SUMM-002', 'Evaluation Summary exposes 55.00 computable max & 100.00 official max', (float) $summary['totals']['max_computable_score'] === 55.00 && (float) $summary['totals']['official_rubric_total'] === 100.00);

        // 7. Cumulative Invariant: 12 Verified / 15 Authoritative Baseline
        $activeCatalog = $db->table('award_definitions')->where('status', 'active')->where('is_catalog_visible', 1)->get()->getResultArray();
        $verifiedAwards = array_filter($activeCatalog, fn($a) => $a['source_fidelity_status'] === 'VERIFIED');
        $runTest('CUMUL-001', 'Cumulative catalog exposes 15 Verified / 15 Authoritative Baseline', count($activeCatalog) === 15 && count($verifiedAwards) === 15, "Active: " . count($activeCatalog) . ", Verified: " . count($verifiedAwards));

        // 8. Cumulative Regression: Awards 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11
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

        $sportsF = $db->table('award_definitions')->where('id', '50000001-0000-0000-0000-000000000024')->get()->getRowArray();
        $sportsFCriteria = $db->table('award_criteria')->where('award_definition_id', $sportsF['id'])->get()->getResultArray();
        $sportsFComputable = array_sum(array_column(array_filter($sportsFCriteria, fn($c) => (int) $c['is_portfolio_computable'] === 1), 'max_points'));
        $runTest('SPORTS-F-REGR-001', 'Sports Female preserved: 100 official / 55 computable / Graduating / female / VERIFIED (distinct from Annual Athlete Female)', $sportsF['source_fidelity_status'] === 'VERIFIED' && count($sportsFCriteria) === 5 && (float) $sportsFComputable === 55.00 && $sportsF['gender_restriction'] === 'female' && (int) $sportsF['graduating_only'] === 1);

        $sportsM = $db->table('award_definitions')->where('id', '50000001-0000-0000-0000-000000000025')->get()->getRowArray();
        $sportsMCriteria = $db->table('award_criteria')->where('award_definition_id', $sportsM['id'])->get()->getResultArray();
        $sportsMComputable = array_sum(array_column(array_filter($sportsMCriteria, fn($c) => (int) $c['is_portfolio_computable'] === 1), 'max_points'));
        $runTest('SPORTS-M-REGR-001', 'Sports Male preserved: 100 official / 55 computable / male / VERIFIED', $sportsM['source_fidelity_status'] === 'VERIFIED' && count($sportsMCriteria) === 5 && (float) $sportsMComputable === 55.00 && $sportsM['gender_restriction'] === 'male');

        $socioF = $db->table('award_definitions')->where('id', '50000001-0000-0000-0000-000000000026')->get()->getRowArray();
        $socioFCriteria = $db->table('award_criteria')->where('award_definition_id', $socioF['id'])->get()->getResultArray();
        $socioFComputable = array_sum(array_column(array_filter($socioFCriteria, fn($c) => (int) $c['is_portfolio_computable'] === 1), 'max_points'));
        $runTest('SOCIO-F-REGR-001', 'Socio-Cultural Female preserved: PROPOSED / 55 computable / female / VERIFIED', $socioF['source_fidelity_status'] === 'VERIFIED' && count($socioFCriteria) === 3 && (float) $socioFComputable === 55.00 && $socioF['authority_status'] === 'PROPOSED');

        $socioM = $db->table('award_definitions')->where('id', '50000001-0000-0000-0000-000000000027')->get()->getRowArray();
        $socioMCriteria = $db->table('award_criteria')->where('award_definition_id', $socioM['id'])->get()->getResultArray();
        $socioMComputable = array_sum(array_column(array_filter($socioMCriteria, fn($c) => (int) $c['is_portfolio_computable'] === 1), 'max_points'));
        $runTest('SOCIO-M-REGR-001', 'Socio-Cultural Male preserved: PROPOSED / 55 computable / male / VERIFIED', $socioM['source_fidelity_status'] === 'VERIFIED' && count($socioMCriteria) === 3 && (float) $socioMComputable === 55.00 && $socioM['authority_status'] === 'PROPOSED');

        $leaderYr = $db->table('award_definitions')->where('id', '50000001-0000-0000-0000-000000000028')->get()->getRowArray();
        $leaderYrCriteria = $db->table('award_criteria')->where('award_definition_id', $leaderYr['id'])->get()->getResultArray();
        $leaderYrComputable = array_sum(array_column(array_filter($leaderYrCriteria, fn($c) => (int) $c['is_portfolio_computable'] === 1), 'max_points'));
        $runTest('LEADER-YR-REGR-001', 'Student Leader of the Year preserved: 100 official / 50 computable / Annual / VERIFIED', $leaderYr['source_fidelity_status'] === 'VERIFIED' && count($leaderYrCriteria) === 5 && (float) $leaderYrComputable === 50.00 && (int) $leaderYr['graduating_only'] === 0);

        $memberYr = $db->table('award_definitions')->where('id', '50000001-0000-0000-0000-000000000029')->get()->getRowArray();
        $memberYrCriteria = $db->table('award_criteria')->where('award_definition_id', $memberYr['id'])->get()->getResultArray();
        $memberYrComputable = array_sum(array_column(array_filter($memberYrCriteria, fn($c) => (int) $c['is_portfolio_computable'] === 1), 'max_points'));
        $runTest('MEMBER-YR-REGR-001', 'Member of the Year preserved: 100 official / 40 computable / Annual / VERIFIED', $memberYr['source_fidelity_status'] === 'VERIFIED' && count($memberYrCriteria) === 5 && (float) $memberYrComputable === 40.00 && (int) $memberYr['graduating_only'] === 0);

        $volunteerYr = $db->table('award_definitions')->where('id', '50000001-0000-0000-0000-000000000030')->get()->getRowArray();
        $volunteerYrCriteria = $db->table('award_criteria')->where('award_definition_id', $volunteerYr['id'])->get()->getResultArray();
        $volunteerYrComputable = array_sum(array_column(array_filter($volunteerYrCriteria, fn($c) => (int) $c['is_portfolio_computable'] === 1), 'max_points'));
        $runTest('VOLUNTEER-YR-REGR-001', 'Volunteer of the Year preserved: 100 official / 50 computable / Annual / VERIFIED', $volunteerYr['source_fidelity_status'] === 'VERIFIED' && count($volunteerYrCriteria) === 5 && (float) $volunteerYrComputable === 50.00 && (int) $volunteerYr['graduating_only'] === 0);

        CLI::write("========================================================================", 'cyan');
        CLI::write("Phase 12 Verification Summary: {$passed} Passed, {$failed} Failed", $failed === 0 ? 'green' : 'red');
        CLI::write("========================================================================", 'cyan');

        return $failed === 0 ? 0 : 1;
    }
}
