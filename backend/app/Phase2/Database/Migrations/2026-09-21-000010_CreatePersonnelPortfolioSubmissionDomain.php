<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreatePersonnelPortfolioSubmissionDomain extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
CREATE TABLE `personnel_portfolio_submissions` (
    `id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `personnel_profile_id`
        CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `evaluation_period_id`
        VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `current_submission_version_id`
        CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,

    `lifecycle_state`
        VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `created_at`
        DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    `updated_at`
        DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`),

    UNIQUE KEY `uq_personnel_portfolio_submission_owner_period`
        (`personnel_profile_id`, `evaluation_period_id`),

    KEY `idx_personnel_portfolio_submissions_period`
        (`evaluation_period_id`),

    KEY `idx_personnel_portfolio_submissions_current_version`
        (`current_submission_version_id`),

    CONSTRAINT `fk_personnel_portfolio_submissions_profile`
        FOREIGN KEY (`personnel_profile_id`)
        REFERENCES `personnel_profiles` (`profile_id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_personnel_portfolio_submissions_period`
        FOREIGN KEY (`evaluation_period_id`)
        REFERENCES `personnel_evaluation_periods` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `chk_personnel_portfolio_submissions_lifecycle`
        CHECK (CHAR_LENGTH(TRIM(`lifecycle_state`)) > 0)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE `personnel_portfolio_submission_versions` (
    `id`
        CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `submission_id`
        CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `version_number`
        INT UNSIGNED NOT NULL,

    `previous_version_id`
        CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,

    `status`
        VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `submitted_at`
        DATETIME(6) NULL,

    `returned_by_profile_id`
        CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,

    `returned_at`
        DATETIME(6) NULL,

    `return_reason`
        TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,

    `finalized_by_profile_id`
        CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,

    `finalized_at`
        DATETIME(6) NULL,

    `revision_token`
        INT UNSIGNED NOT NULL DEFAULT 1,

    `created_at`
        DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`),

    UNIQUE KEY `uq_personnel_portfolio_submission_version_number`
        (`submission_id`, `version_number`),

    KEY `idx_personnel_portfolio_submission_versions_previous`
        (`previous_version_id`),

    KEY `idx_personnel_portfolio_submission_versions_status`
        (`submission_id`, `status`),

    KEY `idx_personnel_portfolio_submission_versions_returned_by`
        (`returned_by_profile_id`),

    KEY `idx_personnel_portfolio_submission_versions_finalized_by`
        (`finalized_by_profile_id`),

    KEY `idx_personnel_portfolio_submission_versions_submitted_at`
        (`submitted_at`),

    CONSTRAINT `fk_personnel_portfolio_submission_versions_submission`
        FOREIGN KEY (`submission_id`)
        REFERENCES `personnel_portfolio_submissions` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_personnel_portfolio_submission_versions_previous`
        FOREIGN KEY (`previous_version_id`)
        REFERENCES `personnel_portfolio_submission_versions` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_personnel_portfolio_submission_versions_returned_by`
        FOREIGN KEY (`returned_by_profile_id`)
        REFERENCES `profiles` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_personnel_portfolio_submission_versions_finalized_by`
        FOREIGN KEY (`finalized_by_profile_id`)
        REFERENCES `profiles` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `chk_personnel_portfolio_submission_versions_number`
        CHECK (`version_number` > 0),

    CONSTRAINT `chk_personnel_portfolio_submission_versions_revision_token`
        CHECK (`revision_token` > 0),

    CONSTRAINT `chk_personnel_portfolio_submission_versions_no_self_previous`
        CHECK (
            `previous_version_id` IS NULL
            OR `previous_version_id` <> `id`
        ),

    CONSTRAINT `chk_personnel_portfolio_submission_versions_status`
        CHECK (
            `status` IN (
                'draft',
                'submitted',
                'in_evaluation',
                'returned_for_revision',
                'ready_for_finalization',
                'completed'
            )
        ),

    CONSTRAINT `chk_personnel_portfolio_submission_versions_submission_time`
        CHECK (
            (
                `status` = 'draft'
                AND `submitted_at` IS NULL
            )
            OR
            (
                `status` <> 'draft'
                AND `submitted_at` IS NOT NULL
            )
        ),

    CONSTRAINT `chk_personnel_portfolio_submission_versions_return_bundle`
        CHECK (
            (
                `status` = 'returned_for_revision'
                AND `returned_by_profile_id` IS NOT NULL
                AND `returned_at` IS NOT NULL
                AND `return_reason` IS NOT NULL
                AND CHAR_LENGTH(TRIM(`return_reason`)) > 0
            )
            OR
            (
                `status` <> 'returned_for_revision'
                AND `returned_by_profile_id` IS NULL
                AND `returned_at` IS NULL
                AND `return_reason` IS NULL
            )
        ),

    CONSTRAINT `chk_personnel_portfolio_submission_versions_finalize_bundle`
        CHECK (
            (
                `status` = 'completed'
                AND `finalized_by_profile_id` IS NOT NULL
                AND `finalized_at` IS NOT NULL
            )
            OR
            (
                `status` <> 'completed'
                AND `finalized_by_profile_id` IS NULL
                AND `finalized_at` IS NULL
            )
        )

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE `personnel_portfolio_submission_items` (
    `submission_version_id`
        CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `achievement_record_version_id`
        CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `display_order`
        INT UNSIGNED NOT NULL DEFAULT 0,

    `included_at`
        DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (
        `submission_version_id`,
        `achievement_record_version_id`
    ),

    KEY `idx_personnel_portfolio_submission_items_record_version`
        (`achievement_record_version_id`),

    KEY `idx_personnel_portfolio_submission_items_order`
        (`submission_version_id`, `display_order`),

    CONSTRAINT `fk_personnel_portfolio_submission_items_submission_version`
        FOREIGN KEY (`submission_version_id`)
        REFERENCES `personnel_portfolio_submission_versions` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_personnel_portfolio_submission_items_record_version`
        FOREIGN KEY (`achievement_record_version_id`)
        REFERENCES `achievement_record_versions` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
SQL);

        $this->db->query(<<<'SQL'
ALTER TABLE `personnel_portfolio_submissions`
    ADD CONSTRAINT `fk_personnel_portfolio_submissions_current_version`
        FOREIGN KEY (`current_submission_version_id`)
        REFERENCES `personnel_portfolio_submission_versions` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION;
SQL);
    }

    public function down()
    {
        $this->db->query(
            'ALTER TABLE `personnel_portfolio_submissions`
             DROP FOREIGN KEY `fk_personnel_portfolio_submissions_current_version`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `personnel_portfolio_submission_items`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `personnel_portfolio_submission_versions`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `personnel_portfolio_submissions`'
        );
    }
}
