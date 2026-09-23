<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateAchievementDuplicateResolutionDomain extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
CREATE TABLE `achievement_duplicate_candidates` (
    `id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `record_low_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `record_high_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `detection_context` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `signal_summary` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `signal_score` DECIMAL(6,5) NULL,
    `signal_metadata` JSON NULL,

    `candidate_state` VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `is_active` TINYINT(1) NOT NULL DEFAULT 1,

    `active_guard` TINYINT
        GENERATED ALWAYS AS (
            CASE
                WHEN `is_active` = 1 THEN 1
                ELSE NULL
            END
        ) STORED,

    `detected_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`),

    UNIQUE KEY `uq_achievement_duplicate_active_pair_context`
        (`record_low_id`, `record_high_id`, `detection_context`, `active_guard`),

    KEY `idx_achievement_duplicate_candidates_low`
        (`record_low_id`),

    KEY `idx_achievement_duplicate_candidates_high`
        (`record_high_id`),

    KEY `idx_achievement_duplicate_candidates_context_state`
        (`detection_context`, `candidate_state`),

    KEY `idx_achievement_duplicate_candidates_detected_at`
        (`detected_at`),

    CONSTRAINT `fk_achievement_duplicate_candidates_low`
        FOREIGN KEY (`record_low_id`)
        REFERENCES `achievement_records` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_achievement_duplicate_candidates_high`
        FOREIGN KEY (`record_high_id`)
        REFERENCES `achievement_records` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `chk_achievement_duplicate_candidates_no_self`
        CHECK (`record_low_id` <> `record_high_id`),

    CONSTRAINT `chk_achievement_duplicate_candidates_context`
        CHECK (CHAR_LENGTH(TRIM(`detection_context`)) > 0),

    CONSTRAINT `chk_achievement_duplicate_candidates_state`
        CHECK (CHAR_LENGTH(TRIM(`candidate_state`)) > 0),

    CONSTRAINT `chk_achievement_duplicate_candidates_active`
        CHECK (`is_active` IN (0, 1)),

    CONSTRAINT `chk_achievement_duplicate_candidates_signal_score`
        CHECK (
            `signal_score` IS NULL
            OR (
                `signal_score` >= 0
                AND `signal_score` <= 1
            )
        )
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE `achievement_canonicalization_decisions` (
    `id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `duplicate_candidate_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `outcome_code` VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `surviving_record_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,

    `decided_by_profile_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `reason` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,

    `decided_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`),

    KEY `idx_achievement_canonicalization_candidate`
        (`duplicate_candidate_id`),

    KEY `idx_achievement_canonicalization_survivor`
        (`surviving_record_id`),

    KEY `idx_achievement_canonicalization_decided_by`
        (`decided_by_profile_id`),

    KEY `idx_achievement_canonicalization_decided_at`
        (`decided_at`),

    CONSTRAINT `fk_achievement_canonicalization_candidate`
        FOREIGN KEY (`duplicate_candidate_id`)
        REFERENCES `achievement_duplicate_candidates` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_achievement_canonicalization_survivor`
        FOREIGN KEY (`surviving_record_id`)
        REFERENCES `achievement_records` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_achievement_canonicalization_decided_by`
        FOREIGN KEY (`decided_by_profile_id`)
        REFERENCES `profiles` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `chk_achievement_canonicalization_outcome`
        CHECK (CHAR_LENGTH(TRIM(`outcome_code`)) > 0)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
SQL);
    }

    public function down()
    {
        $this->db->query(
            'DROP TABLE IF EXISTS `achievement_canonicalization_decisions`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `achievement_duplicate_candidates`'
        );
    }
}
