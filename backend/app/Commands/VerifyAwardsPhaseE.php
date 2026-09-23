<?php

namespace App\Commands;

use App\Services\AwardEvaluationService;
use App\Services\AwardScoringRuleEngine;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;
use Throwable;

class VerifyAwardsPhaseE extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:awards-phase-e';
    protected $description = 'Validates Phase E Configurable Scoring Engine, Rule Families, and Explainability';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'cyan');
        CLI::write("AchieveNest — Phase E Configurable Scoring Engine & Explainability", 'white');
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

        // 1. Rule Table Population
        $ruleCount = $db->table('award_scoring_rules')->where('is_active', 1)->countAllResults();
        $runTest('RULE-001', 'Scoring rules table populated (>= 40 active rules for v1.0)', $ruleCount >= 40, "Count: {$ruleCount}");

        $engine = new AwardScoringRuleEngine($db);
        $sampleCrit = $db->table('award_criteria')->whereIn('code', ['CRIT_NDA_LEADERSHIP', 'CRIT_LEADERSHIP'])->get()->getRowArray();

        // 2. Rule Family: sum_capped
        $evSetSum = [
            ['portfolio_record_id' => 'rec-1', 'title' => 'SSG Officer', 'points_per_record' => 15.0],
            ['portfolio_record_id' => 'rec-2', 'title' => 'Club President', 'points_per_record' => 15.0],
            ['portfolio_record_id' => 'rec-3', 'title' => 'Council Rep', 'points_per_record' => 15.0],
        ]; // 15 + 15 + 15 = 45 -> capped at max_points (35)
        $resSum = $engine->evaluateCriterionScore($sampleCrit, $evSetSum);
        $runTest('FAMILY-001', 'sum_capped rule accumulates points and caps correctly (35.00/35.00)', $resSum['awarded_points'] === 35.0 && count($resSum['selected_evidence']) >= 2);

        // 3. Rule Family: highest_only (Simulated via rule update on sample criterion)
        $db->table('award_scoring_rules')->where('criterion_id', $sampleCrit['id'])->update(['rule_type' => 'highest_only', 'points' => 20.0]);
        $resHighest = $engine->evaluateCriterionScore($sampleCrit, $evSetSum);
        $runTest('FAMILY-002', 'highest_only rule selects single highest evidence and excludes lower', $resHighest['awarded_points'] === 20.0 && count($resHighest['selected_evidence']) === 1 && count($resHighest['excluded_evidence']) === 2);

        // 4. Rule Family: fixed_presence
        $db->table('award_scoring_rules')->where('criterion_id', $sampleCrit['id'])->update(['rule_type' => 'fixed_presence', 'points' => 10.0]);
        $resFixed = $engine->evaluateCriterionScore($sampleCrit, $evSetSum);
        $runTest('FAMILY-003', 'fixed_presence rule awards fixed point upon presence', $resFixed['awarded_points'] === 10.0 && count($resFixed['selected_evidence']) === 1);

        // Restore sum_capped
        $db->table('award_scoring_rules')->where('criterion_id', $sampleCrit['id'])->update(['rule_type' => 'sum_capped', 'points' => 15.0]);

        // 5. Explainability Payload
        $hasExplainability = isset($resSum['rule_code']) && isset($resSum['authority_status']) && isset($resSum['pre_cap_points']) && isset($resSum['cap_adjustment']);
        $runTest('EXPLAIN-001', 'Scoring engine produces comprehensive explainability payload', $hasExplainability);

        // 6. Non-Computable Criteria
        $nonCompCrit = [
            'id'                     => 'test-crit-noncomp-001',
            'code'                   => 'CRIT_PANEL_INTERVIEW',
            'name'                   => 'Panel Interview',
            'max_points'             => 20.0,
            'is_portfolio_computable'=> 0,
        ];
        $resNonComp = $engine->evaluateCriterionScore($nonCompCrit, $evSetSum);
        $runTest('COMP-001', 'Non-computable criteria marked Not Automatically Evaluated', $resNonComp['is_computable'] === false && $resNonComp['awarded_points'] === 0.0);

        // 7. Service Compatibility
        try {
            $awardService = new AwardEvaluationService($db);
            $cycle = $awardService->resolveActiveCycle();
            $award = $db->table('award_definitions')->whereIn('code', ['NOTRE_DAME_AWARD', 'MOST_OUTSTANDING_STUDENT'])->get()->getRowArray();
            $student = $db->table('profiles')->where('account_type', 'student')->where('status', 'active')->get()->getRowArray();

            $evalRes = $awardService->evaluateStudentAward($cycle['id'], $award['id'], $student['id']);
            $runTest('SRV-001', 'AwardEvaluationService executes evaluation compatibly', isset($evalRes['potential_percent']));
        } catch (Throwable $e) {
            $runTest('SRV-001', 'AwardEvaluationService executes evaluation compatibly', false, $e->getMessage());
        }

        // 8. Integrity
        $orphanedRules = $db->table('award_scoring_rules asr')
            ->join('award_scoring_model_versions asmv', 'asmv.id = asr.scoring_model_version_id', 'left')
            ->where('asmv.id IS NULL')
            ->countAllResults();
        $runTest('INV-001', '0 orphaned scoring rules without active scoring model version', $orphanedRules === 0);

        CLI::write("========================================================================", 'cyan');
        CLI::write("Phase E Verification Summary: {$passed} Passed, {$failed} Failed", $failed === 0 ? 'green' : 'red');
        CLI::write("========================================================================", 'cyan');

        return $failed === 0 ? 0 : 1;
    }
}
