<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class InspectCategoryMappingMatrix extends BaseCommand
{
    protected $group       = 'Audit';
    protected $name        = 'audit:category-mapping';
    protected $description = 'Inspects and audits all portfolio categories and criterion-to-category mappings for SA-01.3.';

    public function run(array $params)
    {
        $db = \Config\Database::connect();

        CLI::write("========================================================================================", 'cyan');
        CLI::write("SA-01.3: PORTFOLIO CATEGORY & CRITERION MAPPING AUDIT", 'cyan');
        CLI::write("========================================================================================", 'cyan');

        // 1. Audit Portfolio Categories
        $categories = $db->table('portfolio_categories')
            ->orderBy('name', 'ASC')
            ->get()->getResultArray();

        CLI::write("\n[1] ACTIVE PORTFOLIO CATEGORIES (" . count($categories) . " found):", 'yellow');
        $catMap = [];
        foreach ($categories as $cat) {
            $catMap[$cat['id']] = $cat;

            // Check record counts
            $achCount = 0;
            if ($db->tableExists('student_achievements')) {
                $achCount = $db->table('student_achievements')->where('category_id', $cat['id'])->countAllResults();
            } elseif ($db->tableExists('portfolio_items')) {
                $achCount = $db->table('portfolio_items')->where('category_id', $cat['id'])->countAllResults();
            }

            CLI::write(sprintf(
                "  - [%s] %-36s | Code: %-20s | Records: %d",
                $cat['id'],
                $cat['name'],
                $cat['code'] ?? 'N/A',
                $achCount
            ), 'green');
        }

        // 2. Audit Criterion Mappings across 15 Active Awards
        $activeAwards = $db->table('award_definitions')
            ->where('is_catalog_visible', 1)
            ->where('status', 'active')
            ->orderBy('code', 'ASC')
            ->get()->getResultArray();

        $matrix = [];
        $sharedCategories = [];

        CLI::write("\n[2] CRITERION-TO-CATEGORY MAPPINGS ACROSS 15 AWARDS:", 'yellow');

        foreach ($activeAwards as $award) {
            $criteria = $db->table('award_criteria')
                ->where('award_definition_id', $award['id'])
                ->orderBy('sort_order', 'ASC')
                ->get()->getResultArray();

            CLI::write(sprintf("\n=== [%s] %s ===", $award['code'], $award['name']), 'magenta');

            foreach ($criteria as $crit) {
                $isComputable = isset($crit['is_portfolio_computable']) ? ((int)$crit['is_portfolio_computable'] === 1) : true;

                $components = $db->table('award_criterion_components')
                    ->where('criterion_id', $crit['id'])
                    ->orderBy('sort_order', 'ASC')
                    ->get()->getResultArray();

                // Check mapping rules in award_evidence_mapping_rules or award_portfolio_mappings
                $mappingRules = $db->table('award_evidence_mapping_rules')
                    ->where('criterion_id', $crit['id'])
                    ->get()->getResultArray();

                if (empty($components)) {
                    $compList = [[
                        'code' => 'NONE',
                        'name' => 'Single Unified Criterion',
                        'max_points' => $crit['max_points']
                    ]];
                } else {
                    $compList = $components;
                }

                foreach ($compList as $comp) {
                    // Determine assigned category
                    $assignedCats = [];
                    foreach ($mappingRules as $mr) {
                        if (empty($mr['criterion_component_id']) || $mr['criterion_component_id'] === ($comp['id'] ?? null)) {
                            if (isset($catMap[$mr['portfolio_category_id']])) {
                                $assignedCats[] = $catMap[$mr['portfolio_category_id']];
                            }
                        }
                    }

                    // Fallback to criterion-level rule if none matched component
                    if (empty($assignedCats) && !empty($mappingRules)) {
                        foreach ($mappingRules as $mr) {
                            if (isset($catMap[$mr['portfolio_category_id']])) {
                                $assignedCats[] = $catMap[$mr['portfolio_category_id']];
                            }
                        }
                    }

                    $catNames = array_unique(array_column($assignedCats, 'name'));
                    $catIds = array_unique(array_column($assignedCats, 'id'));

                    $row = [
                        'award_id' => $award['id'],
                        'award_code' => $award['code'],
                        'award_name' => $award['name'],
                        'criterion_id' => $crit['id'],
                        'criterion_code' => $crit['code'],
                        'criterion_name' => $crit['name'],
                        'criterion_type' => $isComputable ? 'AUTOMATIC' : 'MANUAL',
                        'is_computable' => $isComputable,
                        'subsection_code' => $comp['code'],
                        'subsection_name' => $comp['name'],
                        'max_points' => (float)$comp['max_points'],
                        'categories' => $catNames,
                        'category_ids' => $catIds,
                        'exclusive' => count($catNames) === 1,
                        'multi_category' => count($catNames) > 1,
                    ];

                    $matrix[] = $row;

                    foreach ($catNames as $cn) {
                        $sharedCategories[$cn][] = [
                            'award' => $award['code'],
                            'criterion' => $crit['code'],
                            'subsection' => $comp['code']
                        ];
                    }

                    CLI::write(sprintf(
                        "  [%s] %s | Sub: [%s] %s | Type: %s | Max: %.2f | Cats: %s",
                        $crit['code'],
                        $crit['name'],
                        $comp['code'],
                        $comp['name'],
                        $isComputable ? 'AUTOMATIC' : 'MANUAL',
                        (float)$comp['max_points'],
                        empty($catNames) ? ($isComputable ? 'UNMAPPED' : 'N/A (MANUAL)') : implode(', ', $catNames)
                    ), $isComputable ? 'cyan' : 'light_gray');
                }
            }
        }

        // Save JSON dump
        file_put_contents(
            WRITEPATH . 'category_mapping_dump.json',
            json_encode([
                'categories' => $categories,
                'matrix' => $matrix,
                'shared_categories' => $sharedCategories
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
        CLI::write("\nCategory Mapping JSON dump saved to: " . WRITEPATH . 'category_mapping_dump.json', 'yellow');
    }
}
