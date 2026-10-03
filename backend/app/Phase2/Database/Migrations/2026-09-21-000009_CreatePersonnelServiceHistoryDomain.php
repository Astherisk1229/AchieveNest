<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreatePersonnelServiceHistoryDomain extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
CREATE TABLE `personnel_service_histories` (
    `id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `personnel_profile_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `stream_code` VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `current_version_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `lifecycle_state` VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`),

    UNIQUE KEY `uq_personnel_service_history_owner_stream`
        (`personnel_profile_id`, `stream_code`),

    KEY `idx_personnel_service_histories_current_version`
        (`current_version_id`),

    CONSTRAINT `fk_personnel_service_histories_profile`
        FOREIGN KEY (`personnel_profile_id`)
        REFERENCES `personnel_profiles` (`profile_id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `chk_personnel_service_histories_stream`
        CHECK (CHAR_LENGTH(TRIM(`stream_code`)) > 0),

    CONSTRAINT `chk_personnel_service_histories_lifecycle`
        CHECK (CHAR_LENGTH(TRIM(`lifecycle_state`)) > 0)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE `personnel_service_history_versions` (
    `id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `service_history_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `version_number` INT UNSIGNED NOT NULL,
    `previous_version_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,

    `resolution_status` VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `countable_days` INT UNSIGNED NULL,

    `resolved_by_profile_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `resolved_at` DATETIME(6) NULL,

    `policy_rule_version_reference`
        VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,

    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`),

    UNIQUE KEY `uq_personnel_service_history_version_number`
        (`service_history_id`, `version_number`),

    KEY `idx_personnel_service_history_versions_previous`
        (`previous_version_id`),

    KEY `idx_personnel_service_history_versions_resolution`
        (`service_history_id`, `resolution_status`),

    KEY `idx_personnel_service_history_versions_resolved_by`
        (`resolved_by_profile_id`),

    CONSTRAINT `fk_personnel_service_history_versions_history`
        FOREIGN KEY (`service_history_id`)
        REFERENCES `personnel_service_histories` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_personnel_service_history_versions_previous`
        FOREIGN KEY (`previous_version_id`)
        REFERENCES `personnel_service_history_versions` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_personnel_service_history_versions_resolved_by`
        FOREIGN KEY (`resolved_by_profile_id`)
        REFERENCES `profiles` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `chk_personnel_service_history_versions_number`
        CHECK (`version_number` > 0),

    CONSTRAINT `chk_personnel_service_history_versions_no_self_previous`
        CHECK (
            `previous_version_id` IS NULL
            OR `previous_version_id` <> `id`
        ),

    CONSTRAINT `chk_personnel_service_history_versions_resolution_status`
        CHECK (CHAR_LENGTH(TRIM(`resolution_status`)) > 0),

    CONSTRAINT `chk_personnel_service_history_versions_resolver_bundle`
        CHECK (
            (
                `resolved_by_profile_id` IS NULL
                AND `resolved_at` IS NULL
            )
            OR
            (
                `resolved_by_profile_id` IS NOT NULL
                AND `resolved_at` IS NOT NULL
            )
        )

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE `personnel_service_segments` (
    `id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `service_history_version_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `period_precision` VARCHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `period_start_year` SMALLINT UNSIGNED NULL,
    `period_start_month` TINYINT UNSIGNED NULL,
    `period_start_day` TINYINT UNSIGNED NULL,

    `period_end_year` SMALLINT UNSIGNED NULL,
    `period_end_month` TINYINT UNSIGNED NULL,
    `period_end_day` TINYINT UNSIGNED NULL,

    `is_ongoing` TINYINT(1) NOT NULL DEFAULT 0,

    `source_period_text`
        VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,

    `source_classification`
        VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `countability_state`
        VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `source_remarks` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `hr_reason` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,

    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`),

    KEY `idx_personnel_service_segments_version`
        (`service_history_version_id`),

    KEY `idx_personnel_service_segments_countability`
        (`countability_state`),

    KEY `idx_personnel_service_segments_source_class`
        (`source_classification`),

    CONSTRAINT `fk_personnel_service_segments_version`
        FOREIGN KEY (`service_history_version_id`)
        REFERENCES `personnel_service_history_versions` (`id`)
        ON DELETE CASCADE
        ON UPDATE NO ACTION,

    CONSTRAINT `chk_personnel_service_segment_precision`
        CHECK (
            `period_precision` IN (
                'YEAR',
                'MONTH',
                'DATE',
                'RANGE',
                'ACADEMIC_YEAR',
                'NAMED_PERIOD'
            )
        ),

    CONSTRAINT `chk_personnel_service_segment_start_year`
        CHECK (
            `period_start_year` IS NULL
            OR `period_start_year` BETWEEN 1000 AND 9999
        ),

    CONSTRAINT `chk_personnel_service_segment_start_month`
        CHECK (
            `period_start_month` IS NULL
            OR `period_start_month` BETWEEN 1 AND 12
        ),

    CONSTRAINT `chk_personnel_service_segment_start_day`
        CHECK (
            `period_start_day` IS NULL
            OR `period_start_day` BETWEEN 1 AND 31
        ),

    CONSTRAINT `chk_personnel_service_segment_end_year`
        CHECK (
            `period_end_year` IS NULL
            OR `period_end_year` BETWEEN 1000 AND 9999
        ),

    CONSTRAINT `chk_personnel_service_segment_end_month`
        CHECK (
            `period_end_month` IS NULL
            OR `period_end_month` BETWEEN 1 AND 12
        ),

    CONSTRAINT `chk_personnel_service_segment_end_day`
        CHECK (
            `period_end_day` IS NULL
            OR `period_end_day` BETWEEN 1 AND 31
        ),

    CONSTRAINT `chk_personnel_service_segment_start_day_month`
        CHECK (
            `period_start_day` IS NULL
            OR `period_start_month` IS NOT NULL
        ),

    CONSTRAINT `chk_personnel_service_segment_end_day_month`
        CHECK (
            `period_end_day` IS NULL
            OR `period_end_month` IS NOT NULL
        ),

    CONSTRAINT `chk_personnel_service_segment_ongoing`
        CHECK (`is_ongoing` IN (0, 1)),

    CONSTRAINT `chk_personnel_service_segment_source_text`
        CHECK (
            `source_period_text` IS NULL
            OR CHAR_LENGTH(TRIM(`source_period_text`)) > 0
        ),

    CONSTRAINT `chk_personnel_service_segment_source_classification`
        CHECK (
            CHAR_LENGTH(TRIM(`source_classification`)) > 0
        ),

    CONSTRAINT `chk_personnel_service_segment_countability`
        CHECK (
            CHAR_LENGTH(TRIM(`countability_state`)) > 0
        ),

    CONSTRAINT `chk_personnel_service_segment_precision_bundle`
        CHECK (
            (
                `period_precision` = 'YEAR'
                AND `period_start_year` IS NOT NULL
                AND `period_start_month` IS NULL
                AND `period_start_day` IS NULL
                AND `period_end_year` IS NULL
                AND `period_end_month` IS NULL
                AND `period_end_day` IS NULL
            )
            OR
            (
                `period_precision` = 'MONTH'
                AND `period_start_year` IS NOT NULL
                AND `period_start_month` IS NOT NULL
                AND `period_start_day` IS NULL
                AND `period_end_year` IS NULL
                AND `period_end_month` IS NULL
                AND `period_end_day` IS NULL
            )
            OR
            (
                `period_precision` = 'DATE'
                AND `period_start_year` IS NOT NULL
                AND `period_start_month` IS NOT NULL
                AND `period_start_day` IS NOT NULL
                AND `period_end_year` IS NULL
                AND `period_end_month` IS NULL
                AND `period_end_day` IS NULL
            )
            OR
            (
                `period_precision` = 'RANGE'
                AND `period_start_year` IS NOT NULL
                AND (
                    `is_ongoing` = 1
                    OR `period_end_year` IS NOT NULL
                )
            )
            OR
            (
                `period_precision` = 'ACADEMIC_YEAR'
                AND `period_start_year` IS NOT NULL
                AND `period_start_month` IS NULL
                AND `period_start_day` IS NULL
                AND `period_end_year` IS NULL
                AND `period_end_month` IS NULL
                AND `period_end_day` IS NULL
            )
            OR
            (
                `period_precision` = 'NAMED_PERIOD'
                AND `period_start_year` IS NULL
                AND `period_start_month` IS NULL
                AND `period_start_day` IS NULL
                AND `period_end_year` IS NULL
                AND `period_end_month` IS NULL
                AND `period_end_day` IS NULL
                AND `source_period_text` IS NOT NULL
            )
        ),

    CONSTRAINT `chk_personnel_service_segment_ongoing_end`
        CHECK (
            `is_ongoing` = 0
            OR (
                `period_end_year` IS NULL
                AND `period_end_month` IS NULL
                AND `period_end_day` IS NULL
            )
        ),

    CONSTRAINT `chk_personnel_service_segment_end_bundle`
        CHECK (
            (
                `period_end_year` IS NULL
                AND `period_end_month` IS NULL
                AND `period_end_day` IS NULL
            )
            OR
            (
                `period_end_year` IS NOT NULL
                AND (
                    `period_end_month` IS NOT NULL
                    OR `period_end_day` IS NULL
                )
                AND (
                    `period_end_day` IS NULL
                    OR `period_end_month` IS NOT NULL
                )
            )
        ),

    CONSTRAINT `chk_personnel_service_segment_start_calendar`
        CHECK (
            `period_start_day` IS NULL
            OR
            `period_start_day` <=
                CASE
                    WHEN `period_start_month` IN (1,3,5,7,8,10,12) THEN 31
                    WHEN `period_start_month` IN (4,6,9,11) THEN 30
                    WHEN `period_start_month` = 2 THEN
                        CASE
                            WHEN (
                                MOD(`period_start_year`, 400) = 0
                                OR (
                                    MOD(`period_start_year`, 4) = 0
                                    AND MOD(`period_start_year`, 100) <> 0
                                )
                            ) THEN 29
                            ELSE 28
                        END
                    ELSE 31
                END
        ),

    CONSTRAINT `chk_personnel_service_segment_end_calendar`
        CHECK (
            `period_end_day` IS NULL
            OR
            `period_end_day` <=
                CASE
                    WHEN `period_end_month` IN (1,3,5,7,8,10,12) THEN 31
                    WHEN `period_end_month` IN (4,6,9,11) THEN 30
                    WHEN `period_end_month` = 2 THEN
                        CASE
                            WHEN (
                                MOD(`period_end_year`, 400) = 0
                                OR (
                                    MOD(`period_end_year`, 4) = 0
                                    AND MOD(`period_end_year`, 100) <> 0
                                )
                            ) THEN 29
                            ELSE 28
                        END
                    ELSE 31
                END
        ),

    CONSTRAINT `chk_personnel_service_segment_ordering`
        CHECK (
            `period_end_year` IS NULL
            OR (
                `period_end_year` > `period_start_year`
                OR (
                    `period_end_year` = `period_start_year`
                    AND COALESCE(`period_end_month`, 0)
                        > COALESCE(`period_start_month`, 0)
                )
                OR (
                    `period_end_year` = `period_start_year`
                    AND COALESCE(`period_end_month`, 0)
                        = COALESCE(`period_start_month`, 0)
                    AND COALESCE(`period_end_day`, 0)
                        >= COALESCE(`period_start_day`, 0)
                )
            )
        )

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE `personnel_service_history_version_evidence` (
    `service_history_version_id`
        CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `evidence_id`
        CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `association_type`
        VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `attached_by_profile_id`
        CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,

    `attached_at`
        DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (
        `service_history_version_id`,
        `evidence_id`,
        `association_type`
    ),

    KEY `idx_personnel_service_history_evidence_evidence`
        (`evidence_id`),

    KEY `idx_personnel_service_history_evidence_actor`
        (`attached_by_profile_id`),

    CONSTRAINT `fk_personnel_service_history_evidence_version`
        FOREIGN KEY (`service_history_version_id`)
        REFERENCES `personnel_service_history_versions` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_personnel_service_history_evidence_evidence`
        FOREIGN KEY (`evidence_id`)
        REFERENCES `achievement_evidence` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_personnel_service_history_evidence_actor`
        FOREIGN KEY (`attached_by_profile_id`)
        REFERENCES `profiles` (`id`)
        ON DELETE SET NULL
        ON UPDATE NO ACTION,

    CONSTRAINT `chk_personnel_service_history_evidence_type`
        CHECK (
            CHAR_LENGTH(TRIM(`association_type`)) > 0
        )

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
SQL);

        $this->db->query(<<<'SQL'
ALTER TABLE `personnel_service_histories`
    ADD CONSTRAINT `fk_personnel_service_histories_current_version`
        FOREIGN KEY (`current_version_id`)
        REFERENCES `personnel_service_history_versions` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION;
SQL);
    }

    public function down()
    {
        $this->db->query(
            'ALTER TABLE `personnel_service_histories`
             DROP FOREIGN KEY `fk_personnel_service_histories_current_version`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `personnel_service_history_version_evidence`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `personnel_service_segments`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `personnel_service_history_versions`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `personnel_service_histories`'
        );
    }
}
