<?php

namespace Tests\Unit;

use CodeIgniter\Config\Factories;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;
use Phase17Canonical\Database\Migrations\September15BridgeSchemaInspector;

final class September15BridgeSchemaInspectorTest extends CIUnitTestCase
{
    public function testFreshInspectionObservesSequentialDdlWithoutMetadataSnapshots(): void
    {
        Factories::reset();
        $db = Database::connect('local_defense', false);
        self::assertSame('MySQLi', $db->DBDriver);

        $table = 'bridge_guard_freshness_probe';
        $inspector = new September15BridgeSchemaInspector($db);
        self::assertFalse($inspector->tableExists($table), 'Probe table must not preexist.');

        // Reproduce the bridge failure mechanism by populating CI's table cache before raw DDL.
        $db->listTables();
        try {
            $db->query("CREATE TABLE {$table} (id INT NOT NULL PRIMARY KEY, source_value INT NOT NULL, generated_value INT GENERATED ALWAYS AS (source_value + 1) STORED) ENGINE=InnoDB");

            self::assertFalse($db->tableExists($table), 'Cached CodeIgniter tableExists() reproduces the stale same-process result.');
            self::assertTrue($inspector->tableExists($table));
            self::assertTrue($inspector->tableExists($table), 'Repeated inspection must query current schema state.');

            self::assertTrue($inspector->columnExists($table, 'generated_value'));
            $generated = $inspector->column($table, 'generated_value');
            self::assertNotNull($generated);
            self::assertStringContainsString('source_value', strtolower((string) $generated['generation_expression']));

            $db->getFieldNames($table);
            $db->query("ALTER TABLE {$table} ADD COLUMN added_later VARCHAR(20) NULL");
            self::assertFalse($db->fieldExists('added_later', $table), 'Cached CodeIgniter fieldExists() reproduces stale same-process column metadata.');
            self::assertTrue($inspector->columnExists($table, 'added_later'));

            $db->query("CREATE INDEX idx_bridge_guard_probe ON {$table} (added_later, source_value)");
            $index = $inspector->index($table, 'idx_bridge_guard_probe');
            self::assertSame(['added_later', 'source_value'], array_column($index, 'column_name'));

            $db->query("DROP INDEX idx_bridge_guard_probe ON {$table}");
            self::assertFalse($inspector->indexExists($table, 'idx_bridge_guard_probe'));
            self::assertFalse($inspector->columnExists($table, 'missing_column'));
        } finally {
            $db->query("DROP TABLE IF EXISTS {$table}");
            $db->resetDataCache();
            $db->close();
        }
    }

    public function testMissingTableRemainsRejectedByFreshInspection(): void
    {
        $db = Database::connect('local_defense', false);
        $inspector = new September15BridgeSchemaInspector($db);
        self::assertFalse($inspector->tableExists('bridge_guard_table_that_must_not_exist'));
        $db->close();
    }
}
