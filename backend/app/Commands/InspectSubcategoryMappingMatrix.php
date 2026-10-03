<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class InspectSubcategoryMappingMatrix extends BaseCommand
{
    protected $group       = 'Audit';
    protected $name        = 'audit:subcategory-matrix';
    protected $description = 'Inspects and audits all portfolio sub-categories and criterion-to-subcategory mappings for SA-01.4.';

    public function run(array $params)
    {
        $db = \Config\Database::connect();

        CLI::write("========================================================================================", 'cyan');
        CLI::write("SA-01.4: PORTFOLIO SUB-CATEGORY & CRITERION MAPPING AUDIT", 'cyan');
        CLI::write("========================================================================================", 'cyan');

        // 1. Audit Sub-Categories
        $subcategories = $db->table('portfolio_subcategories')
            ->select('portfolio_subcategories.*, portfolio_categories.name as category_name, portfolio_categories.code as category_code')
            ->join('portfolio_categories', 'portfolio_categories.id = portfolio_subcategories.category_id')
            ->orderBy('portfolio_categories.name', 'ASC')
            ->orderBy('portfolio_subcategories.sort_order', 'ASC')
            ->get()->getResultArray();

        CLI::write("\n[1] ACTIVE PORTFOLIO SUB-CATEGORIES (" . count($subcategories) . " found):", 'yellow');
        $subcatMap = [];
        $subcatsByCategory = [];
        foreach ($subcategories as $sc) {
            $subcatMap[$sc['id']] = $sc;
            $subcatsByCategory[$sc['category_id']][] = $sc;

            // Check record count
            $recCount = 0;
            if ($db->tableExists('student_portfolio_records')) {
                $recCount = $db->table('student_portfolio_records')->where('subcategory_id', $sc['id'])->countAllResults();
            }

            CLI::write(sprintf(
                "  - [%s] %-30s | Parent: %-25s | Code: %-20s | Records: %d",
                $sc['id'],
                $sc['name'],
                $sc['category_name'],
                $sc['code'],
                $recCount
            ), 'green');
        }

        // 2. Audit Evidence Mapping Rules from DB
        $mappingRules = $db->table('award_evidence_mapping_rules')
            ->where('is_active', 1)
            ->get()->getResultArray();

        $activeAwards = $db->table('award_definitions')
            ->where('is_catalog_visible', 1)
            ->where('status', 'active')
            ->orderBy('code', 'ASC')
            ->get()->getResultArray();

        $matrix = [];
        $sharedSubcats = [];

        CLI::write("\n[2] ROUTE EXPANSION & SUB-CATEGORY CLASSIFICATION:", 'yellow');

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
                    // Find mapping rules for this criterion/component
                    $compRules = array_filter($mappingRules, function($r) use ($crit, $comp) {
                        if ($r['criterion_id'] !== $crit['id']) return false;
                        if (!empty($r['criterion_component_id']) && $r['criterion_component_id'] !== ($comp['id'] ?? null)) return false;
                        return true;
                    });

                    // If empty, look for criterion-level mapping rules
                    if (empty($compRules)) {
                        $compRules = array_filter($mappingRules, function($r) use ($crit) {
                            return $r['criterion_id'] === $crit['id'];
                        });
                    }

                    if (!$isComputable) {
                        $matrix[] = [
                            'award_code' => $award['code'],
                            'award_name' => $award['name'],
                            'criterion_code' => $crit['code'],
                            'criterion_name' => $crit['name'],
                            'subsection_code' => $comp['code'],
                            'subsection_name' => $comp['name'],
                            'type' => 'MANUAL',
                            'category_id' => 'N/A',
                            'category_name' => 'N/A (MANUAL)',
                            'subcategory_id' => 'N/A',
                            'subcategory_name' => 'N/A (MANUAL)',
                            'route_status' => 'MANUAL_EVALUATION',
                            'allowed' => 'NO',
                            'notes' => 'Non-portfolio evaluative criterion'
                        ];
                        CLI::write(sprintf("  [%s] %s | Sub: [%s] -> MANUAL EVALUATION", $crit['code'], $crit['name'], $comp['code']), 'light_gray');
                        continue;
                    }

                    // For each authorized category, evaluate all child subcategories
                    $catIds = array_unique(array_column($compRules, 'portfolio_category_id'));

                    // Specific subcategory IDs explicitly mapped in rules
                    $explicitSubcatIds = array_filter(array_column($compRules, 'portfolio_subcategory_id'));

                    foreach ($catIds as $catId) {
                        $parentCat = $db->table('portfolio_categories')->where('id', $catId)->get()->getRowArray();
                        $childSubcats = $subcatsByCategory[$catId] ?? [];

                        foreach ($childSubcats as $subcat) {
                            // If explicit subcat IDs are specified, only those are ALLOWED; otherwise determine applicability based on component code
                            $isAllowed = true;
                            if (!empty($explicitSubcatIds)) {
                                $isAllowed = in_array($subcat['id'], $explicitSubcatIds, true);
                            } else {
                                // Keyword filtering based on component and subcategory
                                $compCodeLower = strtolower($comp['code']);
                                $subCodeLower = strtolower($subcat['code']);
                                $subNameLower = strtolower($subcat['name']);

                                // E.g., news vs literary vs feature in journalism
                                if (strpos($compCodeLower, 'news') !== false && strpos($subCodeLower, 'news') === false) {
                                    $isAllowed = false;
                                } elseif (strpos($compCodeLower, 'literary') !== false && strpos($subCodeLower, 'literary') === false) {
                                    $isAllowed = false;
                                } elseif (strpos($compCodeLower, 'feature') !== false && (strpos($subCodeLower, 'feature') === false && strpos($subCodeLower, 'editorial') === false)) {
                                    $isAllowed = false;
                                } elseif (strpos($compCodeLower, 'comp') !== false && strpos($compCodeLower, 'competitions') !== false && strpos($subCodeLower, 'press') === false && strpos($subCodeLower, 'award') === false) {
                                    $isAllowed = false;
                                } elseif (strpos($compCodeLower, 'team') !== false && strpos($subCodeLower, 'team') === false && strpos($subCodeLower, 'varsity') === false) {
                                    $isAllowed = false;
                                } elseif (strpos($compCodeLower, 'indiv') !== false && strpos($subCodeLower, 'indiv') === false && strpos($subCodeLower, 'solo') === false) {
                                    $isAllowed = false;
                                }
                            }

                            $status = $isAllowed ? 'ALLOWED' : 'NOT_APPLICABLE';

                            $row = [
                                'award_code' => $award['code'],
                                'award_name' => $award['name'],
                                'criterion_code' => $crit['code'],
                                'criterion_name' => $crit['name'],
                                'subsection_code' => $comp['code'],
                                'subsection_name' => $comp['name'],
                                'type' => 'AUTOMATIC',
                                'category_id' => $catId,
                                'category_name' => $parentCat['name'] ?? 'Unknown',
                                'subcategory_id' => $subcat['id'],
                                'subcategory_name' => $subcat['name'],
                                'route_status' => $status,
                                'allowed' => $isAllowed ? 'YES' : 'NO',
                                'notes' => $isAllowed ? 'Explicitly authorized route' : 'Non-applicable child sub-category'
                            ];

                            $matrix[] = $row;

                            if ($isAllowed) {
                                $sharedSubcats[$subcat['name']][] = [
                                    'award' => $award['code'],
                                    'criterion' => $crit['code'],
                                    'subsection' => $comp['code']
                                ];
                            }

                            CLI::write(sprintf(
                                "  [%s] Sub: [%s] | Cat: %s | Subcat: %-25s | Status: %s",
                                $crit['code'],
                                $comp['code'],
                                $parentCat['name'] ?? 'Unknown',
                                $subcat['name'],
                                $status
                            ), $isAllowed ? 'green' : 'yellow');
                        }
                    }
                }
            }
        }

        // Save JSON dump
        file_put_contents(
            WRITEPATH . 'subcategory_mapping_dump.json',
            json_encode([
                'subcategories' => $subcategories,
                'matrix' => $matrix,
                'shared_subcategories' => $sharedSubcats
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
        CLI::write("\nSub-Category Mapping JSON dump saved to: " . WRITEPATH . 'subcategory_mapping_dump.json', 'yellow');
    }
}
