<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class InspectAwardRuleMap extends BaseCommand
{
    protected $group       = 'Audit';
    protected $name        = 'audit:rule-map';
    protected $description = 'Inspects and audits the complete developer-ready award rule map for SA-01.7.';

    public function run(array $params)
    {
        $db = \Config\Database::connect();

        CLI::write("========================================================================================", 'cyan');
        CLI::write("SA-01.7: DEVELOPER-READY AWARD SCORING RULE MAP AUDIT", 'cyan');
        CLI::write("========================================================================================", 'cyan');

        $activeAwards = $db->table('award_definitions')
            ->where('is_catalog_visible', 1)
            ->where('status', 'active')
            ->orderBy('code', 'ASC')
            ->get()->getResultArray();

        $ruleMap = [];
        $totalAwardCount = count($activeAwards);
        $totalRouteCount = 0;

        foreach ($activeAwards as $award) {
            $criteria = $db->table('award_criteria')
                ->where('award_definition_id', $award['id'])
                ->orderBy('sort_order', 'ASC')
                ->get()->getResultArray();

            CLI::write(sprintf("\n=== [%s] %s ===", $award['code'], $award['name']), 'magenta');

            $awardCalculatedAutoMax = 0;

            foreach ($criteria as $crit) {
                $isComputable = isset($crit['is_portfolio_computable']) ? ((int)$crit['is_portfolio_computable'] === 1) : true;
                $critMax = (float)$crit['max_points'];

                if ($isComputable) {
                    $awardCalculatedAutoMax += $critMax;
                }

                $components = $db->table('award_criterion_components')
                    ->where('criterion_id', $crit['id'])
                    ->orderBy('sort_order', 'ASC')
                    ->get()->getResultArray();

                $scoringRules = $db->table('award_scoring_rules')
                    ->where('criterion_id', $crit['id'])
                    ->get()->getResultArray();

                if (empty($components)) {
                    $compList = [[
                        'id' => null,
                        'code' => 'NONE',
                        'name' => 'Single Unified Criterion',
                        'max_points' => $critMax
                    ]];
                } else {
                    $compList = $components;
                }

                foreach ($compList as $comp) {
                    $totalRouteCount++;
                    $compMax = (float)$comp['max_points'];

                    // Match scoring rule
                    $matchedRule = null;
                    foreach ($scoringRules as $sr) {
                        if (!empty($sr['criterion_component_id']) && $sr['criterion_component_id'] === $comp['id']) {
                            $matchedRule = $sr;
                            break;
                        }
                    }
                    if (!$matchedRule && !empty($scoringRules)) {
                        $matchedRule = $scoringRules[0];
                    }

                    $ruleType = $matchedRule['rule_type'] ?? ($isComputable ? 'sum_capped' : 'manual');
                    $ruleConfig = !empty($matchedRule['rule_config']) ? json_decode($matchedRule['rule_config'], true) : [];

                    $pointsDesc = 'N/A';
                    $countLimit = 'N/A';
                    $highestOnly = 'No';

                    if (!$isComputable) {
                        $countingRule = 'MANUAL';
                        $pointsDesc = 'Evaluator Scored';
                    } elseif ($ruleType === 'highest_only') {
                        $countingRule = 'HIGHEST_ONLY';
                        $highestOnly = 'Yes';
                        $pointsDesc = !empty($ruleConfig['points_matrix']) ? json_encode($ruleConfig['points_matrix']) : "Max {$compMax} pts";
                    } elseif ($ruleType === 'count_mapping' || $ruleType === 'count_limited') {
                        $countingRule = 'COUNT_LIMITED';
                        $pts = $ruleConfig['points_per_item'] ?? ($matchedRule['points'] ?? 2.0);
                        $maxItems = $ruleConfig['max_items'] ?? (int)($compMax / $pts);
                        $countLimit = (string)$maxItems;
                        $pointsDesc = "{$pts} pts/item (max {$maxItems})";
                    } elseif ($ruleType === 'matrix_mapping' || $ruleType === 'tiered') {
                        $countingRule = 'TIERED';
                        $pointsDesc = !empty($ruleConfig['placement_matrix']) ? json_encode($ruleConfig['placement_matrix']) : (!empty($ruleConfig['points_matrix']) ? json_encode($ruleConfig['points_matrix']) : "Tiered up to {$compMax} pts");
                    } else {
                        $countingRule = 'ACCUMULATIVE';
                        $pts = $matchedRule['points'] ?? 5.0;
                        $pointsDesc = "{$pts} pts/item (capped at {$compMax})";
                    }

                    $routeEntry = [
                        'award_code' => $award['code'],
                        'award_name' => $award['name'],
                        'criterion_code' => $crit['code'],
                        'criterion_name' => $crit['name'],
                        'subsection_code' => $comp['code'],
                        'subsection_name' => $comp['name'],
                        'is_computable' => $isComputable,
                        'point_rule' => $pointsDesc,
                        'counting_rule' => $countingRule,
                        'highest_only' => $highestOnly,
                        'count_limit' => $countLimit,
                        'subsection_cap' => $compMax,
                        'criterion_cap' => $critMax,
                        'duplicate_rule' => 'COUNT_ONCE_PER_RECORD',
                        'max_contribution' => $compMax
                    ];

                    $ruleMap[] = $routeEntry;

                    CLI::write(sprintf(
                        "  [%s] %s | Sub: [%s] | Rule: %-14s | HighOnly: %-3s | SubCap: %5.2f | CritCap: %5.2f",
                        $crit['code'],
                        $crit['name'],
                        $comp['code'],
                        $countingRule,
                        $highestOnly,
                        $compMax,
                        $critMax
                    ), $isComputable ? 'cyan' : 'light_gray');
                }
            }

            CLI::write(sprintf("  -> Total Auto-Computable Route Ceiling: %.2f pts", $awardCalculatedAutoMax), 'green');
        }

        // Save detailed JSON dump
        file_put_contents(
            WRITEPATH . 'award_rule_map_dump.json',
            json_encode($ruleMap, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
        CLI::write("\nDeveloper-Ready Rule Map JSON dump saved to: " . WRITEPATH . 'award_rule_map_dump.json', 'yellow');
    }
}
