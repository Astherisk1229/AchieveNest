<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

class UpgradeAchievementSourceReferences extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
ALTER TABLE `personnel_evaluations`
    ADD COLUMN `portfolio_submission_version_id`
        CHAR(36)
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci
        NULL
        AFTER `evaluation_period_id`,
    ADD KEY `idx_personnel_evaluations_portfolio_submission_version`
        (`portfolio_submission_version_id`),
    ADD CONSTRAINT `fk_personnel_evaluations_portfolio_submission_version`
        FOREIGN KEY (`portfolio_submission_version_id`)
        REFERENCES `personnel_portfolio_submission_versions` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION;
SQL);

        $this->db->query(<<<'SQL'
ALTER TABLE `personnel_evaluation_items`
    ADD COLUMN `achievement_record_version_id`
        CHAR(36)
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci
        NULL
        AFTER `accomplishment_id`,
    ADD COLUMN `service_history_version_id`
        CHAR(36)
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci
        NULL
        AFTER `achievement_record_version_id`,
    ADD KEY `idx_personnel_eval_items_achievement_record_version`
        (`achievement_record_version_id`),
    ADD KEY `idx_personnel_eval_items_service_history_version`
        (`service_history_version_id`),
    ADD CONSTRAINT `fk_personnel_eval_items_achievement_record_version`
        FOREIGN KEY (`achievement_record_version_id`)
        REFERENCES `achievement_record_versions` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION,
    ADD CONSTRAINT `fk_personnel_eval_items_service_history_version`
        FOREIGN KEY (`service_history_version_id`)
        REFERENCES `personnel_service_history_versions` (`id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION;
SQL);
    }

    public function down()
    {
        $this->db->query(<<<'SQL'
ALTER TABLE `personnel_evaluation_items`
    DROP FOREIGN KEY `fk_personnel_eval_items_service_history_version`,
    DROP FOREIGN KEY `fk_personnel_eval_items_achievement_record_version`,
    DROP INDEX `idx_personnel_eval_items_service_history_version`,
    DROP INDEX `idx_personnel_eval_items_achievement_record_version`,
    DROP COLUMN `service_history_version_id`,
    DROP COLUMN `achievement_record_version_id`;
SQL);

        $this->db->query(<<<'SQL'
ALTER TABLE `personnel_evaluations`
    DROP FOREIGN KEY `fk_personnel_evaluations_portfolio_submission_version`,
    DROP INDEX `idx_personnel_evaluations_portfolio_submission_version`,
    DROP COLUMN `portfolio_submission_version_id`;
SQL);
    }
}
