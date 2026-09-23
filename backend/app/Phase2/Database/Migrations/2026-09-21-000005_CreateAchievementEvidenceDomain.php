<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateAchievementEvidenceDomain extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
CREATE TABLE `achievement_evidence` (
    `id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `storage_path` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `original_filename` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `mime_type` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `detected_mime_type` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `byte_size` BIGINT UNSIGNED NOT NULL,
    `sha256` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
    `uploaded_by` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `uploaded_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `security_status` VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'clean',
    `malware_scanner` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'backend_clamav_v1',
    `security_validated_at` DATETIME(6) NULL,
    `status` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
    `supersedes_evidence_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `superseded_at` DATETIME(6) NULL,

    PRIMARY KEY (`id`),

    KEY `idx_achievement_evidence_uploader` (`uploaded_by`),
    KEY `idx_achievement_evidence_sha256` (`sha256`),
    KEY `idx_achievement_evidence_security_status` (`security_status`),
    KEY `idx_achievement_evidence_status` (`status`),
    KEY `idx_achievement_evidence_supersedes` (`supersedes_evidence_id`),

    CONSTRAINT `fk_achievement_evidence_uploader`
        FOREIGN KEY (`uploaded_by`)
        REFERENCES `profiles` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_achievement_evidence_supersedes`
        FOREIGN KEY (`supersedes_evidence_id`)
        REFERENCES `achievement_evidence` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `chk_achievement_evidence_byte_size`
        CHECK (`byte_size` > 0),

    CONSTRAINT `chk_achievement_evidence_security_status`
        CHECK (`security_status` IN ('pending', 'clean', 'rejected', 'quarantined')),

    CONSTRAINT `chk_achievement_evidence_no_self_supersession`
        CHECK (`supersedes_evidence_id` IS NULL OR `supersedes_evidence_id` <> `id`)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE `achievement_version_evidence` (
    `record_version_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `evidence_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `association_type` VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
    `attached_by` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `attached_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`record_version_id`, `evidence_id`, `association_type`),

    KEY `idx_achievement_version_evidence_evidence` (`evidence_id`),
    KEY `idx_achievement_version_evidence_attached_by` (`attached_by`),

    CONSTRAINT `fk_achievement_version_evidence_version`
        FOREIGN KEY (`record_version_id`)
        REFERENCES `achievement_record_versions` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_achievement_version_evidence_evidence`
        FOREIGN KEY (`evidence_id`)
        REFERENCES `achievement_evidence` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,

    CONSTRAINT `fk_achievement_version_evidence_attached_by`
        FOREIGN KEY (`attached_by`)
        REFERENCES `profiles` (`id`)
        ON DELETE SET NULL
        ON UPDATE NO ACTION,

    CONSTRAINT `chk_achievement_version_evidence_primary`
        CHECK (`is_primary` IN (0, 1)),

    CONSTRAINT `chk_achievement_version_evidence_association_type`
        CHECK (CHAR_LENGTH(TRIM(`association_type`)) > 0)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
SQL);
    }

    public function down()
    {
        $this->db->query(
            'DROP TABLE IF EXISTS `achievement_version_evidence`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `achievement_evidence`'
        );
    }
}
