<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Reconciles schema drift found by the wiring audit (backend/tools/schema-check).
 *
 * The application code depends on tables and columns that exist in the 2026-09-26 runtime
 * database but are created by no migration in the Canonical/Phase2 chain (a database rebuilt
 * from migrations alone cannot run Dean review, rank recommendation, HR evaluation
 * finalization or the portfolio usage guard), plus one column the code expects on
 * `notifications` that exists nowhere (`idempotency_key`, used when opening a submission
 * period). This migration adds them. Every step checks for the object first, so it is a no-op
 * on a database that already has it. Definitions for runtime-only objects are copied from
 * db-backups/phase_d_auth_final_schema.sql.
 *
 * down() is intentionally a no-op: these objects may hold live data on the runtime database.
 */
final class ReconcileRuntimeSchemaDrift extends Migration
{
    public function up()
    {
        $this->db->query('SET FOREIGN_KEY_CHECKS = 0');
        try {
            $this->createTable(<<<'SQL'
CREATE TABLE IF NOT EXISTS `personnel_achievement_usage` (
  `id` varchar(36) NOT NULL,
  `achievement_id` varchar(36) NOT NULL,
  `personnel_profile_id` varchar(36) NOT NULL,
  `portfolio_submission_id` varchar(36) NOT NULL,
  `academic_year` varchar(20) NOT NULL,
  `used_at` datetime NOT NULL,
  `reuse_lock_years` int NOT NULL DEFAULT '2',
  `eligible_again_academic_year` varchar(20) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_achievement_submission` (`achievement_id`,`portfolio_submission_id`),
  KEY `idx_personnel_profile` (`personnel_profile_id`),
  KEY `idx_achievement` (`achievement_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
SQL);
            $this->createTable(<<<'SQL'
CREATE TABLE IF NOT EXISTS `personnel_evaluation_roots` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `personnel_profile_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `evaluation_cycle_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `academic_year` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '2025-2026',
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `evaluation_period_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_personnel_eval_roots_profile_cycle` (`personnel_profile_id`,`evaluation_cycle_id`),
  UNIQUE KEY `uq_personnel_root_profile_period` (`personnel_profile_id`,`evaluation_period_id`),
  KEY `idx_personnel_eval_roots_profile` (`personnel_profile_id`),
  KEY `idx_personnel_evaluation_roots_period` (`evaluation_period_id`),
  CONSTRAINT `fk_personnel_evaluation_roots_period` FOREIGN KEY (`evaluation_period_id`) REFERENCES `personnel_evaluation_periods` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);
            $this->createTable(<<<'SQL'
CREATE TABLE IF NOT EXISTS `personnel_qualifications` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `personnel_profile_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `qualification_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'degree',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `institution` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `year_obtained` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_highest` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `personnel_profile_id` (`personnel_profile_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);
            $this->addColumn('dean_assignments', 'ended_by', <<<'SQL'
`ended_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
SQL);
            $this->addColumn('dean_assignments', 'ended_at', <<<'SQL'
`ended_at` datetime(6) DEFAULT NULL
SQL);
            $this->addColumn('dean_assignments', 'end_reason', <<<'SQL'
`end_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
SQL);
            $this->addColumn('personnel_accomplishments', 'category_code', <<<'SQL'
`category_code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
SQL);
            $this->addColumn('personnel_accomplishments', 'category_area', <<<'SQL'
`category_area` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
SQL);
            $this->addColumn('personnel_accomplishments', 'category_metadata', <<<'SQL'
`category_metadata` json DEFAULT NULL
SQL);
            $this->addColumn('personnel_evaluation_items', 'scoring_payload', <<<'SQL'
`scoring_payload` json DEFAULT NULL
SQL);
            $this->addColumn('personnel_evaluation_items', 'raw_points', <<<'SQL'
`raw_points` decimal(10,2) DEFAULT NULL
SQL);
            $this->addColumn('personnel_evaluation_items', 'criterion_capped_points', <<<'SQL'
`criterion_capped_points` decimal(10,2) DEFAULT NULL
SQL);
            $this->addColumn('personnel_evaluation_items', 'awarded_points', <<<'SQL'
`awarded_points` decimal(10,2) DEFAULT NULL
SQL);
            $this->addColumn('personnel_evaluation_items', 'evaluator_judgment_required', <<<'SQL'
`evaluator_judgment_required` tinyint(1) NOT NULL DEFAULT '0'
SQL);
            $this->addColumn('personnel_evaluation_items', 'max_allowed_points', <<<'SQL'
`max_allowed_points` decimal(10,2) DEFAULT NULL
SQL);
            $this->addColumn('personnel_evaluation_items', 'accepted_points', <<<'SQL'
`accepted_points` decimal(10,2) DEFAULT NULL
SQL);
            $this->addColumn('personnel_evaluations', 'version_number', <<<'SQL'
`version_number` int NOT NULL DEFAULT '1'
SQL);
            $this->addColumn('personnel_evaluations', 'evaluation_root_id', <<<'SQL'
`evaluation_root_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
SQL);
            $this->addColumn('personnel_evaluations', 'previous_version_id', <<<'SQL'
`previous_version_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
SQL);
            $this->addColumn('personnel_evaluations', 'evaluation_cycle_id', <<<'SQL'
`evaluation_cycle_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
SQL);
            $this->addColumn('personnel_evaluations', 'submission_type', <<<'SQL'
`submission_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Personnel Ranking Evaluation'
SQL);
            $this->addColumn('personnel_evaluations', 'return_reason', <<<'SQL'
`return_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
SQL);
            $this->addColumn('personnel_evaluations', 'evaluator_remarks', <<<'SQL'
`evaluator_remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
SQL);
            $this->addColumn('personnel_evaluations', 'returned_at', <<<'SQL'
`returned_at` datetime(6) DEFAULT NULL
SQL);
            $this->addColumn('personnel_evaluations', 'final_snapshot', <<<'SQL'
`final_snapshot` json DEFAULT NULL
SQL);
            $this->addColumn('personnel_evaluations', 'area_a_score', <<<'SQL'
`area_a_score` decimal(5,2) NOT NULL DEFAULT '0.00'
SQL);
            $this->addColumn('personnel_evaluations', 'area_b_score', <<<'SQL'
`area_b_score` decimal(5,2) NOT NULL DEFAULT '0.00'
SQL);
            $this->addColumn('personnel_evaluations', 'area_c_score', <<<'SQL'
`area_c_score` decimal(5,2) NOT NULL DEFAULT '0.00'
SQL);
            $this->addColumn('personnel_evaluations', 'tenure_years', <<<'SQL'
`tenure_years` int NOT NULL DEFAULT '0'
SQL);
            $this->addColumn('personnel_profiles', 'employment_start_date', <<<'SQL'
`employment_start_date` date DEFAULT NULL
SQL);
            $this->addColumn('student_award_evaluations', 'candidate_status', <<<'SQL'
`candidate_status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'NOT_CLASSIFIED'
SQL);
            $this->addColumn('student_award_evaluations', 'candidate_classified_at', <<<'SQL'
`candidate_classified_at` datetime(6) DEFAULT NULL
SQL);
            $this->addColumn('notifications', 'idempotency_key', <<<'SQL'
`idempotency_key` char(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `reference_id`
SQL);
            $this->addIndex('notifications', 'uq_notifications_idempotency_key', <<<'SQL'
UNIQUE KEY `uq_notifications_idempotency_key` (`idempotency_key`)
SQL);
        } finally {
            $this->db->query('SET FOREIGN_KEY_CHECKS = 1');
        }
    }

    public function down()
    {
        // Intentionally empty; see class comment.
    }

    private function createTable(string $sql): void
    {
        $this->db->query($sql);
    }

    private function addColumn(string $table, string $column, string $definition): void
    {
        if (! $this->db->fieldExists($column, $table)) {
            $this->db->query("ALTER TABLE `{$table}` ADD COLUMN {$definition}");
        }
    }

    private function addIndex(string $table, string $index, string $definition): void
    {
        $found = $this->db->query(
            'SELECT COUNT(*) AS c FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?',
            [$table, $index]
        )->getRow()->c;
        if ((int) $found === 0) {
            $this->db->query("ALTER TABLE `{$table}` ADD {$definition}");
        }
    }

    private function addConstraint(string $table, string $name, string $definition): void
    {
        $found = $this->db->query(
            'SELECT COUNT(*) AS c FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = ? AND constraint_name = ?',
            [$table, $name]
        )->getRow()->c;
        if ((int) $found === 0) {
            $this->db->query("ALTER TABLE `{$table}` ADD {$definition}");
        }
    }
}
