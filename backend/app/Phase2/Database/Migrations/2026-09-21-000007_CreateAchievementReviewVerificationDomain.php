<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateAchievementReviewVerificationDomain extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
CREATE TABLE `achievement_field_resolutions` (
    `id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `record_version_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `field_key` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `source_proposal_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,

    `value_type` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `value_text` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `value_date` DATE NULL,
    `value_decimal` DECIMAL(18,6) NULL,
    `value_boolean` TINYINT(1) NULL,

    `action_code` VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `reviewer_profile_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `reason` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,

    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`),

    KEY `idx_achievement_field_resolutions_version_field`
        (`record_version_id`, `field_key`),

    KEY `idx_achievement_field_resolutions_proposal`
        (`source_proposal_id`),

    KEY `idx_achievement_field_resolutions_reviewer`
        (`reviewer_profile_id`),

    KEY `idx_achievement_field_resolutions_created_at`
        (`created_at`),

    CONSTRAINT `fk_achievement_field_resolutions_version`
        FOREIGN KEY (`record_version_id`)
        REFERENCES `achievement_record_versions` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_achievement_field_resolutions_proposal`
        FOREIGN KEY (`source_proposal_id`)
        REFERENCES `machine_field_proposals` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_achievement_field_resolutions_reviewer`
        FOREIGN KEY (`reviewer_profile_id`)
        REFERENCES `profiles` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `chk_achievement_field_resolutions_field_key`
        CHECK (CHAR_LENGTH(TRIM(`field_key`)) > 0),

    CONSTRAINT `chk_achievement_field_resolutions_action`
        CHECK (CHAR_LENGTH(TRIM(`action_code`)) > 0),

    CONSTRAINT `chk_achievement_field_resolutions_value_type`
        CHECK (
            `value_type` IS NULL
            OR `value_type` IN ('TEXT', 'DATE', 'DECIMAL', 'BOOLEAN')
        ),

    CONSTRAINT `chk_achievement_field_resolutions_typed_value`
        CHECK (
            (
                `value_type` IS NULL
                AND `value_text` IS NULL
                AND `value_date` IS NULL
                AND `value_decimal` IS NULL
                AND `value_boolean` IS NULL
            )
            OR
            (
                `value_type` = 'TEXT'
                AND `value_text` IS NOT NULL
                AND `value_date` IS NULL
                AND `value_decimal` IS NULL
                AND `value_boolean` IS NULL
            )
            OR
            (
                `value_type` = 'DATE'
                AND `value_text` IS NULL
                AND `value_date` IS NOT NULL
                AND `value_decimal` IS NULL
                AND `value_boolean` IS NULL
            )
            OR
            (
                `value_type` = 'DECIMAL'
                AND `value_text` IS NULL
                AND `value_date` IS NULL
                AND `value_decimal` IS NOT NULL
                AND `value_boolean` IS NULL
            )
            OR
            (
                `value_type` = 'BOOLEAN'
                AND `value_text` IS NULL
                AND `value_date` IS NULL
                AND `value_decimal` IS NULL
                AND `value_boolean` IS NOT NULL
            )
        ),

    CONSTRAINT `chk_achievement_field_resolutions_boolean`
        CHECK (
            `value_boolean` IS NULL
            OR `value_boolean` IN (0, 1)
        )
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE `achievement_verification_events` (
    `id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `record_version_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `verification_context` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `decision` VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `verifier_profile_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `reason` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,

    `decided_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    `supersedes_verification_event_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,

    `is_current` TINYINT(1) NOT NULL DEFAULT 1,

    `current_guard` TINYINT
        GENERATED ALWAYS AS (
            CASE
                WHEN `is_current` = 1 THEN 1
                ELSE NULL
            END
        ) STORED,

    PRIMARY KEY (`id`),

    UNIQUE KEY `uq_achievement_verification_current`
        (`record_version_id`, `verification_context`, `current_guard`),

    KEY `idx_achievement_verification_version`
        (`record_version_id`),

    KEY `idx_achievement_verification_verifier`
        (`verifier_profile_id`),

    KEY `idx_achievement_verification_supersedes`
        (`supersedes_verification_event_id`),

    KEY `idx_achievement_verification_decided_at`
        (`decided_at`),

    CONSTRAINT `fk_achievement_verification_version`
        FOREIGN KEY (`record_version_id`)
        REFERENCES `achievement_record_versions` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_achievement_verification_verifier`
        FOREIGN KEY (`verifier_profile_id`)
        REFERENCES `profiles` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_achievement_verification_supersedes`
        FOREIGN KEY (`supersedes_verification_event_id`)
        REFERENCES `achievement_verification_events` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `chk_achievement_verification_context`
        CHECK (
            CHAR_LENGTH(TRIM(`verification_context`)) > 0
        ),

    CONSTRAINT `chk_achievement_verification_decision`
        CHECK (
            CHAR_LENGTH(TRIM(`decision`)) > 0
        ),

    CONSTRAINT `chk_achievement_verification_is_current`
        CHECK (`is_current` IN (0, 1)),

    CONSTRAINT `chk_achievement_verification_no_self_supersession`
        CHECK (
            `supersedes_verification_event_id` IS NULL
            OR `supersedes_verification_event_id` <> `id`
        )
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
SQL);
    }

    public function down()
    {
        $this->db->query(
            'DROP TABLE IF EXISTS `achievement_verification_events`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `achievement_field_resolutions`'
        );
    }
}
