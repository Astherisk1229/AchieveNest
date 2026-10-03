<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

/**
 * Adds the finalized shared sex attribute to the canonical Profile model.
 */
class AddCanonicalProfileSex extends Migration
{
    private const TABLE = 'profiles';
    private const COLUMN = 'sex';
    private const CONSTRAINT = 'ck_profiles_sex';

    public function up(): void
    {
        if (! $this->tableExistsFresh(self::TABLE)) {
            throw new RuntimeException('Required table profiles does not exist.');
        }

        $column = $this->columnDefinitionFresh(self::TABLE, self::COLUMN);
        if ($column === null) {
            $this->forge->addColumn(self::TABLE, [
                self::COLUMN => [
                    'type'       => 'VARCHAR',
                    'constraint' => 20,
                    'null'       => true,
                    'default'    => null,
                    'after'      => 'full_name',
                ],
            ]);
        } else {
            $this->assertCompatibleColumn($column);
        }

        if ($this->constraintExistsFresh(self::TABLE, self::CONSTRAINT)) {
            $this->assertCompatibleConstraint();
        } else {
            $this->db->query(
                "ALTER TABLE `profiles`
                 ADD CONSTRAINT `ck_profiles_sex` CHECK (
                     `sex` IS NULL
                     OR `sex` IN ('Male', 'Female', 'Prefer not to say')
                 )"
            );
        }
    }

    public function down(): void
    {
        if (! $this->tableExistsFresh(self::TABLE)) {
            throw new RuntimeException('Required table profiles does not exist.');
        }

        if ($this->columnDefinitionFresh(self::TABLE, self::COLUMN) === null) {
            return;
        }

        $row = $this->db->query(
            'SELECT COUNT(*) AS populated_count FROM `profiles` WHERE `sex` IS NOT NULL'
        )->getRowArray();

        if ((int) ($row['populated_count'] ?? 0) > 0) {
            throw new RuntimeException(
                'Refusing to drop profiles.sex because populated values would be discarded.'
            );
        }

        if ($this->constraintExistsFresh(self::TABLE, self::CONSTRAINT)) {
            $this->db->query('ALTER TABLE `profiles` DROP CHECK `ck_profiles_sex`');
        }

        $this->forge->dropColumn(self::TABLE, self::COLUMN);
    }

    /**
     * @param array<string, mixed> $column
     */
    private function assertCompatibleColumn(array $column): void
    {
        $compatible = strtolower((string) ($column['DATA_TYPE'] ?? '')) === 'varchar'
            && (int) ($column['CHARACTER_MAXIMUM_LENGTH'] ?? 0) === 20
            && strtoupper((string) ($column['IS_NULLABLE'] ?? '')) === 'YES'
            && ($column['COLUMN_DEFAULT'] ?? null) === null
            && (string) ($column['preceding_column'] ?? '') === 'full_name';

        if (! $compatible) {
            throw new RuntimeException(
                'Existing profiles.sex is incompatible; expected VARCHAR(20) NULL '
                . 'DEFAULT NULL immediately after full_name.'
            );
        }
    }

    private function assertCompatibleConstraint(): void
    {
        $row = $this->db->query(
            'SELECT cc.CHECK_CLAUSE
             FROM information_schema.TABLE_CONSTRAINTS tc
             JOIN information_schema.CHECK_CONSTRAINTS cc
               ON cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
              AND cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
             WHERE tc.CONSTRAINT_SCHEMA = DATABASE()
               AND tc.TABLE_NAME = ?
               AND tc.CONSTRAINT_NAME = ?
               AND tc.CONSTRAINT_TYPE = \'CHECK\'',
            [self::TABLE, self::CONSTRAINT]
        )->getRowArray();

        $clause = (string) ($row['CHECK_CLAUSE'] ?? '');
        preg_match_all("/'([^']*)'/", $clause, $matches);
        $values = array_values(array_unique($matches[1] ?? []));
        sort($values);
        $expected = ['Female', 'Male', 'Prefer not to say'];
        sort($expected);

        $normalized = strtolower(preg_replace('/[`\\s()]+/', '', $clause) ?? '');
        $compatible = str_contains($normalized, 'sexisnull')
            && str_contains($normalized, 'sexin')
            && $values === $expected;

        if (! $compatible) {
            throw new RuntimeException(
                'Existing ck_profiles_sex is incompatible with the finalized Profile sex vocabulary.'
            );
        }
    }

    private function tableExistsFresh(string $table): bool
    {
        $row = $this->db->query(
            "SELECT EXISTS (
                SELECT 1
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND TABLE_TYPE = 'BASE TABLE'
            ) AS object_exists",
            [$table]
        )->getRowArray();

        return (int) ($row['object_exists'] ?? 0) === 1;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function columnDefinitionFresh(string $table, string $column): ?array
    {
        return $this->db->query(
            'SELECT c.DATA_TYPE, c.CHARACTER_MAXIMUM_LENGTH, c.IS_NULLABLE,
                    c.COLUMN_DEFAULT,
                    (
                        SELECT previous.COLUMN_NAME
                        FROM information_schema.COLUMNS previous
                        WHERE previous.TABLE_SCHEMA = c.TABLE_SCHEMA
                          AND previous.TABLE_NAME = c.TABLE_NAME
                          AND previous.ORDINAL_POSITION = c.ORDINAL_POSITION - 1
                    ) AS preceding_column
             FROM information_schema.COLUMNS c
             WHERE c.TABLE_SCHEMA = DATABASE()
               AND c.TABLE_NAME = ?
               AND c.COLUMN_NAME = ?',
            [$table, $column]
        )->getRowArray() ?: null;
    }

    private function constraintExistsFresh(string $table, string $constraint): bool
    {
        $row = $this->db->query(
            'SELECT EXISTS (
                SELECT 1
                FROM information_schema.TABLE_CONSTRAINTS
                WHERE CONSTRAINT_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND CONSTRAINT_NAME = ?
                  AND CONSTRAINT_TYPE = \'CHECK\'
            ) AS object_exists',
            [$table, $constraint]
        )->getRowArray();

        return (int) ($row['object_exists'] ?? 0) === 1;
    }
}
