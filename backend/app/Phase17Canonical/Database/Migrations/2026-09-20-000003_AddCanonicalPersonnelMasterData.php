<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

/**
 * Reconciles the canonical personnel profile with the finalized Personnel
 * classification and HR-controlled master-data model from legacy migrations
 * 000060 and 000061.
 */
class AddCanonicalPersonnelMasterData extends Migration
{
    private const TABLE = 'personnel_profiles';

    public function up(): void
    {
        if (! $this->tableExistsFresh(self::TABLE)) {
            throw new RuntimeException('Required table personnel_profiles does not exist.');
        }

        $this->addColumnIfMissing('personnel_group', [
            'type'       => 'VARCHAR',
            'constraint' => 32,
            'null'       => true,
            'default'    => null,
            'after'      => 'updated_at',
        ]);
        $this->addColumnIfMissing('organizational_side', [
            'type'       => 'VARCHAR',
            'constraint' => 32,
            'null'       => true,
            'default'    => null,
            'after'      => 'personnel_group',
        ]);
        $this->addColumnIfMissing('faculty_engagement', [
            'type'       => 'VARCHAR',
            'constraint' => 32,
            'null'       => true,
            'default'    => null,
            'after'      => 'organizational_side',
        ]);
        $this->addColumnIfMissing('position_title', [
            'type'       => 'VARCHAR',
            'constraint' => 150,
            'null'       => true,
            'default'    => null,
            'after'      => 'faculty_engagement',
        ]);
        $this->addColumnIfMissing('current_rank_title', [
            'type'       => 'VARCHAR',
            'constraint' => 100,
            'null'       => true,
            'default'    => null,
            'after'      => 'position_title',
        ]);
        $this->addColumnIfMissing('qualification_summary', [
            'type'       => 'VARCHAR',
            'constraint' => 255,
            'null'       => true,
            'default'    => null,
            'after'      => 'current_rank_title',
        ]);

        // Legacy 000060 replaces both values whenever either side is absent.
        $this->db->query(
            "UPDATE `personnel_profiles`
             SET `personnel_group` = CASE
                     WHEN LOWER(TRIM(`personnel_classification`)) = 'academic' THEN 'faculty'
                     ELSE 'non_teaching_faculty'
                 END,
                 `organizational_side` = CASE
                     WHEN LOWER(TRIM(`personnel_classification`)) = 'academic' THEN 'academic'
                     ELSE 'non_academic'
                 END
             WHERE `personnel_group` IS NULL OR TRIM(`personnel_group`) = ''
                OR `organizational_side` IS NULL OR TRIM(`organizational_side`) = ''"
        );

        // Engagement must be derived before the obsolete employment vocabulary
        // is reconciled because legacy part_time carries the authoritative signal.
        $this->db->query(
            "UPDATE `personnel_profiles`
             SET `faculty_engagement` = CASE
                     WHEN LOWER(TRIM(`employment_status`)) = 'part_time' THEN 'part_time_faculty'
                     ELSE 'full_time_faculty'
                 END
             WHERE (`faculty_engagement` IS NULL OR TRIM(`faculty_engagement`) = '')
               AND (
                    LOWER(TRIM(`personnel_group`)) IN ('faculty', 'non_teaching_faculty')
                    OR LOWER(TRIM(`personnel_classification`)) = 'academic'
               )"
        );

        if ($this->constraintExistsFresh(self::TABLE, 'ck_personnel_profiles_employment_status')) {
            $this->db->query(
                'ALTER TABLE `personnel_profiles` DROP CHECK `ck_personnel_profiles_employment_status`'
            );
        }

        // Legacy 000061 preserves probationary and maps every other value to permanent.
        $this->db->query(
            "UPDATE `personnel_profiles`
             SET `employment_status` = CASE
                     WHEN LOWER(TRIM(`employment_status`)) = 'probationary' THEN 'probationary'
                     ELSE 'permanent'
                 END"
        );

        $this->db->query(
            "UPDATE `personnel_profiles` pp
             JOIN `profiles` p ON p.`id` = pp.`profile_id`
             SET pp.`position_title` = COALESCE(
                     pp.`position_title`, p.`designation_title`, 'Faculty Member'
                 ),
                 pp.`current_rank_title` = COALESCE(
                     pp.`current_rank_title`, NULLIF(pp.`rank_level`, ''),
                     p.`designation_title`, 'Faculty Member'
                 ),
                 pp.`qualification_summary` = COALESCE(
                     pp.`qualification_summary`, 'Bachelor Degree / Masteral Units'
                 )"
        );

        $this->db->query(
            "UPDATE `personnel_profiles`
             SET `rank_level` = `current_rank_title`
             WHERE `current_rank_title` IS NOT NULL"
        );

        $this->db->query(
            "ALTER TABLE `personnel_profiles`
             MODIFY `employment_status` VARCHAR(30) NOT NULL DEFAULT 'permanent'"
        );

        if (! $this->constraintExistsFresh(self::TABLE, 'ck_personnel_valid_classification_pair')) {
            $this->db->query(
                "ALTER TABLE `personnel_profiles`
                 ADD CONSTRAINT `ck_personnel_valid_classification_pair` CHECK (
                     (`personnel_group` = 'faculty' AND `organizational_side` = 'academic')
                     OR (`personnel_group` = 'non_teaching_faculty' AND `organizational_side` = 'academic')
                     OR (`personnel_group` = 'non_teaching_faculty' AND `organizational_side` = 'non_academic')
                 )"
            );
        }

        if (! $this->constraintExistsFresh(self::TABLE, 'ck_personnel_faculty_engagement')) {
            $this->db->query(
                "ALTER TABLE `personnel_profiles`
                 ADD CONSTRAINT `ck_personnel_faculty_engagement` CHECK (
                     `faculty_engagement` IS NULL
                     OR `faculty_engagement` IN ('full_time_faculty', 'part_time_faculty')
                 )"
            );
        }

        if (! $this->constraintExistsFresh(self::TABLE, 'ck_personnel_employment_status_d2')) {
            $this->db->query(
                "ALTER TABLE `personnel_profiles`
                 ADD CONSTRAINT `ck_personnel_employment_status_d2` CHECK (
                     `employment_status` IN ('permanent', 'probationary')
                 )"
            );
        }

        if (! $this->indexExistsFresh(self::TABLE, 'idx_personnel_group_side')) {
            $this->db->query(
                'CREATE INDEX `idx_personnel_group_side` '
                . 'ON `personnel_profiles` (`personnel_group`, `organizational_side`)'
            );
        }

        if (! $this->indexExistsFresh(self::TABLE, 'idx_personnel_status_engagement')) {
            $this->db->query(
                'CREATE INDEX `idx_personnel_status_engagement` '
                . 'ON `personnel_profiles` (`faculty_engagement`, `employment_status`)'
            );
        }
    }

