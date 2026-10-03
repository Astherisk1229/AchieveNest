<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateStudentAchievementDetailTables extends Migration
{
    public function up()
    {
        /*
         * Student 01 — Leadership Position
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `student_leadership_position_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `governing_body_name` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `position_held` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `academic_year_start` SMALLINT UNSIGNED NOT NULL,

                `represented_year_level` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `additional_notes` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_student_leadership_position_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );

        /*
         * Student 02 — Organization Membership / Participation
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `student_organization_involvement_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `organization_name` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `committee_name` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `related_activity_title` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `responsibility_assignment` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `academic_year_start` SMALLINT UNSIGNED NULL,

                `activity_program_title` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `activity_type` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `contribution_role` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `project_initiative_title` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `contribution_type` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `contribution_description` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `period_start_year` SMALLINT UNSIGNED NULL,
                `period_start_month` TINYINT UNSIGNED NULL,
                `period_start_day` TINYINT UNSIGNED NULL,

                `period_end_year` SMALLINT UNSIGNED NULL,
                `period_end_month` TINYINT UNSIGNED NULL,
                `period_end_day` TINYINT UNSIGNED NULL,

                `period_precision` VARCHAR(20)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `source_period_text` VARCHAR(100)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `additional_notes` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_student_org_involvement_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION,

                CONSTRAINT `chk_student_org_activity_type`
                    CHECK (
                        `activity_type` IS NULL
                        OR `activity_type` IN (
                            'ORGANIZATION_ACTIVITY_PROGRAM',
                            'OUTREACH_EXTENSION',
                            'EXTRA_CURRICULAR',
                            'CO_CURRICULAR'
                        )
                    ),

                CONSTRAINT `chk_student_org_contribution_role`
                    CHECK (
                        `contribution_role` IS NULL
                        OR `contribution_role` IN (
                            'FACILITATOR',
                            'ORGANIZER',
                            'FACILITATOR_AND_ORGANIZER'
                        )
                    ),

                CONSTRAINT `chk_student_org_contribution_type`
                    CHECK (
                        `contribution_type` IS NULL
                        OR `contribution_type` IN (
                            'CONTRIBUTOR_SUPPORT_ROLE',
                            'MAJOR_PROJECT_RESPONSIBILITY'
                        )
                    ),

                CONSTRAINT `chk_student_org_period_precision`
                    CHECK (
                        `period_precision` IS NULL
                        OR `period_precision` IN (
                            'DATE',
                            'RANGE'
                        )
                    ),

                CONSTRAINT `chk_student_org_start_month`
                    CHECK (
                        `period_start_month` IS NULL
                        OR `period_start_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_student_org_start_day`
                    CHECK (
                        `period_start_day` IS NULL
                        OR `period_start_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_student_org_end_month`
                    CHECK (
                        `period_end_month` IS NULL
                        OR `period_end_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_student_org_end_day`
                    CHECK (
                        `period_end_day` IS NULL
                        OR `period_end_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_student_org_period_bundle`
                    CHECK (
                        (
                            `period_precision` IS NULL
                            AND `period_start_year` IS NULL
                            AND `period_start_month` IS NULL
                            AND `period_start_day` IS NULL
                            AND `period_end_year` IS NULL
                            AND `period_end_month` IS NULL
                            AND `period_end_day` IS NULL
                            AND `source_period_text` IS NULL
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
                            AND `period_start_month` IS NOT NULL
                            AND `period_start_day` IS NOT NULL
                            AND `period_end_year` IS NOT NULL
                            AND `period_end_month` IS NOT NULL
                            AND `period_end_day` IS NOT NULL
                        )
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );

        /*
         * Student 03 — Community Service / Volunteerism
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `student_service_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `service_activity_project_title` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `organizer_implementing_body` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `university_unit_or_office` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `partner_organization` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `service_location_or_context` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `beneficiary_group` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `activity_role` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `period_start_year` SMALLINT UNSIGNED NOT NULL,
                `period_start_month` TINYINT UNSIGNED NOT NULL,
                `period_start_day` TINYINT UNSIGNED NOT NULL,

                `period_end_year` SMALLINT UNSIGNED NULL,
                `period_end_month` TINYINT UNSIGNED NULL,
                `period_end_day` TINYINT UNSIGNED NULL,

                `period_precision` VARCHAR(20)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `service_hours` DECIMAL(6,2) UNSIGNED NULL,

                `civic_scope` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `additional_notes` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_student_service_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION,

                CONSTRAINT `chk_student_service_context_source`
                    CHECK (
                        `organizer_implementing_body` IS NOT NULL
                        OR `university_unit_or_office` IS NOT NULL
                    ),

                CONSTRAINT `chk_student_service_activity_role`
                    CHECK (
                        `activity_role` IN (
                            'PARTICIPANT',
                            'VOLUNTEER',
                            'ORGANIZER',
                            'INITIATOR',
                            'LEADER'
                        )
                    ),

                CONSTRAINT `chk_student_service_civic_scope`
                    CHECK (
                        `civic_scope` IS NULL
                        OR `civic_scope` IN (
                            'BARANGAY',
                            'MUNICIPAL',
                            'PROVINCIAL',
                            'NATIONAL'
                        )
                    ),

                CONSTRAINT `chk_student_service_period_precision`
                    CHECK (
                        `period_precision` IN (
                            'DATE',
                            'RANGE'
                        )
                    ),

                CONSTRAINT `chk_student_service_start_month`
                    CHECK (
                        `period_start_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_student_service_start_day`
                    CHECK (
                        `period_start_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_student_service_end_month`
                    CHECK (
                        `period_end_month` IS NULL
                        OR `period_end_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_student_service_end_day`
                    CHECK (
                        `period_end_day` IS NULL
                        OR `period_end_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_student_service_period_bundle`
                    CHECK (
                        (
                            `period_precision` = 'DATE'
                            AND `period_end_year` IS NULL
                            AND `period_end_month` IS NULL
                            AND `period_end_day` IS NULL
                        )
                        OR
                        (
                            `period_precision` = 'RANGE'
                            AND `period_end_year` IS NOT NULL
                            AND `period_end_month` IS NOT NULL
                            AND `period_end_day` IS NOT NULL
                        )
                    ),

                CONSTRAINT `chk_student_service_hours`
                    CHECK (
                        `service_hours` IS NULL
                        OR `service_hours` > 0
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );

        /*
         * Student 04 — Church / Ministry Involvement
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `student_church_ministry_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `ministry_or_organization_name` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `specified_ministry_or_organization` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `involvement_activity_title` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `involvement_type` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `specified_involvement_type` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `role_position` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `specified_role_position` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `committee_working_group_name` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `academic_year_start` SMALLINT UNSIGNED NULL,

                `activity_start_date` DATE NULL,
                `activity_end_date` DATE NULL,

                `activity_initiative_title` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `initiation_role` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `specified_initiation_role` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `official_role_responsibility` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `church_ministry_context_affiliation` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `additional_notes` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_student_church_ministry_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION,

                CONSTRAINT `chk_student_church_activity_dates`
                    CHECK (
                        `activity_end_date` IS NULL
                        OR (
                            `activity_start_date` IS NOT NULL
                            AND `activity_end_date` >= `activity_start_date`
                        )
                    ),

                CONSTRAINT `chk_student_church_initiation_role`
                    CHECK (
                        `initiation_role` IS NULL
                        OR `initiation_role` IN (
                            'INITIATOR',
                            'CO_INITIATOR',
                            'PRINCIPAL_ORGANIZER',
                            'CO_PRINCIPAL_ORGANIZER',
                            'OTHER_VERIFIED_INITIATION_ROLE'
                        )
                    ),

                CONSTRAINT `chk_student_church_specified_initiation_role`
                    CHECK (
                        (
                            `initiation_role` = 'OTHER_VERIFIED_INITIATION_ROLE'
                            AND `specified_initiation_role` IS NOT NULL
                        )
                        OR
                        (
                            (
                                `initiation_role` IS NULL
                                OR `initiation_role` <> 'OTHER_VERIFIED_INITIATION_ROLE'
                            )
                            AND `specified_initiation_role` IS NULL
                        )
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );

        /*
         * Student 05 — Seminar / Training
         *
         * Shared by:
         * - Leadership Development
         * - Personal / Professional Development
         * - Campus Journalism Development
         * - Sports Development
         * - Socio-Cultural / Performing Arts Development
         * - Community Service / Volunteer Development
         * - Spiritual / Formation Development
         * - Other Seminar / Training
         *
         * The selected achievement contract determines the development
         * subcategory. This detail table stores only the common factual
         * seminar/training fields.
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `student_seminar_training_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `activity_type` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `activity_program_title` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `organizer_issuing_organization` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `activity_start_date` DATE NOT NULL,

                `activity_end_date` DATE NULL,

                `additional_notes` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_student_seminar_training_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION,

                CONSTRAINT `chk_student_seminar_training_activity_type`
                    CHECK (
                        `activity_type` IN (
                            'SEMINAR',
                            'WORKSHOP',
                            'TRAINING',
                            'CONFERENCE',
                            'CONGRESS',
                            'CERTIFICATION',
                            'RETREAT',
                            'RECOLLECTION'
                        )
                    ),

                CONSTRAINT `chk_student_seminar_training_dates`
                    CHECK (
                        `activity_end_date` IS NULL
                        OR `activity_end_date` >= `activity_start_date`
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );
        /*
         * Student 06 — Citation / Recognition
         *
         * Shared by:
         * - Leadership
         * - Organization / Membership
         * - Community Service / Volunteerism
         * - Church / Ministry
         * - Campus Journalism
         * - Sports
         * - Socio-Cultural / Performing Arts
         * - Other Non-Academic Recognition
         *
         * The selected achievement contract determines the recognition
         * subcategory. This table stores only the factual metadata of the
         * separately conferred formal recognition, citation, honor, or
         * commendation.
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `student_recognition_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `recognition_citation_type` VARCHAR(128)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `recognition_scope_level` VARCHAR(128)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `organization_club` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `granting_body` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `recognition_date` DATE NOT NULL,

                `recognition_title_name` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `additional_notes` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_student_recognition_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );

        /*
         * Student 07 — Sports
         *
         * Stores one underlying athletic participation, competition,
         * or competition-result occurrence for the student.
         *
         * Sports clinics/trainings remain Seminar / Training →
         * Sports Development. Separately conferred formal sports
         * recognitions remain Citation / Recognition → Sports.
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `student_sports_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `sport_discipline` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `specified_sport_discipline` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `competition_type` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `specified_competition` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `competition_level` VARCHAR(32)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `participation_type` VARCHAR(32)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `placement_result` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `competition_event_title` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `organizer_issuing_organization` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `event_start_date` DATE NOT NULL,

                `event_end_date` DATE NULL,

                `additional_notes` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_student_sports_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION,

                CONSTRAINT `chk_student_sports_discipline`
                    CHECK (
                        `sport_discipline` IN (
                            'BASKETBALL',
                            'VOLLEYBALL',
                            'ATHLETICS',
                            'SWIMMING',
                            'BADMINTON',
                            'TABLE_TENNIS',
                            'CHESS',
                            'FOOTBALL',
                            'SEPAK_TAKRAW',
                            'OTHER_APPROVED_SPORT'
                        )
                    ),

                CONSTRAINT `chk_student_sports_specified_discipline`
                    CHECK (
                        (
                            `sport_discipline` = 'OTHER_APPROVED_SPORT'
                            AND `specified_sport_discipline` IS NOT NULL
                            AND CHAR_LENGTH(TRIM(`specified_sport_discipline`)) > 0
                        )
                        OR
                        (
                            `sport_discipline` <> 'OTHER_APPROVED_SPORT'
                            AND `specified_sport_discipline` IS NULL
                        )
                    ),

                CONSTRAINT `chk_student_sports_competition_type`
                    CHECK (
                        `competition_type` IN (
                            'PRISAA',
                            'NDEA',
                            'INTRAMURALS_UNIVERSITY_MEET',
                            'OTHER_APPROVED_COMPETITION'
                        )
                    ),

                CONSTRAINT `chk_student_sports_specified_competition`
                    CHECK (
                        (
                            `competition_type` = 'OTHER_APPROVED_COMPETITION'
                            AND `specified_competition` IS NOT NULL
                            AND CHAR_LENGTH(TRIM(`specified_competition`)) > 0
                        )
                        OR
                        (
                            `competition_type` <> 'OTHER_APPROVED_COMPETITION'
                            AND `specified_competition` IS NULL
                        )
                    ),

                CONSTRAINT `chk_student_sports_competition_level`
                    CHECK (
                        `competition_level` IS NULL
                        OR `competition_level` IN (
                            'LOCAL',
                            'REGIONAL',
                            'NATIONAL'
                        )
                    ),

                CONSTRAINT `chk_student_sports_level_context`
                    CHECK (
                        (
                            `competition_type` = 'PRISAA'
                            AND `competition_level` IS NOT NULL
                        )
                        OR
                        (
                            `competition_type` IN (
                                'NDEA',
                                'INTRAMURALS_UNIVERSITY_MEET'
                            )
                            AND `competition_level` IS NULL
                        )
                        OR
                        (
                            `competition_type` = 'OTHER_APPROVED_COMPETITION'
                        )
                    ),

                CONSTRAINT `chk_student_sports_participation_type`
                    CHECK (
                        `participation_type` IN (
                            'INDIVIDUAL',
                            'TEAM'
                        )
                    ),

                CONSTRAINT `chk_student_sports_placement_result`
                    CHECK (
                        `placement_result` IN (
                            'PARTICIPANT',
                            'BRONZE_3RD_PLACE',
                            'SILVER_2ND_PLACE',
                            'GOLD_1ST_PLACE_CHAMPION'
                        )
                    ),

                CONSTRAINT `chk_student_sports_event_dates`
                    CHECK (
                        `event_end_date` IS NULL
                        OR `event_end_date` >= `event_start_date`
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );

        /*
         * Student 08 — Socio-Cultural / Performing Arts
         *
         * Stores one underlying socio-cultural or performing-arts
         * participation, performance, competition, or placement/result
         * occurrence connected to one discipline.
         *
         * Structured development remains Seminar / Training →
         * Socio-Cultural / Performing Arts Development.
         * Separately conferred non-placement formal recognitions remain
         * Citation / Recognition → Socio-Cultural / Performing Arts.
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `student_socio_cultural_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `discipline` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `specified_discipline` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `event_type` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `specified_event_type` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `competition_level` VARCHAR(32)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `participation_type` VARCHAR(32)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `placement_result` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `event_competition_title` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `organizer_issuing_organization` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `event_start_date` DATE NOT NULL,

                `event_end_date` DATE NULL,

                `additional_notes` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_student_socio_cultural_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION,

                CONSTRAINT `chk_student_socio_cultural_discipline`
                    CHECK (
                        `discipline` IN (
                            'DANCE',
                            'VOCAL_SINGING',
                            'INSTRUMENTAL',
                            'THEATER',
                            'CULTURAL_PERFORMANCE',
                            'PERFORMING_ARTS',
                            'OTHER_APPROVED_DISCIPLINE'
                        )
                    ),

                CONSTRAINT `chk_student_socio_cultural_specified_discipline`
                    CHECK (
                        (
                            `discipline` = 'OTHER_APPROVED_DISCIPLINE'
                            AND `specified_discipline` IS NOT NULL
                            AND CHAR_LENGTH(TRIM(`specified_discipline`)) > 0
                        )
                        OR
                        (
                            `discipline` <> 'OTHER_APPROVED_DISCIPLINE'
                            AND `specified_discipline` IS NULL
                        )
                    ),

                CONSTRAINT `chk_student_socio_cultural_event_type`
                    CHECK (
                        `event_type` IN (
                            'PRISAA',
                            'NDEA_OR_EQUIVALENT',
                            'UNIVERSITY_LEVEL_COMPETITION',
                            'OTHER_APPROVED_EVENT'
                        )
                    ),

                CONSTRAINT `chk_student_socio_cultural_specified_event`
                    CHECK (
                        (
                            `event_type` = 'OTHER_APPROVED_EVENT'
                            AND `specified_event_type` IS NOT NULL
                            AND CHAR_LENGTH(TRIM(`specified_event_type`)) > 0
                        )
                        OR
                        (
                            `event_type` <> 'OTHER_APPROVED_EVENT'
                            AND `specified_event_type` IS NULL
                        )
                    ),

                CONSTRAINT `chk_student_socio_cultural_competition_level`
                    CHECK (
                        `competition_level` IS NULL
                        OR `competition_level` IN (
                            'LOCAL',
                            'REGIONAL',
                            'NATIONAL'
                        )
                    ),

                CONSTRAINT `chk_student_socio_cultural_participation_type`
                    CHECK (
                        `participation_type` IN (
                            'INDIVIDUAL',
                            'GROUP_ENSEMBLE'
                        )
                    ),

                CONSTRAINT `chk_student_socio_cultural_placement_result`
                    CHECK (
                        `placement_result` IN (
                            'PARTICIPANT',
                            'BRONZE_3RD_PLACE',
                            'SILVER_2ND_PLACE',
                            'GOLD_1ST_PLACE_CHAMPION'
                        )
                    ),

                CONSTRAINT `chk_student_socio_cultural_event_dates`
                    CHECK (
                        `event_end_date` IS NULL
                        OR `event_end_date` >= `event_start_date`
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );

        /*
         * Student 09 — Campus Journalism
         *
         * Stores the underlying campus-journalism publication output
         * or campus-publication role occurrence itself.
         *
         * Journalism seminars/workshops/trainings remain under
         * Seminar / Training → Campus Journalism Development.
         * Separately conferred journalism/publication recognitions remain
         * Citation / Recognition → Campus Journalism.
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `student_campus_journalism_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `record_type` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `title_of_work` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `publication_outlet` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `publication_date` DATE NULL,

                `publication_role` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `role_start_date` DATE NULL,

                `role_end_date` DATE NULL,

                `additional_notes` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_student_campus_journalism_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION,

                CONSTRAINT `chk_student_campus_journalism_record_type`
                    CHECK (
                        `record_type` IN (
                            'NEWS_ITEM',
                            'LITERARY_WORK',
                            'COLUMN',
                            'EDITORIAL',
                            'PUBLICATION_MEMBER_CONTRIBUTOR',
                            'PUBLICATION_OFFICER'
                        )
                    ),

                CONSTRAINT `chk_student_campus_journalism_output_shape`
                    CHECK (
                        (
                            `record_type` IN (
                                'NEWS_ITEM',
                                'LITERARY_WORK',
                                'COLUMN',
                                'EDITORIAL'
                            )
                            AND `title_of_work` IS NOT NULL
                            AND CHAR_LENGTH(TRIM(`title_of_work`)) > 0
                            AND `publication_date` IS NOT NULL
                            AND `role_start_date` IS NULL
                            AND `role_end_date` IS NULL
                        )
                        OR
                        (
                            `record_type` IN (
                                'PUBLICATION_MEMBER_CONTRIBUTOR',
                                'PUBLICATION_OFFICER'
                            )
                            AND `title_of_work` IS NULL
                            AND `publication_date` IS NULL
                            AND `role_start_date` IS NOT NULL
                        )
                    ),

                CONSTRAINT `chk_student_campus_journalism_role_dates`
                    CHECK (
                        `role_end_date` IS NULL
                        OR (
                            `role_start_date` IS NOT NULL
                            AND `role_end_date` >= `role_start_date`
                        )
                    ),

                CONSTRAINT `chk_student_campus_journalism_outlet_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`publication_outlet`)) > 0
                    ),

                CONSTRAINT `chk_student_campus_journalism_role_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`publication_role`)) > 0
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );
    }

    public function down()
    {
        $this->db->query(
            'DROP TABLE IF EXISTS `student_campus_journalism_details`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `student_socio_cultural_details`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `student_sports_details`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `student_recognition_details`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `student_seminar_training_details`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `student_church_ministry_details`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `student_service_details`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `student_organization_involvement_details`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `student_leadership_position_details`'
        );
    }
}
