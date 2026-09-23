<?php

namespace App\Commands;

use App\Services\CanonicalBaselineProofService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use RuntimeException;

/** Proof-gated migration ledger reconciliation for the existing MySQL defense database. */
class ReconcileCanonicalMigrationBaseline extends BaseCommand
{
    protected $group = 'Database';
    protected $name = 'db:reconcile-canonical-baseline';
    protected $description = 'Audit the live schema against the canonical MySQL baseline and optionally establish its migration ledger row.';

    public function run(array $params)
    {
        $db = db_connect();
        $database = (string) $db->getDatabase();
        if ($db->DBDriver !== 'MySQLi' || $database !== 'achievenest_local') {
            throw new RuntimeException('This command is restricted to the configured achievenest_local MySQL database.');
        }

        $proof = (new CanonicalBaselineProofService())->audit($db);
        CLI::write('database=' . $proof['database']);
        CLI::write('driver=' . $proof['driver']);
        CLI::write('canonical_tables_checked=' . $proof['tables_checked']);
        CLI::write('canonical_columns_checked=' . $proof['columns_checked']);
        CLI::write('canonical_indexes_checked=' . $proof['indexes_checked']);
        CLI::write('missing_tables=' . ($proof['missing_tables'] ? implode(',', $proof['missing_tables']) : 'NONE'));
        CLI::write('missing_columns=' . ($proof['missing_columns'] ? implode(',', $proof['missing_columns']) : 'NONE'));
        CLI::write('missing_indexes=' . ($proof['missing_indexes'] ? implode(',', $proof['missing_indexes']) : 'NONE'));
        CLI::write('reference_minimum_failures=' . ($proof['reference_failures'] ? implode(',', $proof['reference_failures']) : 'NONE'));
        CLI::write('accepted_proven_evolution=' . ($proof['accepted_evolution'] ? implode(',', $proof['accepted_evolution']) : 'NONE'));

        $migrationGroup = (string) config('Database')->defaultGroup;
        CLI::write("PROPOSED_ROW version=2026-08-31-000001 | class=Phase17Canonical\\Database\\Migrations\\CreateCanonicalMySQLBaseline | group={$migrationGroup} | namespace=Phase17Canonical | batch=1");
        CLI::write('baseline_proven=' . ($proof['proven'] ? 'YES' : 'NO'), $proof['proven'] ? 'green' : 'red');
        if (CLI::getOption('apply') === null && ! in_array('apply', $params, true)) {
            return;
        }
        if (! $proof['proven']) {
            throw new RuntimeException('Refusing migration-history write because canonical baseline effects are not fully represented.');
        }

        $exists = $db->table('migrations')->where('version', '2026-08-31-000001')->where('namespace', 'Phase17Canonical')->countAllResults() > 0;
        if (! $exists) {
            $db->table('migrations')->insert(['version' => '2026-08-31-000001', 'class' => 'Phase17Canonical\\Database\\Migrations\\CreateCanonicalMySQLBaseline', 'group' => $migrationGroup, 'namespace' => 'Phase17Canonical', 'time' => time(), 'batch' => 1]);
        } else {
            $db->table('migrations')->where('version', '2026-08-31-000001')->where('namespace', 'Phase17Canonical')->update(['group' => $migrationGroup]);
        }
        $oldDean = $db->table('migrations')->where('version', '2026-09-13-000002')->where('namespace', 'Phase17Canonical')->get()->getRowArray();
        if ($oldDean) {
            $db->table('migrations')->where('id', $oldDean['id'])->update(['version' => '2026-09-13-000009', 'group' => $migrationGroup]);
        }
        CLI::write($exists ? 'BASELINE_ROW_ALREADY_PRESENT' : 'BASELINE_ROW_ESTABLISHED', 'green');
    }
}
