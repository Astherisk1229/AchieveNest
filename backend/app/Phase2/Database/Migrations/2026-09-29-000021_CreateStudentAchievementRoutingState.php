<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

final class CreateStudentAchievementRoutingState extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
ALTER TABLE `achievement_record_versions`
    DROP CHECK `chk_achievement_record_versions_submission_state`,
    ADD CONSTRAINT `chk_achievement_record_versions_submission_state`
        CHECK (
            `submission_state` IN (
                'draft',
                'routing_pending',
                'submitted',
                'revision_requested',
                'resolved'
            )
        )
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE `student_achievement_verification_routes` (
    `record_version_id` CHAR(36)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `academic_program_id` CHAR(36)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `coordinator_profile_id` CHAR(36)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `routing_status` VARCHAR(30)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `reason_code` VARCHAR(64)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `resolved_at` DATETIME(6) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`record_version_id`),
    KEY `idx_student_achievement_routes_coordinator_status`
        (`coordinator_profile_id`, `routing_status`),
    KEY `idx_student_achievement_routes_program_status`
        (`academic_program_id`, `routing_status`),

    CONSTRAINT `fk_student_achievement_routes_version`
        FOREIGN KEY (`record_version_id`)
        REFERENCES `achievement_record_versions` (`id`)
        ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT `fk_student_achievement_routes_program`
        FOREIGN KEY (`academic_program_id`)
        REFERENCES `academic_programs` (`id`)
        ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT `fk_student_achievement_routes_coordinator`
        FOREIGN KEY (`coordinator_profile_id`)
        REFERENCES `profiles` (`id`)
        ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT `chk_student_achievement_routes_status`
        CHECK (`routing_status` IN ('routing_pending', 'routed')),
    CONSTRAINT `chk_student_achievement_routes_shape`
        CHECK (
            (
                `routing_status` = 'routing_pending'
                AND `coordinator_profile_id` IS NULL
                AND `resolved_at` IS NULL
            )
            OR
            (
                `routing_status` = 'routed'
                AND `academic_program_id` IS NOT NULL
                AND `coordinator_profile_id` IS NOT NULL
                AND `resolved_at` IS NOT NULL
            )
        )
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE `student_achievement_routing_events` (
    `id` CHAR(36)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `record_version_id` CHAR(36)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `event_type` VARCHAR(30)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `previous_routing_status` VARCHAR(30)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `new_routing_status` VARCHAR(30)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `academic_program_id` CHAR(36)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `coordinator_profile_id` CHAR(36)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `actor_profile_id` CHAR(36)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `reason_code` VARCHAR(64)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `occurred_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`),
    KEY `idx_student_achievement_routing_events_version_time`
        (`record_version_id`, `occurred_at`),

    CONSTRAINT `fk_student_achievement_routing_events_version`
        FOREIGN KEY (`record_version_id`)
        REFERENCES `achievement_record_versions` (`id`)
        ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT `fk_student_achievement_routing_events_program`
        FOREIGN KEY (`academic_program_id`)
        REFERENCES `academic_programs` (`id`)
        ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT `fk_student_achievement_routing_events_coordinator`
        FOREIGN KEY (`coordinator_profile_id`)
        REFERENCES `profiles` (`id`)
        ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT `fk_student_achievement_routing_events_actor`
        FOREIGN KEY (`actor_profile_id`)
        REFERENCES `profiles` (`id`)
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT `chk_student_achievement_routing_events_type`
        CHECK (`event_type` IN ('submission_routing_evaluated', 'routing_resolved')),
    CONSTRAINT `chk_student_achievement_routing_events_new_status`
        CHECK (`new_routing_status` IN ('routing_pending', 'routed')),
    CONSTRAINT `chk_student_achievement_routing_events_previous_status`
        CHECK (
            `previous_routing_status` IS NULL
            OR `previous_routing_status` IN ('routing_pending', 'routed')
        )
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
SQL);
    }

    public function down()
    {
        $this->db->query(
            'DROP TABLE IF EXISTS `student_achievement_routing_events`'
        );
        $this->db->query(
            'DROP TABLE IF EXISTS `student_achievement_verification_routes`'
        );
        $this->db->table('achievement_record_versions')
            ->where('submission_state', 'routing_pending')
            ->update(['submission_state' => 'draft']);
        $this->db->query(<<<'SQL'
ALTER TABLE `achievement_record_versions`
    DROP CHECK `chk_achievement_record_versions_submission_state`,
    ADD CONSTRAINT `chk_achievement_record_versions_submission_state`
        CHECK (
            `submission_state` IN (
                'draft',
                'submitted',
                'revision_requested',
                'resolved'
            )
        )
SQL);
    }
}
