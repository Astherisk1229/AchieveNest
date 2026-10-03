<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class InspectAwardCriteriaMatrix extends BaseCommand
{
    protected $group       = 'Audit';
    protected $name        = 'audit:criteria-matrix';
    protected $description = 'Inventories all criteria, subsections, accumulation rules, caps, and scoring behavior for SA-01.2.';

    public function run(array $params)
    {
        $db = \Config\Database::connect();

        $activeAwards = $db->table('award_definitions')
            ->where('is_catalog_visible', 1)
            ->where('status', 'active')
            ->orderBy('code', 'ASC')
            ->get()->getResultArray();

        CLI::write("========================================================================================", 'cyan');
        CLI::write("SA-01.2: AWARD CRITERION & SUBSECTION MATRIX AUDIT", 'cyan');
        CLI::write("Active Awards Analyzed: " . count($activeAwards), 'yellow');
        CLI::write("========================================================================================", 'cyan');

        $fullMatrix = [];

        foreach ($activeAwards as $award) {
            $criteria = $db->table('award_criteria')
                ->where('award_definition_id', $award['id'])
                ->orderBy('sort_order', 'ASC')
                ->get()->getResultArray();

            $awardAutoTotal = 0;
            $awardManualTotal = 0;
            $critList = [];

            foreach ($criteria as $crit) {
                $isComputable = isset($crit['is_portfolio_computable']) ? ((int)$crit['is_portfolio_computable'] === 1) : true;
                $critMax = (float)$crit['max_points'];

                if ($isComputable) {
                    $awardAutoTotal += $critMax;
                } else {
                    $awardManualTotal += $critMax;
                }

                // Components / Subsections
                $components = $db->table('award_criterion_components')
                    ->where('criterion_id', $crit['id'])
                    ->orderBy('sort_order', 'ASC')
                    ->get()->getResultArray();

                // Scoring rules
                $scoringRules = $db->table('award_scoring_rules')
                    ->where('criterion_id', $crit['id'])
                    ->orderBy('sort_order', 'ASC')
                    ->get()->getResultArray();

                $subsections = [];

                if (empty($components)) {
                    // Single criterion without subsections
                    $subsections[] = [
                        'subsection_code' => 'NONE',
                        'subsection_name' => 'Single Unified Criterion',
                        'max_points' => $critMax,
                        'is_computable' => $isComputable,
                        'behavior' => $isComputable ? 'ACCUMULATIVE' : 'MANUAL',
                        'highest_only' => false,
                        'points_per_item' => null,
                        'count_cap' => null,
                        'subsection_cap' => $critMax,
                        'criterion_cap' => $critMax,
                        'prerequisite' => 'Active verified portfolio record',
                        'authority_status' => $crit['authority_status'] ?? 'OFFICIAL',
                    ];
                } else {
                    foreach ($components as $comp) {
                        $compMax = (float)$comp['max_points'];
                        $compCode = $comp['code'];

                        // Inspect scoring rule matching this component if exists
                        $matchingRule = null;
                        foreach ($scoringRules as $sr) {
                            if (strpos($sr['code'], substr($compCode, 5)) !== false || strpos($compCode, substr($sr['code'], 5)) !== false) {
                                $matchingRule = $sr;
                                break;
                            }
                        }

                        $ruleType = $matchingRule['rule_type'] ?? 'sum_capped';
                        $behavior = 'ACCUMULATIVE';
                        $highestOnly = false;
                        if ($ruleType === 'highest_only') {
                            $behavior = 'HIGHEST_ONLY';
                            $highestOnly = true;
                        } elseif ($ruleType === 'count_mapping' || $ruleType === 'count_limited') {
                            $behavior = 'COUNT_LIMITED';
                        } elseif ($ruleType === 'matrix_mapping') {
                            $behavior = 'TIERED';
                        } elseif ($ruleType === 'fixed_presence') {
                            $behavior = 'FIXED_ONCE';
                        }

                        $subsections[] = [
                            'subsection_code' => $comp['code'],
                            'subsection_name' => $comp['name'],
                            'description' => $comp['description'] ?? '',
                            'max_points' => $compMax,
                            'is_computable' => (int)($comp['is_computable'] ?? 1) === 1,
                            'behavior' => $behavior,
                            'highest_only' => $highestOnly,
                            'points_per_item' => $matchingRule['points'] ?? null,
                            'count_cap' => null,
                            'subsection_cap' => $compMax,
                            'criterion_cap' => $critMax,
                            'prerequisite' => 'Active verified portfolio record in supporting category',
                            'authority_status' => $comp['authority_status'] ?? 'OFFICIAL',
                        ];
                    }
                }

                $critList[] = [
                    'criterion_id' => $crit['id'],
                    'criterion_code' => $crit['code'],
                    'criterion_name' => $crit['name'],
                    'criterion_type' => $isComputable ? 'AUTOMATIC' : 'MANUAL',
                    'is_computable' => $isComputable,
                    'max_points' => $critMax,
                    'authority_status' => $crit['authority_status'] ?? 'OFFICIAL',
                    'subsections' => $subsections
                ];
            }

            $fullMatrix[] = [
                'award_id' => $award['id'],
                'award_code' => $award['code'],
                'award_name' => $award['name'],
                'award_scope' => $award['award_scope'] ?? 'university',
                'graduating_only' => (int)($award['graduating_only'] ?? 0),
                'gender_restriction' => $award['gender_restriction'] ?? null,
                'total_rubric_max' => (float)$awardAutoTotal + (float)$awardManualTotal,
                'auto_computable_max' => (float)$awardAutoTotal,
                'manual_max' => (float)$awardManualTotal,
                'criteria' => $critList
            ];

            CLI::write(sprintf(
                "[%s] %s | Rubric: %.2f | AutoMax: %.2f | Manual: %.2f | Criteria: %d",
                $award['code'],
                $award['name'],
                (float)$awardAutoTotal + (float)$awardManualTotal,
                $awardAutoTotal,
                $awardManualTotal,
                count($critList)
            ), 'green');

            foreach ($critList as $cl) {
                CLI::write(sprintf(
                    "  -> [%s] %s (Type: %s, Max: %.2f)",
                    $cl['criterion_code'],
                    $cl['criterion_name'],
                    $cl['criterion_type'],
                    $cl['max_points']
                ), $cl['is_computable'] ? 'cyan' : 'yellow');

                foreach ($cl['subsections'] as $sub) {
                    CLI::write(sprintf(
                        "     - [%s] %s (Max: %.2f, Behavior: %s, Cap: %.2f)",
                        $sub['subsection_code'],
                        $sub['subsection_name'],
                        $sub['max_points'],
                        $sub['behavior'],
                        $sub['subsection_cap']
                    ), 'light_gray');
                }
            }
            CLI::write("----------------------------------------------------------------------------------------");
        }

        // Save detailed JSON dump
        file_put_contents(
            WRITEPATH . 'award_criteria_matrix_dump.json',
            json_encode($fullMatrix, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
        CLI::write("Criteria Matrix JSON dump saved to: " . WRITEPATH . 'award_criteria_matrix_dump.json', 'yellow');
    }
}
