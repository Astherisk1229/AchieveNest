<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class AuditPlan04Phase1 extends BaseCommand
{
    protected $group       = 'Audit';
    protected $name        = 'audit:plan04-phase1';
    protected $description = 'Audits Plan 04 Phase 1 Current Form, Taxonomy & Portfolio Tables';

    public function run(array $params)
    {
        $db = db_connect();

        CLI::write("========================================================================", 'cyan');
        CLI::write("AchieveNest — Student Achievement Entry & Dynamic Structured Forms", 'yellow');
        CLI::write("Plan 04 Phase 1 — Database & Taxonomy Current State Audit", 'yellow');
        CLI::write("========================================================================", 'cyan');

        // 1. List all tables
        $tables = $db->listTables();
        CLI::write("1. Total Tables in achievenest_local: " . count($tables), 'green');

        // Check for portfolio/achievement tables
        $portfolioTables = array_filter($tables, fn($t) => str_contains($t, 'portfolio') || str_contains($t, 'achievement') || str_contains($t, 'category') || str_contains($t, 'evidence') || str_contains($t, 'award'));
        CLI::write("   Portfolio & Achievement Related Tables (" . count($portfolioTables) . "):", 'yellow');
        foreach ($portfolioTables as $pt) {
            CLI::write("   - {$pt}", 'white');
        }

        // 2. Inspect portfolio categories table if exists
        $catTable = in_array('portfolio_categories', $tables, true) ? 'portfolio_categories' : (in_array('categories', $tables, true) ? 'categories' : null);
        if ($catTable) {
            CLI::write("\n2. Categories Table: [{$catTable}]", 'green');
            $cats = $db->table($catTable)->get()->getResultArray();
            CLI::write("   Total Categories in DB: " . count($cats), 'yellow');
            foreach ($cats as $c) {
                CLI::write("   - " . ($c['id'] ?? '') . " | " . ($c['name'] ?? $c['code'] ?? json_encode($c)), 'white');
            }
        } else {
            CLI::write("\n2. Categories Table: NOT FOUND as dedicated portfolio_categories", 'red');
        }

        // 3. Inspect portfolio subcategories table if exists
        $subcatTable = in_array('portfolio_subcategories', $tables, true) ? 'portfolio_subcategories' : (in_array('subcategories', $tables, true) ? 'subcategories' : null);
        if ($subcatTable) {
            CLI::write("\n3. Subcategories Table: [{$subcatTable}]", 'green');
            $subcats = $db->table($subcatTable)->get()->getResultArray();
            CLI::write("   Total Subcategories in DB: " . count($subcats), 'yellow');
            foreach ($subcats as $sc) {
                CLI::write("   - " . ($sc['id'] ?? '') . " | " . ($sc['name'] ?? json_encode($sc)), 'white');
            }
        } else {
            CLI::write("\n3. Subcategories Table: NOT FOUND as dedicated portfolio_subcategories", 'red');
        }

        // 4. Inspect student portfolio records table if exists
        $recordTable = in_array('student_portfolio_records', $tables, true) ? 'student_portfolio_records' : (in_array('portfolio_records', $tables, true) ? 'portfolio_records' : (in_array('student_achievements', $tables, true) ? 'student_achievements' : null));
        if ($recordTable) {
            CLI::write("\n4. Portfolio Records Table: [{$recordTable}]", 'green');
            $fields = $db->getFieldData($recordTable);
            CLI::write("   Columns in [{$recordTable}]:", 'yellow');
            foreach ($fields as $f) {
                CLI::write("   - {$f->name} ({$f->type})", 'white');
            }
            $recordCount = $db->table($recordTable)->countAllResults();
            CLI::write("   Total Rows in [{$recordTable}]: {$recordCount}", 'yellow');
        } else {
            CLI::write("\n4. Portfolio Records Table: NOT FOUND under standard names", 'red');
        }

        // 5. Inspect Award Evidence Mapping Rules
        if (in_array('award_evidence_mapping_rules', $tables, true)) {
            CLI::write("\n5. Award Evidence Mapping Rules Table:", 'green');
            $mappingRules = $db->table('award_evidence_mapping_rules')->get()->getResultArray();
            CLI::write("   Total Mapping Rules: " . count($mappingRules), 'yellow');
            foreach (array_slice($mappingRules, 0, 10) as $mr) {
                CLI::write("   - " . ($mr['award_category_id'] ?? $mr['award_id'] ?? '') . " -> " . ($mr['portfolio_category_id'] ?? $mr['rule_key'] ?? json_encode($mr)), 'white');
            }
        }

        CLI::write("\n========================================================================", 'cyan');
    }
}