    public function down(): void
    {
        throw new RuntimeException(
            'Automatic rollback is intentionally disabled: this migration reconciles '
            . 'employment-status values and populates Personnel master-data columns. '
            . 'Reversal could silently discard or misrepresent authoritative data.'
        );
    }

    /**
     * @param array<string, mixed> $definition
     */
    private function addColumnIfMissing(string $column, array $definition): void
    {
        if (! $this->columnExistsFresh(self::TABLE, $column)) {
            $this->forge->addColumn(self::TABLE, [$column => $definition]);
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

    private function columnExistsFresh(string $table, string $column): bool
    {
        $row = $this->db->query(
            'SELECT EXISTS (
                SELECT 1
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND COLUMN_NAME = ?
            ) AS object_exists',
            [$table, $column]
        )->getRowArray();

        return (int) ($row['object_exists'] ?? 0) === 1;
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
            ) AS object_exists',
            [$table, $constraint]
        )->getRowArray();

        return (int) ($row['object_exists'] ?? 0) === 1;
    }

    private function indexExistsFresh(string $table, string $index): bool
    {
        $row = $this->db->query(
            'SELECT EXISTS (
                SELECT 1
                FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND INDEX_NAME = ?
            ) AS object_exists',
            [$table, $index]
        )->getRowArray();

        return (int) ($row['object_exists'] ?? 0) === 1;
    }
}
