<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class InspectAwardMasterInventory extends BaseCommand
{
    protected $group       = 'Audit';
    protected $name        = 'audit:awards-inventory';
    protected $description = 'Inspects all award definitions, criteria, scoring models, and eligibility gates.';

    public function run(array $params)
    {
        $db = \Config\Database::connect();
        $awards = $db->table('award_definitions')->orderBy('code', 'ASC')->get()->getResultArray();

        CLI::write("========================================================================================", 'cyan');
        CLI::write("MASTER AWARD INVENTORY AUDIT (SA-01.1)", 'cyan');
        CLI::write("Total Awards Found: " . count($awards), 'yellow');
        CLI::write("========================================================================================", 'cyan');

        $inventory = [];

        foreach ($awards as $a) {
            $criteria = $db->table('award_criteria')
                ->where('award_definition_id', $a['id'])
                ->orderBy('sort_order', 'ASC')
                ->get()->getResultArray();

            $totalRubricMax = 0;
            $autoComputableMax = 0;
            $manualMax = 0;
            $critSummary = [];

            foreach ($criteria as $c) {
                $max = (float)$c['max_points'];
                $totalRubricMax += $max;
                $isComputable = isset($c['is_portfolio_computable']) ? ((int)$c['is_portfolio_computable'] === 1) : true;

                if ($isComputable) {
                    $autoComputableMax += $max;
                } else {
                    $manualMax += $max;
                }

                $components = $db->table('award_criterion_components')
                    ->where('criterion_id', $c['id'])
                    ->orderBy('sort_order', 'ASC')
                    ->get()->getResultArray();

                $critSummary[] = [
                    'code' => $c['code'],
                    'name' => $c['name'],
                    'max_points' => $max,
                    'is_computable' => $isComputable,
                    'authority_status' => $c['authority_status'] ?? 'OFFICIAL',
                    'components_count' => count($components)
                ];
            }

            $thresholdPercent = !empty($a['candidate_threshold_percent']) ? (float)$a['candidate_threshold_percent'] : 80.0;
            $potentialThreshold = round($autoComputableMax * ($thresholdPercent / 100.0), 2);

            $item = [
                'id' => $a['id'],
                'code' => $a['code'],
                'name' => $a['name'],
                'status' => $a['status'] ?? 'active',
                'authority_status' => $a['authority_status'] ?? 'OFFICIAL',
                'source_fidelity_status' => $a['source_fidelity_status'] ?? 'PENDING_RECONCILIATION',
                'award_scope' => $a['award_scope'] ?? 'university',
                'graduating_only' => (int)($a['graduating_only'] ?? 0),
                'gender_restriction' => $a['gender_restriction'] ?? null,
                'is_catalog_visible' => (int)($a['is_catalog_visible'] ?? 1),
                'total_rubric_max' => $totalRubricMax,
                'auto_computable_max' => $autoComputableMax,
                'manual_max' => $manualMax,
                'threshold_percent' => $thresholdPercent,
                'potential_threshold' => $potentialThreshold,
                'criteria' => $critSummary
            ];

            $inventory[] = $item;

            $statusColor = ($item['status'] === 'active' && $item['is_catalog_visible'] === 1) ? 'green' : 'light_gray';
            CLI::write(sprintf(
                "[%s] %s\n  UUID: %s\n  Scope: %s | Status: %s | Fidelity: %s | GradOnly: %d | Sex: %s | Visible: %d\n  Rubric Max: %.2f | Auto-Computable Max: %.2f | Manual Max: %.2f | 80%% Threshold: %.2f\n  Criteria Count: %d",
                $item['code'],
                $item['name'],
                $item['id'],
                $item['award_scope'],
                $item['status'],
                $item['source_fidelity_status'],
                $item['graduating_only'],
                $item['gender_restriction'] ?? 'none',
                $item['is_catalog_visible'],
                $item['total_rubric_max'],
                $item['auto_computable_max'],
                $item['manual_max'],
                $item['potential_threshold'],
                count($critSummary)
            ), $statusColor);

            foreach ($critSummary as $cs) {
                CLI::write(sprintf("    - [%s] %s | Max: %.2f | Computable: %s | Authority: %s | Components: %d",
                    $cs['code'], $cs['name'], $cs['max_points'], $cs['is_computable'] ? 'YES' : 'NO', $cs['authority_status'], $cs['components_count']
                ), $cs['is_computable'] ? 'cyan' : 'yellow');
            }
            CLI::write("----------------------------------------------------------------------------------------");
        }

        // Output JSON dump for reference
        file_put_contents(
            WRITEPATH . 'award_master_inventory_dump.json',
            json_encode($inventory, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
        CLI::write("JSON dump saved to: " . WRITEPATH . 'award_master_inventory_dump.json', 'yellow');
    }
}
