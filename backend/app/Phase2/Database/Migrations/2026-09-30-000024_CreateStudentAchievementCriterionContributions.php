<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

/**
 * Step 6: per-record criterion contributions produced automatically on approval, and the
 * verification-event actions used to audit scoring runs.
 */
final class CreateStudentAchievementCriterionContributions extends Migration
{
    private const TABLE = 'student_achievement_criterion_contributions';
    private const BASE_ACTIONS = ['submitted', 'revision_requested', 'resubmitted', 'verified', 'rejected'];
    private const SCORING_ACTIONS = ['scoring_requested', 'criteria_scored', 'scoring_failed'];

    public function up()
    {
        if ($this->db->tableExists(self::TABLE)) {
            throw new RuntimeException(self::TABLE . ' already exists; refusing to overwrite it.');
        }

        // criterion_component_key is the null-safe part of the unique key: the component id when the
        // engine resolved one, otherwise 'code:<engine component code>', never NULL.
        $this->db->query(<<<'SQL'
CREATE TABLE `student_achievement_criterion_contributions` (
    `id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `portfolio_record_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `award_cycle_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `award_definition_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `criterion_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `criterion_component_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `criterion_component_key` VARCHAR(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `scoring_rule_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `scoring_version` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `mapping_rule` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `allocated_points` DECIMAL(10,2) NOT NULL,
    `basis_snapshot` JSON NULL,
    `status` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
    `created_by_profile_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `superseded_at` DATETIME(6) NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_sacc_record_cycle_criterion_component_version`
        (`portfolio_record_id`, `award_cycle_id`, `criterion_id`, `criterion_component_key`, `scoring_version`),
    KEY `idx_sacc_cycle_award_status` (`award_cycle_id`, `award_definition_id`, `status`),
    KEY `idx_sacc_record_status` (`portfolio_record_id`, `status`),
    CONSTRAINT `fk_sacc_record` FOREIGN KEY (`portfolio_record_id`) REFERENCES `student_portfolio_records` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_sacc_cycle` FOREIGN KEY (`award_cycle_id`) REFERENCES `award_cycles` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_sacc_award` FOREIGN KEY (`award_definition_id`) REFERENCES `award_definitions` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_sacc_criterion` FOREIGN KEY (`criterion_id`) REFERENCES `award_criteria` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_sacc_component` FOREIGN KEY (`criterion_component_id`) REFERENCES `award_criterion_components` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_sacc_rule` FOREIGN KEY (`scoring_rule_id`) REFERENCES `award_scoring_rules` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_sacc_creator` FOREIGN KEY (`created_by_profile_id`) REFERENCES `profiles` (`id`) ON DELETE SET NULL,
    CONSTRAINT `chk_sacc_status` CHECK (`status` IN ('active', 'superseded')),
    CONSTRAINT `chk_sacc_points` CHECK (`allocated_points` >= 0),
    CONSTRAINT `chk_sacc_component_key` CHECK (CHAR_LENGTH(`criterion_component_key`) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);

        $this->replaceActionCheck(array_merge(self::BASE_ACTIONS, self::SCORING_ACTIONS));
    }

    public function down()
    {
        $used = $this->db->table('student_portfolio_verification_events')->whereIn('action', self::SCORING_ACTIONS)->countAllResults();
        if ($used > 0) {
            throw new RuntimeException('Cannot roll back: scoring verification events exist and history is never deleted.');
        }
        if ($this->db->tableExists(self::TABLE) && $this->db->table(self::TABLE)->countAllResults() > 0) {
            throw new RuntimeException('Cannot roll back: contribution rows exist.');
        }
        $this->replaceActionCheck(self::BASE_ACTIONS);
        $this->db->query('DROP TABLE IF EXISTS `' . self::TABLE . '`');
    }

    /** Swaps the action CHECK on student_portfolio_verification_events in one ALTER. */
    private function replaceActionCheck(array $actions): void
    {
        $existing = $this->db->query(
            "SELECT tc.CONSTRAINT_NAME AS name
             FROM information_schema.TABLE_CONSTRAINTS tc
             JOIN information_schema.CHECK_CONSTRAINTS cc
               ON cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
             WHERE tc.TABLE_SCHEMA = DATABASE() AND tc.TABLE_NAME = 'student_portfolio_verification_events'
               AND tc.CONSTRAINT_TYPE = 'CHECK' AND cc.CHECK_CLAUSE LIKE '%action%'"
        )->getResultArray();
        if (count($existing) !== 1) {
            throw new RuntimeException('Expected exactly one action CHECK on student_portfolio_verification_events, found ' . count($existing) . '.');
        }
        $list = implode(', ', array_map(fn (string $a): string => $this->db->escape($a), $actions));
        $this->db->query(
            'ALTER TABLE `student_portfolio_verification_events` DROP CHECK `' . $existing[0]['name'] . '`, '
            . 'ADD CONSTRAINT `ck_verification_events_action` CHECK (`action` IN (' . $list . '))'
        );
    }
}
