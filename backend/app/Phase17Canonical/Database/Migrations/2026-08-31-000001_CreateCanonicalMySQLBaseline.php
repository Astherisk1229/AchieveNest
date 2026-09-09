<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

/**
 * Canonical MySQL baseline for fresh WAMP reconstruction.
 *
 * The legacy App migration history is intentionally retained unchanged. This
 * independent CodeIgniter namespace snapshots the final approved business
 * schema and deterministic reference state without executing mysql-defense.
 */
class CreateCanonicalMySQLBaseline extends Migration
{
    public function up()
    {
        $this->assertDisposableTarget();
        $root = ROOTPATH . 'database/codeigniter-canonical-baseline/';
        $this->executeSqlFile($root . '000001_schema.sql');
        $this->executeSqlFile($root . '000002_reference_data.sql');
    }

    public function down()
    {
        $this->assertDisposableTarget();
        $rows = $this->db->query('SHOW FULL TABLES WHERE Table_type = \'BASE TABLE\'')->getResultArray();
        $this->db->query('SET FOREIGN_KEY_CHECKS=0');
        foreach ($rows as $row) {
            $table = (string) reset($row);
            if ($table !== 'migrations') {
                $this->db->query('DROP TABLE IF EXISTS `' . str_replace('`', '``', $table) . '`');
            }
        }
        $this->db->query('SET FOREIGN_KEY_CHECKS=1');
    }

    private function assertDisposableTarget(): void
    {
        $database = (string) $this->db->getDatabase();
        if ($database === 'achievenest_local' || ! str_starts_with($database, 'achievenest_phase17m_')) {
            throw new RuntimeException("Refusing canonical replay against non-disposable database [{$database}].");
        }
        if ($this->db->DBDriver !== 'MySQLi') {
            throw new RuntimeException('Canonical Phase 17M baseline requires MySQLi.');
        }
    }

    private function executeSqlFile(string $path): void
    {
        if (! is_file($path)) {
            throw new RuntimeException("Canonical baseline artifact missing: {$path}");
        }
        $this->db->initialize();
        $mysqli = $this->db->connID;
        $sql = file_get_contents($path);
        if ($sql === false) {
            throw new RuntimeException("Canonical baseline artifact unreadable: {$path}");
        }

        // The schema dump is intentionally stable/alphabetical, not dependency
        // ordered. MySQL can recreate those foreign keys safely only while its
        // referential checks are disabled for this connection.
        $sql = "SET FOREIGN_KEY_CHECKS=0;\n" . $sql . "\nSET FOREIGN_KEY_CHECKS=1;";
        if (! $mysqli->multi_query($sql)) {
            throw new RuntimeException("Canonical baseline failed for {$path}: {$mysqli->error}");
        }
        while (true) {
            if ($result = $mysqli->store_result()) {
                $result->free();
            }
            if (! $mysqli->more_results()) {
                break;
            }
            if (! $mysqli->next_result()) {
                $error = $mysqli->error;
                while ($mysqli->more_results() && $mysqli->next_result()) {
                    if ($result = $mysqli->store_result()) {
                        $result->free();
                    }
                }
                $mysqli->query('SET FOREIGN_KEY_CHECKS=1');
                throw new RuntimeException("Canonical baseline failed for {$path}: {$error}");
            }
        }
    }
}
