<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class ScopePersonnelPeriodConcurrencyByTrack extends Migration
{
    public function up()
    {
        $this->dropIndexIfExists('personnel_evaluation_periods', 'uq_personnel_period_open_type');
        $this->db->query(<<<'SQL'
ALTER TABLE personnel_evaluation_periods
MODIFY COLUMN open_type_guard VARCHAR(128)
GENERATED ALWAYS AS (
    CASE
        WHEN status = 'OPEN_FOR_SUBMISSION'
        THEN CONCAT(evaluation_type, ':', personnel_group)
        ELSE NULL
    END
) STORED
SQL);
        $this->db->query('ALTER TABLE personnel_evaluation_periods ADD UNIQUE KEY uq_personnel_period_open_track (open_type_guard)');

        $this->dropIndexIfExists('personnel_evaluation_periods', 'uq_personnel_period_identity');
        $this->db->query('ALTER TABLE personnel_evaluation_periods ADD UNIQUE KEY uq_personnel_period_track_identity (evaluation_type, personnel_group, academic_year, coverage_identity)');
    }

    public function down()
    {
        $this->dropIndexIfExists('personnel_evaluation_periods', 'uq_personnel_period_open_track');
        $this->db->query(<<<'SQL'
ALTER TABLE personnel_evaluation_periods
MODIFY COLUMN open_type_guard VARCHAR(64)
GENERATED ALWAYS AS (CASE WHEN status = 'OPEN_FOR_SUBMISSION' THEN evaluation_type ELSE NULL END) STORED
SQL);
        $this->db->query('ALTER TABLE personnel_evaluation_periods ADD UNIQUE KEY uq_personnel_period_open_type (open_type_guard)');

        $this->dropIndexIfExists('personnel_evaluation_periods', 'uq_personnel_period_track_identity');
        $this->db->query('ALTER TABLE personnel_evaluation_periods ADD UNIQUE KEY uq_personnel_period_identity (evaluation_type, academic_year, coverage_identity)');
    }

    private function dropIndexIfExists(string $table, string $index): void
    {
        $row = $this->db->query(
            'SELECT COUNT(*) AS total FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?',
            [$table, $index]
        )->getRowArray();
        if ((int) ($row['total'] ?? 0) > 0) {
            $this->db->query("ALTER TABLE `{$table}` DROP INDEX `{$index}`");
        }
    }
}
