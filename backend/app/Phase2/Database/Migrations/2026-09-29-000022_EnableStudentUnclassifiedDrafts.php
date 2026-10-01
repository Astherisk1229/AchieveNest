<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

final class EnableStudentUnclassifiedDrafts extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
ALTER TABLE `achievement_record_versions`
    MODIFY `contract_code` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    ADD CONSTRAINT `chk_student_unclassified_draft_only`
        CHECK (`contract_code` IS NOT NULL OR `submission_state` = 'draft')
SQL);
        $this->db->query(<<<'SQL'
CREATE TABLE `achievement_version_draft_fields` (
    `record_version_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `field_key` VARCHAR(100) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    `field_value` JSON NOT NULL,
    `updated_by_profile_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`record_version_id`, `field_key`),
    KEY `idx_achievement_version_draft_fields_actor` (`updated_by_profile_id`),
    CONSTRAINT `fk_achievement_version_draft_fields_version` FOREIGN KEY (`record_version_id`) REFERENCES `achievement_record_versions` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_achievement_version_draft_fields_actor` FOREIGN KEY (`updated_by_profile_id`) REFERENCES `profiles` (`id`) ON DELETE SET NULL,
    CONSTRAINT `chk_achievement_version_draft_fields_key` CHECK (CHAR_LENGTH(TRIM(`field_key`)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);
    }

    public function down()
    {
        if ($this->db->table('achievement_record_versions')->where('contract_code', null)->countAllResults() > 0) {
            throw new RuntimeException('Cannot roll back while unclassified drafts exist.');
        }
        $this->db->query('DROP TABLE IF EXISTS `achievement_version_draft_fields`');
        $this->db->query('ALTER TABLE `achievement_record_versions` DROP CHECK `chk_student_unclassified_draft_only`, MODIFY `contract_code` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL');
    }
}
