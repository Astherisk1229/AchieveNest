<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

/** Restores the canonical evaluation-period domain and its historical bindings. */
class CreatePersonnelEvaluationPeriods extends Migration
{
    public function up()
    {
        $this->assertCanonicalMySQL();
        $this->db->resetDataCache();

        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS personnel_evaluation_periods (
    id VARCHAR(36) PRIMARY KEY,
    period_code VARCHAR(40) NOT NULL UNIQUE,
    period_name VARCHAR(160) NOT NULL,
    evaluation_type ENUM('RANKING_PROMOTION','TENURE_EVALUATION','PERSONNEL_ACCREDITATION_REVIEW') NOT NULL,
    academic_year VARCHAR(9) NOT NULL,
    semester ENUM('1ST_SEMESTER','2ND_SEMESTER','FULL_ACADEMIC_YEAR','CUSTOM_COVERAGE') NOT NULL,
    coverage_label VARCHAR(120) NULL,
    submission_open_at DATETIME NOT NULL,
    submission_close_at DATETIME NOT NULL,
    evaluation_start_at DATETIME NOT NULL,
    evaluation_end_at DATETIME NOT NULL,
    status ENUM('DRAFT','OPEN_FOR_SUBMISSION','SUBMISSION_CLOSED','EVALUATION_ONGOING','CLOSED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    evaluation_scale_version_id VARCHAR(64) NOT NULL,
    created_by VARCHAR(36) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(36) NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    closed_by VARCHAR(36) NULL,
    closed_at DATETIME NULL,
    archived_at DATETIME NULL,
    open_type_guard VARCHAR(64) GENERATED ALWAYS AS (CASE WHEN status = 'OPEN_FOR_SUBMISSION' THEN evaluation_type ELSE NULL END) STORED,
    UNIQUE KEY uq_personnel_period_open_type (open_type_guard),
    KEY idx_personnel_period_status (status),
    KEY idx_personnel_period_year_type (academic_year, evaluation_type),
    KEY idx_personnel_period_scale (evaluation_scale_version_id),
    CONSTRAINT fk_personnel_period_scale FOREIGN KEY (evaluation_scale_version_id) REFERENCES evaluation_scale_versions(id),
    CONSTRAINT fk_personnel_period_creator FOREIGN KEY (created_by) REFERENCES profiles(id),
    CONSTRAINT fk_personnel_period_updater FOREIGN KEY (updated_by) REFERENCES profiles(id),
    CONSTRAINT ck_personnel_period_academic_year CHECK (academic_year REGEXP '^[0-9]{4}-[0-9]{4}$'),
    CONSTRAINT ck_personnel_period_submission_dates CHECK (submission_open_at < submission_close_at),
    CONSTRAINT ck_personnel_period_evaluation_dates CHECK (evaluation_start_at >= submission_close_at AND evaluation_start_at < evaluation_end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);
        $this->assertPeriodTableCompatible();

        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS personnel_evaluation_period_events (
    id VARCHAR(36) PRIMARY KEY,
    evaluation_period_id VARCHAR(36) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    actor_profile_id VARCHAR(36) NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_period_events_period_time (evaluation_period_id, created_at),
    CONSTRAINT fk_period_event_period FOREIGN KEY (evaluation_period_id) REFERENCES personnel_evaluation_periods(id),
    CONSTRAINT fk_period_event_actor FOREIGN KEY (actor_profile_id) REFERENCES profiles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);

        foreach (['personnel_evaluations', 'personnel_evaluation_roots', 'personnel_annual_reviews'] as $table) {
            if (! $this->db->tableExists($table)) {
                continue;
            }
            if (! $this->db->fieldExists('evaluation_period_id', $table)) {
                $this->forge->addColumn($table, [
                    'evaluation_period_id' => ['type' => 'VARCHAR', 'constraint' => 36, 'null' => true],
                ]);
                $this->db->query("CREATE INDEX idx_{$table}_period ON {$table} (evaluation_period_id)");
                $this->db->query(
                    "ALTER TABLE {$table} ADD CONSTRAINT fk_{$table}_period "
                    . 'FOREIGN KEY (evaluation_period_id) REFERENCES personnel_evaluation_periods(id)'
                );
            }
        }

        if ($this->db->tableExists('personnel_evaluations')) {
            $this->addMissingFields('personnel_evaluations', [
                'period_name_snapshot' => ['type' => 'VARCHAR', 'constraint' => 160, 'null' => true],
                'evaluation_type_snapshot' => ['type' => 'VARCHAR', 'constraint' => 50, 'null' => true],
                'coverage_label_snapshot' => ['type' => 'VARCHAR', 'constraint' => 120, 'null' => true],
                'evaluation_scale_version_id' => ['type' => 'VARCHAR', 'constraint' => 64, 'null' => true],
            ]);
        }

        if ($this->db->tableExists('personnel_qualification_reviews')) {
            $this->addMissingFields('personnel_qualification_reviews', [
                'evaluation_period_id' => ['type' => 'VARCHAR', 'constraint' => 36, 'null' => true],
                'academic_year' => ['type' => 'VARCHAR', 'constraint' => 9, 'null' => true],
                'eligibility_decision' => ['type' => 'VARCHAR', 'constraint' => 30, 'null' => true],
                'report_label' => ['type' => 'VARCHAR', 'constraint' => 160, 'null' => true],
                'benchmark_reference' => ['type' => 'TEXT', 'null' => true],
                'decision_basis' => ['type' => 'TEXT', 'null' => true],
                'report_version' => ['type' => 'VARCHAR', 'constraint' => 40, 'null' => true],
                'evaluated_at' => ['type' => 'DATETIME', 'null' => true],
                'created_at' => ['type' => 'DATETIME', 'null' => true],
            ]);
        }
    }

    public function down()
    {
        $this->assertCanonicalMySQL();

        foreach (['personnel_annual_reviews', 'personnel_evaluation_roots', 'personnel_evaluations'] as $table) {
            if ($this->db->tableExists($table) && $this->db->fieldExists('evaluation_period_id', $table)) {
                $this->dropForeignKeyIfExists($table, "fk_{$table}_period");
                $this->forge->dropColumn($table, 'evaluation_period_id');
            }
        }

        $this->forge->dropTable('personnel_evaluation_period_events', true);
        $this->forge->dropTable('personnel_evaluation_periods', true);
    }

    private function assertCanonicalMySQL(): void
    {
        if ($this->db->DBDriver !== 'MySQLi') {
            throw new RuntimeException('Canonical personnel evaluation periods require MySQLi.');
        }
    }

    private function assertPeriodTableCompatible(): void
    {
        foreach ([
            'id', 'period_code', 'period_name', 'evaluation_type', 'academic_year',
            'semester', 'submission_open_at', 'submission_close_at',
            'evaluation_start_at', 'evaluation_end_at', 'status',
            'evaluation_scale_version_id', 'created_by',
        ] as $field) {
            if (! $this->db->fieldExists($field, 'personnel_evaluation_periods')) {
                throw new RuntimeException(
                    "Existing personnel_evaluation_periods table is incompatible: missing {$field}."
                );
            }
        }
    }

    private function addMissingFields(string $table, array $fields): void
    {
        foreach ($fields as $name => $definition) {
            if (! $this->db->fieldExists($name, $table)) {
                $this->forge->addColumn($table, [$name => $definition]);
            }
        }
    }

    private function dropForeignKeyIfExists(string $table, string $constraint): void
    {
        $row = $this->db->query(
            'SELECT CONSTRAINT_NAME FROM information_schema.REFERENTIAL_CONSTRAINTS '
            . 'WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?',
            [$table, $constraint]
        )->getRowArray();

        if ($row !== null) {
            $this->db->query("ALTER TABLE {$table} DROP FOREIGN KEY {$constraint}");
        }
    }
}
