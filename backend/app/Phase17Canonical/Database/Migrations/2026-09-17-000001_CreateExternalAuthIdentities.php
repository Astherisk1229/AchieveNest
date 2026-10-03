<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

/** Creates durable provider identity links without creating local accounts. */
class CreateExternalAuthIdentities extends Migration
{
    private const TABLE = 'external_auth_identities';

    public function up()
    {
        if ($this->db->DBDriver !== 'MySQLi') {
            throw new RuntimeException('External auth identities require MySQLi.');
        }
        if (! $this->db->tableExists('profiles')) {
            throw new RuntimeException('External auth identities require the profiles table.');
        }

        $profileId = $this->column('profiles', 'id');
        if (
            strtolower((string) $profileId['DATA_TYPE']) !== 'char'
            || (int) $profileId['CHARACTER_MAXIMUM_LENGTH'] !== 36
            || (string) $profileId['IS_NULLABLE'] !== 'NO'
            || (string) $profileId['COLUMN_KEY'] !== 'PRI'
        ) {
            throw new RuntimeException('profiles.id must be a non-null CHAR(36) primary key.');
        }

        $profileTable = $this->tableMetadata('profiles');
        if (strtoupper((string) $profileTable['ENGINE']) !== 'INNODB') {
            throw new RuntimeException('profiles must use InnoDB for the external identity foreign key.');
        }
        $charset = (string) $profileId['CHARACTER_SET_NAME'];
        $collation = (string) $profileId['COLLATION_NAME'];
        if (! preg_match('/^[a-zA-Z0-9_]+$/', $charset) || ! preg_match('/^[a-zA-Z0-9_]+$/', $collation)) {
            throw new RuntimeException('profiles.id has an unsafe charset or collation identifier.');
        }

        if ($this->db->tableExists(self::TABLE)) {
            $this->assertCompatible($charset, $collation);
            return;
        }

        $this->db->query(<<<SQL
CREATE TABLE external_auth_identities (
    id CHAR(36) NOT NULL,
    profile_id CHAR(36) NOT NULL,
    provider VARCHAR(30) NOT NULL,
    provider_subject VARCHAR(255) NOT NULL,
    provider_email_snapshot VARCHAR(255) NOT NULL,
    provider_hosted_domain_snapshot VARCHAR(255) NULL,
    link_method VARCHAR(30) NOT NULL,
    linked_at DATETIME(6) NOT NULL,
    last_authenticated_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_external_auth_provider_subject UNIQUE (provider, provider_subject),
    CONSTRAINT uq_external_auth_profile_provider UNIQUE (profile_id, provider),
    CONSTRAINT fk_external_auth_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET={$charset} COLLATE={$collation}
SQL);

        $this->assertCompatible($charset, $collation);
    }

    public function down()
    {
        $this->forge->dropTable(self::TABLE, true);
    }

    private function assertCompatible(string $charset, string $collation): void
    {
        $expected = [
            'id' => ['char', 36, 'NO'],
            'profile_id' => ['char', 36, 'NO'],
            'provider' => ['varchar', 30, 'NO'],
            'provider_subject' => ['varchar', 255, 'NO'],
            'provider_email_snapshot' => ['varchar', 255, 'NO'],
            'provider_hosted_domain_snapshot' => ['varchar', 255, 'YES'],
            'link_method' => ['varchar', 30, 'NO'],
            'linked_at' => ['datetime', null, 'NO'],
            'last_authenticated_at' => ['datetime', null, 'YES'],
            'created_at' => ['datetime', null, 'NO'],
            'updated_at' => ['datetime', null, 'NO'],
        ];
        $columns = $this->db->query(
            'SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE, DATETIME_PRECISION '
            . 'FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION',
            [self::TABLE]
        )->getResultArray();
        if (array_column($columns, 'COLUMN_NAME') !== array_keys($expected)) {
            throw new RuntimeException('Existing external_auth_identities columns are incompatible.');
        }
        foreach ($columns as $column) {
            [$type, $length, $nullable] = $expected[$column['COLUMN_NAME']];
            if (
                strtolower((string) $column['DATA_TYPE']) !== $type
                || ($length !== null && (int) $column['CHARACTER_MAXIMUM_LENGTH'] !== $length)
                || (string) $column['IS_NULLABLE'] !== $nullable
                || ($type === 'datetime' && (int) $column['DATETIME_PRECISION'] !== 6)
            ) {
                throw new RuntimeException("Existing external_auth_identities.{$column['COLUMN_NAME']} is incompatible.");
            }
        }

        $table = $this->tableMetadata(self::TABLE);
        if (
            strtoupper((string) $table['ENGINE']) !== 'INNODB'
            || (string) $table['TABLE_COLLATION'] !== $collation
            || ! str_starts_with((string) $table['TABLE_COLLATION'], $charset . '_')
        ) {
            throw new RuntimeException('Existing external_auth_identities engine or collation is incompatible.');
        }

        $expectedIndexes = [
            'PRIMARY' => ['id'],
            'uq_external_auth_profile_provider' => ['profile_id', 'provider'],
            'uq_external_auth_provider_subject' => ['provider', 'provider_subject'],
        ];
        foreach ($expectedIndexes as $name => $fields) {
            $rows = $this->db->query(
                'SELECT COLUMN_NAME, NON_UNIQUE FROM information_schema.STATISTICS '
                . 'WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? ORDER BY SEQ_IN_INDEX',
                [self::TABLE, $name]
            )->getResultArray();
            if (array_column($rows, 'COLUMN_NAME') !== $fields || array_filter(array_column($rows, 'NON_UNIQUE'))) {
                throw new RuntimeException("Existing external_auth_identities index {$name} is incompatible.");
            }
        }

        $foreignKey = $this->db->query(
            'SELECT k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME, r.DELETE_RULE '
            . 'FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r '
            . 'ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME '
            . 'WHERE k.TABLE_SCHEMA=DATABASE() AND k.TABLE_NAME=? AND k.COLUMN_NAME=?',
            [self::TABLE, 'profile_id']
        )->getRowArray();
        if (
            $foreignKey === null
            || $foreignKey['REFERENCED_TABLE_NAME'] !== 'profiles'
            || $foreignKey['REFERENCED_COLUMN_NAME'] !== 'id'
            || $foreignKey['DELETE_RULE'] !== 'CASCADE'
        ) {
            throw new RuntimeException('Existing external_auth_identities profile foreign key is incompatible.');
        }
    }

    private function column(string $table, string $column): array
    {
        $row = $this->db->query(
            'SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, CHARACTER_SET_NAME, COLLATION_NAME, COLUMN_KEY, IS_NULLABLE '
            . 'FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?',
            [$table, $column]
        )->getRowArray();
        if ($row === null) {
            throw new RuntimeException("Required column {$table}.{$column} is missing.");
        }
        return $row;
    }

    private function tableMetadata(string $table): array
    {
        $row = $this->db->query(
            'SELECT ENGINE, TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?',
            [$table]
        )->getRowArray();
        if ($row === null) {
            throw new RuntimeException("Required table {$table} is missing.");
        }
        return $row;
    }
}
