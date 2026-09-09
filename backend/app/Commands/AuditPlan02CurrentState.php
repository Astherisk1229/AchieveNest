<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;

class AuditPlan02CurrentState extends BaseCommand
{
    protected $group       = 'Audit';
    protected $name        = 'audit:plan02-current-state';
    protected $description = 'Audits current-state database schema, routes, and data for Plan 02';

    public function run(array $params)
    {
        $db = Database::connect();

        CLI::write("==================================================", 'cyan');
        CLI::write("Plan 02 Current-State Schema Audit", 'white');
        CLI::write("==================================================", 'cyan');

        $tables = $db->listTables();
        $targetTables = [];
        foreach ($tables as $t) {
            if (strpos($t, 'org') !== false || strpos($t, 'moderator') !== false || strpos($t, 'club') !== false) {
                $targetTables[] = $t;
            }
        }

        CLI::write("Found relevant tables: " . implode(', ', $targetTables), 'yellow');

        foreach ($targetTables as $t) {
            CLI::write("\n--- TABLE: {$t} ---", 'green');
            $fields = $db->getFieldData($t);
            foreach ($fields as $f) {
                CLI::write(sprintf("  %-30s %-15s null:%s def:%s", $f->name, $f->type, $f->nullable ? 'YES' : 'NO', var_export($f->default, true)));
            }

            // Show row count
            $count = $db->table($t)->countAllResults();
            CLI::write("  Total Rows: {$count}", 'white');

            // Show create table if possible
            $createRes = $db->query("SHOW CREATE TABLE `{$t}`")->getRowArray();
            CLI::write("  Create SQL:\n" . ($createRes['Create Table'] ?? ''), 'light_gray');
        }

        // Check foreign keys
        CLI::write("\n=== Foreign Key Constraints ===", 'cyan');
        $fks = $db->query("
            SELECT 
                TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME IN ('" . implode("', '", $targetTables) . "')
              AND REFERENCED_TABLE_NAME IS NOT NULL
        ")->getResultArray();

        foreach ($fks as $fk) {
            CLI::write("  {$fk['TABLE_NAME']}.{$fk['COLUMN_NAME']} -> {$fk['REFERENCED_TABLE_NAME']}.{$fk['REFERENCED_COLUMN_NAME']} ({$fk['CONSTRAINT_NAME']})");
        }

        // Check unique constraints
        CLI::write("\n=== Unique Constraints / Indexes ===", 'cyan');
        $indexes = $db->query("
            SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, COLUMN_NAME
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME IN ('" . implode("', '", $targetTables) . "')
            ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
        ")->getResultArray();

        foreach ($indexes as $idx) {
            CLI::write("  {$idx['TABLE_NAME']}: {$idx['INDEX_NAME']} (NonUnique: {$idx['NON_UNIQUE']}) Column: {$idx['COLUMN_NAME']}");
        }

        return 0;
    }
}
