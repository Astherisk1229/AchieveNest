<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateDocumentProcessingDomain extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
CREATE TABLE `document_processing_runs` (
    `id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `target_record_version_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `requested_by_profile_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,

    `pipeline_stage` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `processing_type` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `ocr_engine_name` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `ocr_engine_version` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,

    `ai_provider` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `ai_model_name` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `ai_model_version` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,

    `status` VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `idempotency_key` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,

    `raw_output_reference` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,

    `requested_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `started_at` DATETIME(6) NULL,
    `completed_at` DATETIME(6) NULL,

    PRIMARY KEY (`id`),

    UNIQUE KEY `uq_document_processing_runs_idempotency`
        (`idempotency_key`),

    KEY `idx_document_processing_runs_target_version`
        (`target_record_version_id`),

    KEY `idx_document_processing_runs_requested_by`
        (`requested_by_profile_id`),

    KEY `idx_document_processing_runs_status`
        (`status`),

    KEY `idx_document_processing_runs_requested_at`
        (`requested_at`),

    CONSTRAINT `fk_document_processing_runs_target_version`
        FOREIGN KEY (`target_record_version_id`)
        REFERENCES `achievement_record_versions` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_document_processing_runs_requested_by`
        FOREIGN KEY (`requested_by_profile_id`)
        REFERENCES `profiles` (`id`)
        ON DELETE SET NULL
        ON UPDATE NO ACTION,

    CONSTRAINT `chk_document_processing_runs_pipeline_stage`
        CHECK (CHAR_LENGTH(TRIM(`pipeline_stage`)) > 0),

    CONSTRAINT `chk_document_processing_runs_processing_type`
        CHECK (CHAR_LENGTH(TRIM(`processing_type`)) > 0),

    CONSTRAINT `chk_document_processing_runs_status`
        CHECK (CHAR_LENGTH(TRIM(`status`)) > 0),

    CONSTRAINT `chk_document_processing_runs_time_order`
        CHECK (
            (`started_at` IS NULL OR `started_at` >= `requested_at`)
            AND
            (`completed_at` IS NULL OR `started_at` IS NOT NULL)
            AND
            (`completed_at` IS NULL OR `completed_at` >= `started_at`)
        )
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE `document_processing_run_evidence` (
    `processing_run_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `evidence_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    PRIMARY KEY (`processing_run_id`, `evidence_id`),

    KEY `idx_document_processing_run_evidence_evidence`
        (`evidence_id`),

    CONSTRAINT `fk_document_processing_run_evidence_run`
        FOREIGN KEY (`processing_run_id`)
        REFERENCES `document_processing_runs` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_document_processing_run_evidence_evidence`
        FOREIGN KEY (`evidence_id`)
        REFERENCES `achievement_evidence` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE `machine_field_proposals` (
    `id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `processing_run_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `target_record_version_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `field_key` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,

    `value_type` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `value_text` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `value_date` DATE NULL,
    `value_decimal` DECIMAL(18,6) NULL,
    `value_boolean` TINYINT(1) NULL,

    `source_evidence_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `source_page` INT UNSIGNED NULL,
    `source_span` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `source_bounding_metadata` JSON NULL,

    `ocr_confidence` DECIMAL(6,5) NULL,

    `proposal_state` VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'proposed',
    `review_required` TINYINT(1) NOT NULL DEFAULT 0,

    `reviewed_by_profile_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `reviewed_at` DATETIME(6) NULL,

    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`),

    KEY `idx_machine_field_proposals_run`
        (`processing_run_id`),

    KEY `idx_machine_field_proposals_target_version`
        (`target_record_version_id`),

    KEY `idx_machine_field_proposals_source_evidence`
        (`source_evidence_id`),

    KEY `idx_machine_field_proposals_reviewed_by`
        (`reviewed_by_profile_id`),

    KEY `idx_machine_field_proposals_state_review`
        (`proposal_state`, `review_required`),

    KEY `idx_machine_field_proposals_target_field`
        (`target_record_version_id`, `field_key`),

    CONSTRAINT `fk_machine_field_proposals_run`
        FOREIGN KEY (`processing_run_id`)
        REFERENCES `document_processing_runs` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_machine_field_proposals_target_version`
        FOREIGN KEY (`target_record_version_id`)
        REFERENCES `achievement_record_versions` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_machine_field_proposals_source_evidence`
        FOREIGN KEY (`source_evidence_id`)
        REFERENCES `achievement_evidence` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_machine_field_proposals_reviewed_by`
        FOREIGN KEY (`reviewed_by_profile_id`)
        REFERENCES `profiles` (`id`)
        ON DELETE SET NULL
        ON UPDATE NO ACTION,

    CONSTRAINT `chk_machine_field_proposals_field_key`
        CHECK (CHAR_LENGTH(TRIM(`field_key`)) > 0),

    CONSTRAINT `chk_machine_field_proposals_value_type`
        CHECK (
            `value_type` IN ('TEXT', 'DATE', 'DECIMAL', 'BOOLEAN')
        ),

    CONSTRAINT `chk_machine_field_proposals_typed_value`
        CHECK (
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

    CONSTRAINT `chk_machine_field_proposals_boolean`
        CHECK (
            `value_boolean` IS NULL
            OR `value_boolean` IN (0, 1)
        ),

    CONSTRAINT `chk_machine_field_proposals_ocr_confidence`
        CHECK (
            `ocr_confidence` IS NULL
            OR (
                `ocr_confidence` >= 0
                AND `ocr_confidence` <= 1
            )
        ),

    CONSTRAINT `chk_machine_field_proposals_review_required`
        CHECK (`review_required` IN (0, 1)),

    CONSTRAINT `chk_machine_field_proposals_proposal_state`
        CHECK (CHAR_LENGTH(TRIM(`proposal_state`)) > 0),

    CONSTRAINT `chk_machine_field_proposals_source_page`
        CHECK (
            `source_page` IS NULL
            OR `source_page` > 0
        )
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
SQL);
    }

    public function down()
    {
        $this->db->query(
            'DROP TABLE IF EXISTS `machine_field_proposals`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `document_processing_run_evidence`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `document_processing_runs`'
        );
    }
}
