<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;

/** Read-only proof that the canonical MySQL baseline is represented live. */
class CanonicalBaselineProofService
{
    public function audit(BaseConnection $db): array
    {
        $database = (string) $db->getDatabase();
        $path = ROOTPATH . 'database/codeigniter-canonical-baseline/000001_schema.sql';
        $sql = file_get_contents($path);
        if ($sql === false) {
            throw new RuntimeException("Canonical baseline artifact unreadable: {$path}");
        }

        preg_match_all('/CREATE TABLE `?([a-zA-Z0-9_]+)`?\s*\((.*?)\)\s*ENGINE/is', $sql, $tables, PREG_SET_ORDER);
        $missingTables = [];
        $missingColumns = [];
        $acceptedEvolution = [];
        $missingIndexes = [];
        $checkedColumns = 0;
        $checkedIndexes = 0;

        foreach ($tables as $definition) {
            $table = $definition[1];
            if (! $db->tableExists($table)) {
                $missingTables[] = $table;
                continue;
            }

            preg_match_all('/^\s*`([^`]+)`\s+/m', $definition[2], $columns);
            foreach ($columns[1] as $column) {
                $checkedColumns++;
                if ($db->fieldExists($column, $table)) {
                    continue;
                }
                if ($table === 'profiles' && $column === 'must_change_password'
                    && $db->fieldExists('must_change_password', 'local_auth_credentials')) {
                    $acceptedEvolution[] = 'profiles.must_change_password→local_auth_credentials.must_change_password';
                } else {
                    $missingColumns[] = "{$table}.{$column}";
                }
            }

            preg_match_all('/^\s*(?:UNIQUE\s+)?KEY\s+`([^`]+)`\s*\(([^)]+)\)/mi', $definition[2], $indexes, PREG_SET_ORDER);
            $liveRows = $db->query(
                'SELECT INDEX_NAME,GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns_csv FROM information_schema.statistics WHERE table_schema=? AND table_name=? GROUP BY INDEX_NAME',
                [$database, $table]
            )->getResultArray();
            $liveByName = [];
            $liveByColumns = [];
            foreach ($liveRows as $live) {
                $csv = strtolower((string) $live['columns_csv']);
                $liveByName[$live['INDEX_NAME']] = true;
                $liveByColumns[$csv] = true;
            }
            foreach ($indexes as $index) {
                $checkedIndexes++;
                $expectedCsv = strtolower(implode(',', array_map(static fn ($value) => trim($value, " `"), explode(',', $index[2]))));
                $relationship = $db->query(
                    'SELECT COUNT(*) AS total FROM information_schema.key_column_usage WHERE table_schema=? AND table_name=? AND constraint_name=?',
                    [$database, $table, $index[1]]
                )->getRowArray();
                if (! isset($liveByName[$index[1]]) && ! isset($liveByColumns[$expectedCsv]) && (int) ($relationship['total'] ?? 0) === 0) {
                    $missingIndexes[] = "{$table}.{$index[1]}({$expectedCsv})";
                } elseif (! isset($liveByName[$index[1]]) && ! isset($liveByColumns[$expectedCsv])) {
                    $acceptedEvolution[] = "{$table}.{$index[1]}→foreign-key relationship";
                }
            }
        }

        $referenceMinimums = ['roles' => 7, 'colleges' => 5, 'academic_programs' => 14, 'administrative_units' => 19, 'portfolio_categories' => 9, 'portfolio_subcategories' => 57, 'award_definitions' => 15];
        $referenceFailures = [];
        foreach ($referenceMinimums as $table => $minimum) {
            if (! $db->tableExists($table) || $db->table($table)->countAllResults() < $minimum) {
                $referenceFailures[] = "{$table}<{$minimum}";
            }
        }

        return [
            'database' => $database,
            'driver' => $db->DBDriver,
            'tables_checked' => count($tables),
            'columns_checked' => $checkedColumns,
            'indexes_checked' => $checkedIndexes,
            'missing_tables' => $missingTables,
            'missing_columns' => $missingColumns,
            'missing_indexes' => $missingIndexes,
            'reference_failures' => $referenceFailures,
            'accepted_evolution' => array_values(array_unique($acceptedEvolution)),
            'proven' => $missingTables === [] && $missingColumns === [] && $missingIndexes === [] && $referenceFailures === [],
        ];
    }
}
