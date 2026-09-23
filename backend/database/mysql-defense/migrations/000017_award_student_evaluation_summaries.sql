-- ============================================================================
-- AchieveNest MySQL Defense Migration
-- 000017_award_student_evaluation_summaries.sql
--
-- Phase G: Portfolio-Based Award Evaluation Summary
-- Additive schema expansion for reproducible student award evaluation summary snapshots.
-- ============================================================================

CREATE TABLE IF NOT EXISTS `award_student_evaluation_summaries` (
    `id` CHAR(36) NOT NULL,
    `evaluation_id` CHAR(36) NOT NULL,
    `student_profile_id` CHAR(36) NOT NULL,
    `award_definition_id` CHAR(36) NOT NULL,
    `cycle_id` CHAR(36) NOT NULL,
    `scoring_model_version_id` CHAR(36) NULL,
    `summary_payload` JSON NOT NULL,
    `raw_score` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `max_computable_score` DECIMAL(10,2) NOT NULL DEFAULT 100.00,
    `potential_score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `candidate_threshold_percent` DECIMAL(5,2) NOT NULL DEFAULT 80.00,
    `qualifies_portfolio_based` TINYINT(1) NOT NULL DEFAULT 0,
    `candidate_pathway` VARCHAR(50) NOT NULL DEFAULT 'automatic_portfolio',
    `generated_by` CHAR(36) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_ases_eval` (`evaluation_id`),
    KEY `idx_ases_student` (`student_profile_id`),
    KEY `idx_ases_award` (`award_definition_id`),
    KEY `idx_ases_cycle` (`cycle_id`),
    KEY `idx_ases_version` (`scoring_model_version_id`),
    CONSTRAINT `fk_ases_eval` FOREIGN KEY (`evaluation_id`) REFERENCES `student_award_evaluations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ases_student` FOREIGN KEY (`student_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ases_award` FOREIGN KEY (`award_definition_id`) REFERENCES `award_definitions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ases_cycle` FOREIGN KEY (`cycle_id`) REFERENCES `award_cycles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
