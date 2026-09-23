<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class HardenPersonnelEvaluationPeriods extends Migration
{
    public function up()
    {
        $this->db->query('ALTER TABLE personnel_evaluation_periods MODIFY semester ENUM(\'1ST_SEMESTER\',\'2ND_SEMESTER\',\'FULL_ACADEMIC_YEAR\',\'CUSTOM_COVERAGE\') NULL');
        foreach (['submission_open_at', 'submission_close_at', 'evaluation_start_at', 'evaluation_end_at'] as $field) {
            $this->db->query("ALTER TABLE personnel_evaluation_periods MODIFY `{$field}` DATETIME NULL");
        }
        $this->db->query('ALTER TABLE personnel_evaluation_periods MODIFY evaluation_scale_version_id VARCHAR(64) NULL');
        if (! $this->db->fieldExists('version', 'personnel_evaluation_periods')) {
            $this->db->query('ALTER TABLE personnel_evaluation_periods ADD COLUMN version INT UNSIGNED NOT NULL DEFAULT 1 AFTER status');
        }
        if (! $this->db->fieldExists('coverage_identity', 'personnel_evaluation_periods')) {
            $this->db->query("ALTER TABLE personnel_evaluation_periods ADD COLUMN coverage_identity VARCHAR(180) GENERATED ALWAYS AS (CONCAT(semester, ':', LOWER(TRIM(COALESCE(coverage_label, ''))))) STORED");
            $this->db->query('ALTER TABLE personnel_evaluation_periods ADD UNIQUE KEY uq_personnel_period_identity (evaluation_type, academic_year, coverage_identity)');
        }
        if (! $this->db->fieldExists('request_id', 'personnel_evaluation_period_events')) {
            $this->db->query('ALTER TABLE personnel_evaluation_period_events ADD COLUMN request_id VARCHAR(100) NULL AFTER actor_profile_id');
            $this->db->query('ALTER TABLE personnel_evaluation_period_events ADD UNIQUE KEY uq_period_event_request (evaluation_period_id, event_type, request_id)');
        }

        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS personnel_evaluation_idempotency (
    id VARCHAR(36) PRIMARY KEY,
    actor_profile_id VARCHAR(36) NOT NULL,
    operation VARCHAR(80) NOT NULL,
    idempotency_key VARCHAR(100) NOT NULL,
    request_hash CHAR(64) NOT NULL,
    resource_id VARCHAR(36) NULL,
    response_status SMALLINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_personnel_period_idempotency (actor_profile_id, operation, idempotency_key),
    KEY idx_personnel_period_idempotency_resource (resource_id),
    CONSTRAINT fk_personnel_period_idempotency_actor FOREIGN KEY (actor_profile_id) REFERENCES profiles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);

        if ($this->db->tableExists('personnel_evaluation_roots') && $this->db->fieldExists('evaluation_period_id', 'personnel_evaluation_roots')) {
            $this->addUniqueIfMissing('personnel_evaluation_roots', 'uq_personnel_root_profile_period', ['personnel_profile_id', 'evaluation_period_id']);
        }
        if ($this->db->tableExists('personnel_evaluation_items') && $this->db->fieldExists('accomplishment_id', 'personnel_evaluation_items')) {
            $this->addUniqueIfMissing('personnel_evaluation_items', 'uq_personnel_snapshot_accomplishment', ['evaluation_id', 'accomplishment_id']);
        }
    }

    private function addUniqueIfMissing(string $table, string $name, array $columns): void
    {
        $exists = $this->db->query(
            'SELECT COUNT(*) AS c FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?',
            [$table, $name]
        )->getRowArray();
        if ((int) ($exists['c'] ?? 0) === 0) {
            $quoted = implode(', ', array_map(static fn (string $column): string => "`{$column}`", $columns));
            $this->db->query("ALTER TABLE `{$table}` ADD UNIQUE KEY `{$name}` ({$quoted})");
        }
    }

    public function down()
    {
        $this->forge->dropTable('personnel_evaluation_idempotency', true);
        if ($this->db->fieldExists('request_id', 'personnel_evaluation_period_events')) $this->forge->dropColumn('personnel_evaluation_period_events', 'request_id');
        if ($this->db->fieldExists('coverage_identity', 'personnel_evaluation_periods')) $this->forge->dropColumn('personnel_evaluation_periods', 'coverage_identity');
        if ($this->db->fieldExists('version', 'personnel_evaluation_periods')) $this->forge->dropColumn('personnel_evaluation_periods', 'version');
    }
}
