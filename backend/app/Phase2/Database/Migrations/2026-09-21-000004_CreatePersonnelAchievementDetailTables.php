<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreatePersonnelAchievementDetailTables extends Migration
{
    public function up()
    {
        /*
         * Personnel A.1 — Education
         *
         * One record represents one formal academic education/program
         * occurrence through a school, college, university, or comparable
         * formal educational institution.
         *
         * Supporting Evidence is stored in the shared evidence layer.
         * Verification, OCR/AI metadata, scoring, and workflow state remain
         * outside this detail table.
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `personnel_education_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `start_year` SMALLINT UNSIGNED NOT NULL,

                `end_year` SMALLINT UNSIGNED NULL,

                `is_present` TINYINT(1) NOT NULL DEFAULT 0,

                `course_degree` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `school_university` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `remarks` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_personnel_education_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION,

                CONSTRAINT `chk_personnel_education_start_year`
                    CHECK (
                        `start_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_education_end_year`
                    CHECK (
                        `end_year` IS NULL
                        OR `end_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_education_present_flag`
                    CHECK (
                        `is_present` IN (0, 1)
                    ),

                CONSTRAINT `chk_personnel_education_period_state`
                    CHECK (
                        (
                            `is_present` = 1
                            AND `end_year` IS NULL
                        )
                        OR
                        (
                            `is_present` = 0
                            AND `end_year` IS NOT NULL
                            AND `end_year` >= `start_year`
                        )
                    ),

                CONSTRAINT `chk_personnel_education_course_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`course_degree`)) > 0
                    ),

                CONSTRAINT `chk_personnel_education_school_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`school_university`)) > 0
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );

        /*
         * Personnel A.2 — Active Membership to Professional Organizations
         *
         * One record represents one continuous membership relationship
         * with one professional organization for one membership period.
         *
         * Annual renewals of an uninterrupted membership remain the same
         * real-world record. A genuine later rejoining after a material
         * break may be represented as a separate membership period.
         *
         * Supporting Evidence is stored in the shared evidence layer.
         * Verification, OCR/AI metadata, scoring, and workflow state remain
         * outside this detail table.
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `personnel_professional_membership_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `start_year` SMALLINT UNSIGNED NOT NULL,

                `end_year` SMALLINT UNSIGNED NULL,

                `is_present` TINYINT(1) NOT NULL DEFAULT 0,

                `organization_name` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `conducted_or_organized_by` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `remarks` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_personnel_prof_membership_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION,

                CONSTRAINT `chk_personnel_prof_membership_start_year`
                    CHECK (
                        `start_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_prof_membership_end_year`
                    CHECK (
                        `end_year` IS NULL
                        OR `end_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_prof_membership_present_flag`
                    CHECK (
                        `is_present` IN (0, 1)
                    ),

                CONSTRAINT `chk_personnel_prof_membership_period_state`
                    CHECK (
                        (
                            `is_present` = 1
                            AND `end_year` IS NULL
                        )
                        OR
                        (
                            `is_present` = 0
                            AND `end_year` IS NOT NULL
                            AND `end_year` >= `start_year`
                        )
                    ),

                CONSTRAINT `chk_personnel_prof_membership_org_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`organization_name`)) > 0
                    ),

                CONSTRAINT `chk_personnel_prof_membership_unit_nonblank`
                    CHECK (
                        `conducted_or_organized_by` IS NULL
                        OR CHAR_LENGTH(TRIM(`conducted_or_organized_by`)) > 0
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );

        /*
         * Personnel A.3 — Attendance to Seminar-Workshop/Trainings
         *
         * One record represents one actual attendance/participation
         * occurrence in one seminar, workshop, training, conference,
         * webinar, or comparable professional-development activity.
         *
         * One continuous multi-day activity remains one record.
         *
         * Supporting Evidence is stored in the shared evidence layer.
         * Verification, OCR/AI metadata, scoring, training hours,
         * completion interpretation, and workflow state remain outside
         * this detail table.
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `personnel_seminar_training_attendance_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `start_date` DATE NOT NULL,

                `end_date` DATE NOT NULL,

                `title` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `conducted_or_organized_by` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `remarks` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_personnel_seminar_training_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION,

                CONSTRAINT `chk_personnel_seminar_training_dates`
                    CHECK (
                        `end_date` >= `start_date`
                    ),

                CONSTRAINT `chk_personnel_seminar_training_title_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`title`)) > 0
                    ),

                CONSTRAINT `chk_personnel_seminar_training_org_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`conducted_or_organized_by`)) > 0
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );

        /*
         * Personnel B.1 — Invited as Guest Lecturer / Consultant /
         * Judge / Resource Person
         *
         * One record represents one distinct invited professional
         * engagement actually rendered by the personnel/faculty member.
         *
         * Supporting Evidence is stored in the shared evidence layer.
         * Verification, OCR/AI provenance, derived ranking points,
         * scoring totals, and workflow state remain outside this
         * detail table.
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `personnel_invited_professional_engagement_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `start_date` DATE NOT NULL,

                `end_date` DATE NULL,

                `activity` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `conducted_or_organized_by` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `role` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `sponsoring_organization_type` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `engagement_extent` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `participant_scope` VARCHAR(32)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `remarks` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_personnel_invited_engagement_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION,

                CONSTRAINT `chk_personnel_invited_engagement_dates`
                    CHECK (
                        `end_date` IS NULL
                        OR `end_date` >= `start_date`
                    ),

                CONSTRAINT `chk_personnel_invited_engagement_activity_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`activity`)) > 0
                    ),

                CONSTRAINT `chk_personnel_invited_engagement_org_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`conducted_or_organized_by`)) > 0
                    ),

                CONSTRAINT `chk_personnel_invited_engagement_role`
                    CHECK (
                        `role` IN (
                            'GUEST_LECTURER_LECTURER',
                            'CONSULTANT',
                            'RESOURCE_PERSON',
                            'GUEST_SPEAKER',
                            'JUDGE'
                        )
                    ),

                CONSTRAINT `chk_personnel_invited_engagement_sponsor_type`
                    CHECK (
                        `sponsoring_organization_type` IN (
                            'NDMU',
                            'EXTERNAL_AGENCIES_OTHER_SCHOOLS'
                        )
                    ),

                CONSTRAINT `chk_personnel_invited_engagement_extent`
                    CHECK (
                        `engagement_extent` IN (
                            'ONE_HOUR',
                            'HALF_DAY',
                            'ONE_DAY',
                            'TWO_DAYS',
                            'MORE_THAN_TWO_DAYS'
                        )
                    ),

                CONSTRAINT `chk_personnel_invited_engagement_scope`
                    CHECK (
                        `participant_scope` IN (
                            'LOCAL',
                            'REGIONAL',
                            'NATIONAL',
                            'INTERNATIONAL'
                        )
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );

        /*
         * Personnel B.2 — Publication
         * (Scholarly Paper / Article / Research Output / Book)
         *
         * One record represents one distinct scholarly publication
         * output that has actually reached a qualifying publication state.
         *
         * Publication-date components preserve only the precision supported
         * by authoritative evidence. Missing month/day values are not
         * fabricated.
         *
         * Supporting Evidence is stored in the shared evidence layer.
         * Name/Signature is represented by the controlled digital
         * verification/audit workflow rather than a faculty-entered field.
         * Verification, OCR/AI provenance, derived ranking points,
         * criteria versions, and workflow state remain outside this
         * detail table.
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `personnel_publication_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `publication_date_precision` VARCHAR(16)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `publication_year` SMALLINT UNSIGNED NOT NULL,

                `publication_month` TINYINT UNSIGNED NULL,

                `publication_day` TINYINT UNSIGNED NULL,

                `publication_title` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `granted_by` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `publication_type` VARCHAR(32)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `publication_scope` VARCHAR(32)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_personnel_publication_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION,

                CONSTRAINT `chk_personnel_publication_date_precision`
                    CHECK (
                        `publication_date_precision` IN (
                            'YEAR',
                            'MONTH',
                            'DATE'
                        )
                    ),

                CONSTRAINT `chk_personnel_publication_year`
                    CHECK (
                        `publication_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_publication_month`
                    CHECK (
                        `publication_month` IS NULL
                        OR `publication_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_personnel_publication_day`
                    CHECK (
                        `publication_day` IS NULL
                        OR `publication_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_personnel_publication_date_bundle`
                    CHECK (
                        (
                            `publication_date_precision` = 'YEAR'
                            AND `publication_month` IS NULL
                            AND `publication_day` IS NULL
                        )
                        OR
                        (
                            `publication_date_precision` = 'MONTH'
                            AND `publication_month` IS NOT NULL
                            AND `publication_day` IS NULL
                        )
                        OR
                        (
                            `publication_date_precision` = 'DATE'
                            AND `publication_month` IS NOT NULL
                            AND `publication_day` IS NOT NULL
                        )
                    ),

                CONSTRAINT `chk_personnel_publication_calendar_day`
                    CHECK (
                        `publication_day` IS NULL
                        OR (
                            `publication_month` IN (1, 3, 5, 7, 8, 10, 12)
                            AND `publication_day` BETWEEN 1 AND 31
                        )
                        OR (
                            `publication_month` IN (4, 6, 9, 11)
                            AND `publication_day` BETWEEN 1 AND 30
                        )
                        OR (
                            `publication_month` = 2
                            AND (
                                `publication_day` BETWEEN 1 AND 28
                                OR (
                                    `publication_day` = 29
                                    AND (
                                        MOD(`publication_year`, 400) = 0
                                        OR (
                                            MOD(`publication_year`, 4) = 0
                                            AND MOD(`publication_year`, 100) <> 0
                                        )
                                    )
                                )
                            )
                        )
                    ),

                CONSTRAINT `chk_personnel_publication_title_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`publication_title`)) > 0
                    ),

                CONSTRAINT `chk_personnel_publication_granted_by_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`granted_by`)) > 0
                    ),

                CONSTRAINT `chk_personnel_publication_type`
                    CHECK (
                        `publication_type` IN (
                            'ELEMENTARY',
                            'REVIEWS',
                            'COMPILATION',
                            'ARTICLE',
                            'SCHOLARLY_PAPER',
                            'MONOGRAPH',
                            'RESEARCH_OUTPUT',
                            'BOOK'
                        )
                    ),

                CONSTRAINT `chk_personnel_publication_scope`
                    CHECK (
                        `publication_scope` IN (
                            'LOCAL',
                            'REGIONAL',
                            'NATIONAL',
                            'INTERNATIONAL'
                        )
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );

        /*
         * Personnel B.3 — Conduct of Research
         *
         * One record represents one distinct research undertaking
         * conducted by the faculty/personnel member.
         *
         * Date(s) preserve only the precision supported by authoritative
         * evidence. A research record may have one supported research date
         * or an inclusive research period. Missing end-date components are
         * not fabricated for ongoing or otherwise incompletely dated work.
         *
         * Supporting Evidence is stored in the shared evidence layer.
         * Name/Signature is represented through controlled digital
         * verification/audit metadata rather than a faculty-entered field.
         *
         * The official B.3 maximum is 40 points, but the available
         * authoritative source does not provide the lower-level scoring
         * formula. Automatic B.3 scoring therefore remains outside this
         * detail table.
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `personnel_research_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `start_date_precision` VARCHAR(16)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `start_year` SMALLINT UNSIGNED NOT NULL,

                `start_month` TINYINT UNSIGNED NULL,

                `start_day` TINYINT UNSIGNED NULL,

                `end_date_precision` VARCHAR(16)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `end_year` SMALLINT UNSIGNED NULL,

                `end_month` TINYINT UNSIGNED NULL,

                `end_day` TINYINT UNSIGNED NULL,

                `research_title` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `granted_by` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_personnel_research_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION,

                CONSTRAINT `chk_personnel_research_start_precision`
                    CHECK (
                        `start_date_precision` IN (
                            'YEAR',
                            'MONTH',
                            'DATE'
                        )
                    ),

                CONSTRAINT `chk_personnel_research_start_year`
                    CHECK (
                        `start_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_research_start_month`
                    CHECK (
                        `start_month` IS NULL
                        OR `start_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_personnel_research_start_day`
                    CHECK (
                        `start_day` IS NULL
                        OR `start_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_personnel_research_start_bundle`
                    CHECK (
                        (
                            `start_date_precision` = 'YEAR'
                            AND `start_month` IS NULL
                            AND `start_day` IS NULL
                        )
                        OR
                        (
                            `start_date_precision` = 'MONTH'
                            AND `start_month` IS NOT NULL
                            AND `start_day` IS NULL
                        )
                        OR
                        (
                            `start_date_precision` = 'DATE'
                            AND `start_month` IS NOT NULL
                            AND `start_day` IS NOT NULL
                        )
                    ),

                CONSTRAINT `chk_personnel_research_start_calendar_day`
                    CHECK (
                        `start_day` IS NULL
                        OR (
                            `start_month` IN (1, 3, 5, 7, 8, 10, 12)
                            AND `start_day` BETWEEN 1 AND 31
                        )
                        OR (
                            `start_month` IN (4, 6, 9, 11)
                            AND `start_day` BETWEEN 1 AND 30
                        )
                        OR (
                            `start_month` = 2
                            AND (
                                `start_day` BETWEEN 1 AND 28
                                OR (
                                    `start_day` = 29
                                    AND (
                                        MOD(`start_year`, 400) = 0
                                        OR (
                                            MOD(`start_year`, 4) = 0
                                            AND MOD(`start_year`, 100) <> 0
                                        )
                                    )
                                )
                            )
                        )
                    ),

                CONSTRAINT `chk_personnel_research_end_precision`
                    CHECK (
                        `end_date_precision` IS NULL
                        OR `end_date_precision` IN (
                            'YEAR',
                            'MONTH',
                            'DATE'
                        )
                    ),

                CONSTRAINT `chk_personnel_research_end_year`
                    CHECK (
                        `end_year` IS NULL
                        OR `end_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_research_end_month`
                    CHECK (
                        `end_month` IS NULL
                        OR `end_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_personnel_research_end_day`
                    CHECK (
                        `end_day` IS NULL
                        OR `end_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_personnel_research_end_bundle`
                    CHECK (
                        (
                            `end_date_precision` IS NULL
                            AND `end_year` IS NULL
                            AND `end_month` IS NULL
                            AND `end_day` IS NULL
                        )
                        OR
                        (
                            `end_date_precision` = 'YEAR'
                            AND `end_year` IS NOT NULL
                            AND `end_month` IS NULL
                            AND `end_day` IS NULL
                        )
                        OR
                        (
                            `end_date_precision` = 'MONTH'
                            AND `end_year` IS NOT NULL
                            AND `end_month` IS NOT NULL
                            AND `end_day` IS NULL
                        )
                        OR
                        (
                            `end_date_precision` = 'DATE'
                            AND `end_year` IS NOT NULL
                            AND `end_month` IS NOT NULL
                            AND `end_day` IS NOT NULL
                        )
                    ),

                CONSTRAINT `chk_personnel_research_end_calendar_day`
                    CHECK (
                        `end_day` IS NULL
                        OR (
                            `end_month` IN (1, 3, 5, 7, 8, 10, 12)
                            AND `end_day` BETWEEN 1 AND 31
                        )
                        OR (
                            `end_month` IN (4, 6, 9, 11)
                            AND `end_day` BETWEEN 1 AND 30
                        )
                        OR (
                            `end_month` = 2
                            AND (
                                `end_day` BETWEEN 1 AND 28
                                OR (
                                    `end_day` = 29
                                    AND (
                                        MOD(`end_year`, 400) = 0
                                        OR (
                                            MOD(`end_year`, 4) = 0
                                            AND MOD(`end_year`, 100) <> 0
                                        )
                                    )
                                )
                            )
                        )
                    ),

                CONSTRAINT `chk_personnel_research_period_year_order`
                    CHECK (
                        `end_year` IS NULL
                        OR `end_year` >= `start_year`
                    ),

                CONSTRAINT `chk_personnel_research_period_month_order`
                    CHECK (
                        `end_year` IS NULL
                        OR `end_year` > `start_year`
                        OR `start_month` IS NULL
                        OR `end_month` IS NULL
                        OR `end_month` >= `start_month`
                    ),

                CONSTRAINT `chk_personnel_research_period_day_order`
                    CHECK (
                        `end_year` IS NULL
                        OR `end_year` > `start_year`
                        OR `start_month` IS NULL
                        OR `end_month` IS NULL
                        OR `end_month` > `start_month`
                        OR `start_day` IS NULL
                        OR `end_day` IS NULL
                        OR `end_day` >= `start_day`
                    ),

                CONSTRAINT `chk_personnel_research_title_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`research_title`)) > 0
                    ),

                CONSTRAINT `chk_personnel_research_granted_by_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`granted_by`)) > 0
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );

        /*
         * Personnel B.4 — Recognition/Awards
         *
         * One record represents one distinct formal professional
         * recognition/award decision or formal nomination event
         * attributable to the faculty/personnel member.
         *
         * Date(s) preserve only evidence-supported precision.
         * Missing date components are not fabricated.
         *
         * Candidate Recognition Status and Scope may be supplied during
         * submission, but the scoring-effective verified classifications
         * remain reviewer-controlled outside this detail table.
         *
         * Supporting Evidence is stored in the shared evidence layer.
         * Name/Signature is represented through controlled digital
         * verification/audit metadata rather than a faculty-entered field.
         *
         * B.4 scoring is performed only after verification using the
         * versioned official Recognition Status x Scope matrix.
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `personnel_recognition_award_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `start_date_precision` VARCHAR(16)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `start_year` SMALLINT UNSIGNED NOT NULL,

                `start_month` TINYINT UNSIGNED NULL,

                `start_day` TINYINT UNSIGNED NULL,

                `end_date_precision` VARCHAR(16)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `end_year` SMALLINT UNSIGNED NULL,

                `end_month` TINYINT UNSIGNED NULL,

                `end_day` TINYINT UNSIGNED NULL,

                `recognition_title` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `granted_by` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `recognition_status_candidate` VARCHAR(16)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `recognition_scope_candidate` VARCHAR(32)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_personnel_recognition_award_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION,

                CONSTRAINT `chk_personnel_recognition_start_precision`
                    CHECK (
                        `start_date_precision` IN (
                            'YEAR',
                            'MONTH',
                            'DATE'
                        )
                    ),

                CONSTRAINT `chk_personnel_recognition_start_year`
                    CHECK (
                        `start_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_recognition_start_month`
                    CHECK (
                        `start_month` IS NULL
                        OR `start_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_personnel_recognition_start_day`
                    CHECK (
                        `start_day` IS NULL
                        OR `start_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_personnel_recognition_start_bundle`
                    CHECK (
                        (
                            `start_date_precision` = 'YEAR'
                            AND `start_month` IS NULL
                            AND `start_day` IS NULL
                        )
                        OR
                        (
                            `start_date_precision` = 'MONTH'
                            AND `start_month` IS NOT NULL
                            AND `start_day` IS NULL
                        )
                        OR
                        (
                            `start_date_precision` = 'DATE'
                            AND `start_month` IS NOT NULL
                            AND `start_day` IS NOT NULL
                        )
                    ),

                CONSTRAINT `chk_personnel_recognition_start_calendar_day`
                    CHECK (
                        `start_day` IS NULL
                        OR (
                            `start_month` IN (1, 3, 5, 7, 8, 10, 12)
                            AND `start_day` BETWEEN 1 AND 31
                        )
                        OR (
                            `start_month` IN (4, 6, 9, 11)
                            AND `start_day` BETWEEN 1 AND 30
                        )
                        OR (
                            `start_month` = 2
                            AND (
                                `start_day` BETWEEN 1 AND 28
                                OR (
                                    `start_day` = 29
                                    AND (
                                        MOD(`start_year`, 400) = 0
                                        OR (
                                            MOD(`start_year`, 4) = 0
                                            AND MOD(`start_year`, 100) <> 0
                                        )
                                    )
                                )
                            )
                        )
                    ),

                CONSTRAINT `chk_personnel_recognition_end_precision`
                    CHECK (
                        `end_date_precision` IS NULL
                        OR `end_date_precision` IN (
                            'YEAR',
                            'MONTH',
                            'DATE'
                        )
                    ),

                CONSTRAINT `chk_personnel_recognition_end_year`
                    CHECK (
                        `end_year` IS NULL
                        OR `end_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_recognition_end_month`
                    CHECK (
                        `end_month` IS NULL
                        OR `end_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_personnel_recognition_end_day`
                    CHECK (
                        `end_day` IS NULL
                        OR `end_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_personnel_recognition_end_bundle`
                    CHECK (
                        (
                            `end_date_precision` IS NULL
                            AND `end_year` IS NULL
                            AND `end_month` IS NULL
                            AND `end_day` IS NULL
                        )
                        OR
                        (
                            `end_date_precision` = 'YEAR'
                            AND `end_year` IS NOT NULL
                            AND `end_month` IS NULL
                            AND `end_day` IS NULL
                        )
                        OR
                        (
                            `end_date_precision` = 'MONTH'
                            AND `end_year` IS NOT NULL
                            AND `end_month` IS NOT NULL
                            AND `end_day` IS NULL
                        )
                        OR
                        (
                            `end_date_precision` = 'DATE'
                            AND `end_year` IS NOT NULL
                            AND `end_month` IS NOT NULL
                            AND `end_day` IS NOT NULL
                        )
                    ),

                CONSTRAINT `chk_personnel_recognition_end_calendar_day`
                    CHECK (
                        `end_day` IS NULL
                        OR (
                            `end_month` IN (1, 3, 5, 7, 8, 10, 12)
                            AND `end_day` BETWEEN 1 AND 31
                        )
                        OR (
                            `end_month` IN (4, 6, 9, 11)
                            AND `end_day` BETWEEN 1 AND 30
                        )
                        OR (
                            `end_month` = 2
                            AND (
                                `end_day` BETWEEN 1 AND 28
                                OR (
                                    `end_day` = 29
                                    AND (
                                        MOD(`end_year`, 400) = 0
                                        OR (
                                            MOD(`end_year`, 4) = 0
                                            AND MOD(`end_year`, 100) <> 0
                                        )
                                    )
                                )
                            )
                        )
                    ),

                CONSTRAINT `chk_personnel_recognition_period_year_order`
                    CHECK (
                        `end_year` IS NULL
                        OR `end_year` >= `start_year`
                    ),

                CONSTRAINT `chk_personnel_recognition_period_month_order`
                    CHECK (
                        `end_year` IS NULL
                        OR `end_year` > `start_year`
                        OR `start_month` IS NULL
                        OR `end_month` IS NULL
                        OR `end_month` >= `start_month`
                    ),

                CONSTRAINT `chk_personnel_recognition_period_day_order`
                    CHECK (
                        `end_year` IS NULL
                        OR `end_year` > `start_year`
                        OR `start_month` IS NULL
                        OR `end_month` IS NULL
                        OR `end_month` > `start_month`
                        OR `start_day` IS NULL
                        OR `end_day` IS NULL
                        OR `end_day` >= `start_day`
                    ),

                CONSTRAINT `chk_personnel_recognition_title_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`recognition_title`)) > 0
                    ),

                CONSTRAINT `chk_personnel_recognition_granted_by_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`granted_by`)) > 0
                    ),

                CONSTRAINT `chk_personnel_recognition_status_candidate`
                    CHECK (
                        `recognition_status_candidate` IS NULL
                        OR `recognition_status_candidate` IN (
                            'NOMINEE',
                            'AWARDEE'
                        )
                    ),

                CONSTRAINT `chk_personnel_recognition_scope_candidate`
                    CHECK (
                        `recognition_scope_candidate` IS NULL
                        OR `recognition_scope_candidate` IN (
                            'LOCAL',
                            'PROVINCIAL_REGIONAL',
                            'NATIONAL',
                            'INTERNATIONAL'
                        )
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );

        /*
         * Personnel B.5 — Production of Instructional Materials
         *
         * One record represents one distinct real-world instructional
         * material/output actually produced by and attributable to the
         * faculty/personnel portfolio owner.
         *
         * Multiple files, formats, copies, semesters of use, uploads,
         * evidence items, reprints, or minor revisions do not by
         * themselves create additional B.5 accomplishments.
         *
         * Date(s) preserve only evidence-supported precision. Missing
         * day/month components are never fabricated.
         *
         * Material Type stored here is the faculty/candidate
         * classification only. The scoring-effective Material Type is
         * reviewer-controlled outside this detail table.
         *
         * Supporting Evidence is stored in the shared evidence layer.
         * Name/Signature remains a source-defined attestation concept
         * handled through controlled digital verification/audit workflow.
         *
         * B.5 scoring and criterion/Area B caps remain in the versioned
         * rules-engine/scoring layer.
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `personnel_instructional_material_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `start_date_precision` VARCHAR(16)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `start_year` SMALLINT UNSIGNED NOT NULL,

                `start_month` TINYINT UNSIGNED NULL,

                `start_day` TINYINT UNSIGNED NULL,

                `end_date_precision` VARCHAR(16)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `end_year` SMALLINT UNSIGNED NULL,

                `end_month` TINYINT UNSIGNED NULL,

                `end_day` TINYINT UNSIGNED NULL,

                `materials` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `granted_by` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `material_type_candidate` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_personnel_instructional_material_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION,

                CONSTRAINT `chk_personnel_instructional_material_start_precision`
                    CHECK (
                        `start_date_precision` IN (
                            'YEAR',
                            'MONTH',
                            'DATE'
                        )
                    ),

                CONSTRAINT `chk_personnel_instructional_material_start_year`
                    CHECK (
                        `start_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_instructional_material_start_month`
                    CHECK (
                        `start_month` IS NULL
                        OR `start_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_personnel_instructional_material_start_day`
                    CHECK (
                        `start_day` IS NULL
                        OR `start_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_personnel_instructional_material_start_bundle`
                    CHECK (
                        (
                            `start_date_precision` = 'YEAR'
                            AND `start_month` IS NULL
                            AND `start_day` IS NULL
                        )
                        OR
                        (
                            `start_date_precision` = 'MONTH'
                            AND `start_month` IS NOT NULL
                            AND `start_day` IS NULL
                        )
                        OR
                        (
                            `start_date_precision` = 'DATE'
                            AND `start_month` IS NOT NULL
                            AND `start_day` IS NOT NULL
                        )
                    ),

                CONSTRAINT `chk_personnel_instructional_material_start_calendar_day`
                    CHECK (
                        `start_day` IS NULL
                        OR (
                            `start_month` IN (1, 3, 5, 7, 8, 10, 12)
                            AND `start_day` BETWEEN 1 AND 31
                        )
                        OR (
                            `start_month` IN (4, 6, 9, 11)
                            AND `start_day` BETWEEN 1 AND 30
                        )
                        OR (
                            `start_month` = 2
                            AND (
                                `start_day` BETWEEN 1 AND 28
                                OR (
                                    `start_day` = 29
                                    AND (
                                        MOD(`start_year`, 400) = 0
                                        OR (
                                            MOD(`start_year`, 4) = 0
                                            AND MOD(`start_year`, 100) <> 0
                                        )
                                    )
                                )
                            )
                        )
                    ),

                CONSTRAINT `chk_personnel_instructional_material_end_precision`
                    CHECK (
                        `end_date_precision` IS NULL
                        OR `end_date_precision` IN (
                            'YEAR',
                            'MONTH',
                            'DATE'
                        )
                    ),

                CONSTRAINT `chk_personnel_instructional_material_end_year`
                    CHECK (
                        `end_year` IS NULL
                        OR `end_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_instructional_material_end_month`
                    CHECK (
                        `end_month` IS NULL
                        OR `end_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_personnel_instructional_material_end_day`
                    CHECK (
                        `end_day` IS NULL
                        OR `end_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_personnel_instructional_material_end_bundle`
                    CHECK (
                        (
                            `end_date_precision` IS NULL
                            AND `end_year` IS NULL
                            AND `end_month` IS NULL
                            AND `end_day` IS NULL
                        )
                        OR
                        (
                            `end_date_precision` = 'YEAR'
                            AND `end_year` IS NOT NULL
                            AND `end_month` IS NULL
                            AND `end_day` IS NULL
                        )
                        OR
                        (
                            `end_date_precision` = 'MONTH'
                            AND `end_year` IS NOT NULL
                            AND `end_month` IS NOT NULL
                            AND `end_day` IS NULL
                        )
                        OR
                        (
                            `end_date_precision` = 'DATE'
                            AND `end_year` IS NOT NULL
                            AND `end_month` IS NOT NULL
                            AND `end_day` IS NOT NULL
                        )
                    ),

                CONSTRAINT `chk_personnel_instructional_material_end_calendar_day`
                    CHECK (
                        `end_day` IS NULL
                        OR (
                            `end_month` IN (1, 3, 5, 7, 8, 10, 12)
                            AND `end_day` BETWEEN 1 AND 31
                        )
                        OR (
                            `end_month` IN (4, 6, 9, 11)
                            AND `end_day` BETWEEN 1 AND 30
                        )
                        OR (
                            `end_month` = 2
                            AND (
                                `end_day` BETWEEN 1 AND 28
                                OR (
                                    `end_day` = 29
                                    AND (
                                        MOD(`end_year`, 400) = 0
                                        OR (
                                            MOD(`end_year`, 4) = 0
                                            AND MOD(`end_year`, 100) <> 0
                                        )
                                    )
                                )
                            )
                        )
                    ),

                CONSTRAINT `chk_personnel_instructional_material_period_year_order`
                    CHECK (
                        `end_year` IS NULL
                        OR `end_year` >= `start_year`
                    ),

                CONSTRAINT `chk_personnel_instructional_material_period_month_order`
                    CHECK (
                        `end_year` IS NULL
                        OR `end_year` > `start_year`
                        OR `start_month` IS NULL
                        OR `end_month` IS NULL
                        OR `end_month` >= `start_month`
                    ),

                CONSTRAINT `chk_personnel_instructional_material_period_day_order`
                    CHECK (
                        `end_year` IS NULL
                        OR `end_year` > `start_year`
                        OR `start_month` IS NULL
                        OR `end_month` IS NULL
                        OR `end_month` > `start_month`
                        OR `start_day` IS NULL
                        OR `end_day` IS NULL
                        OR `end_day` >= `start_day`
                    ),

                CONSTRAINT `chk_personnel_instructional_material_materials_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`materials`)) > 0
                    ),

                CONSTRAINT `chk_personnel_instructional_material_granted_by_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`granted_by`)) > 0
                    ),

                CONSTRAINT `chk_personnel_instructional_material_type_candidate`
                    CHECK (
                        `material_type_candidate` IN (
                            'AUDIO_VISUAL_AIDS',
                            'MODULES',
                            'TEACHING_MANUAL_BOUND',
                            'OTHERS_BOUND_WORKBOOKS_EXERCISE_BOOKS'
                        )
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );

        /*
         * Personnel B.6 — Creative Work
         *
         * One record represents one distinct real-world creative work
         * produced/created by and attributable to the faculty/personnel
         * portfolio owner.
         *
         * Multiple evidence files, photographs, recordings, formats,
         * performances, exhibitions, OCR runs, reviewer actions, or
         * ranking uses do not by themselves create additional B.6
         * accomplishments.
         *
         * Date(s) preserve only evidence-supported precision. Missing
         * day/month components are never fabricated. A documented
         * creative process may be represented as a supported period.
         *
         * Creative Work stores the official/evidence-supported title or
         * conservative identifying description of the underlying work.
         *
         * Granted by preserves the authoritative source label without
         * inventing a universal commissioner/publisher/producer/
         * institution/grantor interpretation.
         *
         * Supporting Evidence is stored in the shared evidence layer.
         * Name/Signature remains a controlled digital attestation concept
         * handled by verification/audit workflow, not a faculty-entered
         * detail-table field.
         *
         * The official B.6 criterion maximum is 20 points, but no
         * authoritative lower-level scoring formula is supplied.
         * Automatic per-work scoring therefore remains disabled and no
         * score/type/scope/quality fields are stored here.
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `personnel_creative_work_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `start_date_precision` VARCHAR(16)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `start_year` SMALLINT UNSIGNED NOT NULL,

                `start_month` TINYINT UNSIGNED NULL,

                `start_day` TINYINT UNSIGNED NULL,

                `end_date_precision` VARCHAR(16)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `end_year` SMALLINT UNSIGNED NULL,

                `end_month` TINYINT UNSIGNED NULL,

                `end_day` TINYINT UNSIGNED NULL,

                `creative_work` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `granted_by` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_personnel_creative_work_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION,

                CONSTRAINT `chk_personnel_creative_work_start_precision`
                    CHECK (
                        `start_date_precision` IN (
                            'YEAR',
                            'MONTH',
                            'DATE'
                        )
                    ),

                CONSTRAINT `chk_personnel_creative_work_start_year`
                    CHECK (
                        `start_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_creative_work_start_month`
                    CHECK (
                        `start_month` IS NULL
                        OR `start_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_personnel_creative_work_start_day`
                    CHECK (
                        `start_day` IS NULL
                        OR `start_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_personnel_creative_work_start_bundle`
                    CHECK (
                        (
                            `start_date_precision` = 'YEAR'
                            AND `start_month` IS NULL
                            AND `start_day` IS NULL
                        )
                        OR
                        (
                            `start_date_precision` = 'MONTH'
                            AND `start_month` IS NOT NULL
                            AND `start_day` IS NULL
                        )
                        OR
                        (
                            `start_date_precision` = 'DATE'
                            AND `start_month` IS NOT NULL
                            AND `start_day` IS NOT NULL
                        )
                    ),

                CONSTRAINT `chk_personnel_creative_work_start_calendar_day`
                    CHECK (
                        `start_day` IS NULL
                        OR (
                            `start_month` IN (1, 3, 5, 7, 8, 10, 12)
                            AND `start_day` BETWEEN 1 AND 31
                        )
                        OR (
                            `start_month` IN (4, 6, 9, 11)
                            AND `start_day` BETWEEN 1 AND 30
                        )
                        OR (
                            `start_month` = 2
                            AND (
                                `start_day` BETWEEN 1 AND 28
                                OR (
                                    `start_day` = 29
                                    AND (
                                        MOD(`start_year`, 400) = 0
                                        OR (
                                            MOD(`start_year`, 4) = 0
                                            AND MOD(`start_year`, 100) <> 0
                                        )
                                    )
                                )
                            )
                        )
                    ),

                CONSTRAINT `chk_personnel_creative_work_end_precision`
                    CHECK (
                        `end_date_precision` IS NULL
                        OR `end_date_precision` IN (
                            'YEAR',
                            'MONTH',
                            'DATE'
                        )
                    ),

                CONSTRAINT `chk_personnel_creative_work_end_year`
                    CHECK (
                        `end_year` IS NULL
                        OR `end_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_creative_work_end_month`
                    CHECK (
                        `end_month` IS NULL
                        OR `end_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_personnel_creative_work_end_day`
                    CHECK (
                        `end_day` IS NULL
                        OR `end_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_personnel_creative_work_end_bundle`
                    CHECK (
                        (
                            `end_date_precision` IS NULL
                            AND `end_year` IS NULL
                            AND `end_month` IS NULL
                            AND `end_day` IS NULL
                        )
                        OR
                        (
                            `end_date_precision` = 'YEAR'
                            AND `end_year` IS NOT NULL
                            AND `end_month` IS NULL
                            AND `end_day` IS NULL
                        )
                        OR
                        (
                            `end_date_precision` = 'MONTH'
                            AND `end_year` IS NOT NULL
                            AND `end_month` IS NOT NULL
                            AND `end_day` IS NULL
                        )
                        OR
                        (
                            `end_date_precision` = 'DATE'
                            AND `end_year` IS NOT NULL
                            AND `end_month` IS NOT NULL
                            AND `end_day` IS NOT NULL
                        )
                    ),

                CONSTRAINT `chk_personnel_creative_work_end_calendar_day`
                    CHECK (
                        `end_day` IS NULL
                        OR (
                            `end_month` IN (1, 3, 5, 7, 8, 10, 12)
                            AND `end_day` BETWEEN 1 AND 31
                        )
                        OR (
                            `end_month` IN (4, 6, 9, 11)
                            AND `end_day` BETWEEN 1 AND 30
                        )
                        OR (
                            `end_month` = 2
                            AND (
                                `end_day` BETWEEN 1 AND 28
                                OR (
                                    `end_day` = 29
                                    AND (
                                        MOD(`end_year`, 400) = 0
                                        OR (
                                            MOD(`end_year`, 4) = 0
                                            AND MOD(`end_year`, 100) <> 0
                                        )
                                    )
                                )
                            )
                        )
                    ),

                CONSTRAINT `chk_personnel_creative_work_period_year_order`
                    CHECK (
                        `end_year` IS NULL
                        OR `end_year` >= `start_year`
                    ),

                CONSTRAINT `chk_personnel_creative_work_period_month_order`
                    CHECK (
                        `end_year` IS NULL
                        OR `end_year` > `start_year`
                        OR `start_month` IS NULL
                        OR `end_month` IS NULL
                        OR `end_month` >= `start_month`
                    ),

                CONSTRAINT `chk_personnel_creative_work_period_day_order`
                    CHECK (
                        `end_year` IS NULL
                        OR `end_year` > `start_year`
                        OR `start_month` IS NULL
                        OR `end_month` IS NULL
                        OR `end_month` > `start_month`
                        OR `start_day` IS NULL
                        OR `end_day` IS NULL
                        OR `end_day` >= `start_day`
                    ),

                CONSTRAINT `chk_personnel_creative_work_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`creative_work`)) > 0
                    ),

                CONSTRAINT `chk_personnel_creative_work_granted_by_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`granted_by`)) > 0
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );

        /*
         * Personnel C.1.a — Moderator of Clubs/Organizations
         *
         * One record represents one distinct moderator appointment/term
         * for one faculty/personnel owner and one club/organization.
         *
         * Date(s) may be expressed as exact/partial dates, academic-year,
         * school-year, semester, or another legitimate evidence-supported
         * period expression.
         *
         * Exact dates must never be fabricated from AY/SY/semester labels.
         *
         * Supporting Evidence remains in the shared evidence layer.
         * Verification metadata, organization master-data linkage,
         * duplicate resolution, and manual HR scoring remain outside this
         * detail table.
         *
         * C1-1 maximum = 20 points, but no lower-level automatic scoring
         * formula is currently authoritative.
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `personnel_moderator_assignment_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `period_precision` VARCHAR(24)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `period_start_year` SMALLINT UNSIGNED NULL,

                `period_start_month` TINYINT UNSIGNED NULL,

                `period_start_day` TINYINT UNSIGNED NULL,

                `period_end_year` SMALLINT UNSIGNED NULL,

                `period_end_month` TINYINT UNSIGNED NULL,

                `period_end_day` TINYINT UNSIGNED NULL,

                `is_ongoing` TINYINT(1) NOT NULL DEFAULT 0,

                `source_period_text` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `clubs_organizations` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `conducted_or_organized_by` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `remarks` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_personnel_moderator_assignment_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION,

                CONSTRAINT `chk_personnel_moderator_period_precision`
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

                CONSTRAINT `chk_personnel_moderator_start_year`
                    CHECK (
                        `period_start_year` IS NULL
                        OR `period_start_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_moderator_start_month`
                    CHECK (
                        `period_start_month` IS NULL
                        OR `period_start_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_personnel_moderator_start_day`
                    CHECK (
                        `period_start_day` IS NULL
                        OR `period_start_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_personnel_moderator_end_year`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_end_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_moderator_end_month`
                    CHECK (
                        `period_end_month` IS NULL
                        OR `period_end_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_personnel_moderator_end_day`
                    CHECK (
                        `period_end_day` IS NULL
                        OR `period_end_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_personnel_moderator_ongoing`
                    CHECK (
                        `is_ongoing` IN (0, 1)
                    ),

                /*
                 * A day component is meaningful only when its corresponding
                 * month is also known. This is especially important for
                 * RANGE periods, whose endpoints may use partial precision.
                 */
                CONSTRAINT `chk_personnel_moderator_start_component_hierarchy`
                    CHECK (
                        `period_start_day` IS NULL
                        OR `period_start_month` IS NOT NULL
                    ),

                CONSTRAINT `chk_personnel_moderator_end_component_hierarchy`
                    CHECK (
                        `period_end_day` IS NULL
                        OR `period_end_month` IS NOT NULL
                    ),

                /*
                 * AY/SY/semester/other named expressions are preserved as
                 * source text. Do not silently mix fabricated numeric date
                 * components into the same representation.
                 */
                CONSTRAINT `chk_personnel_moderator_text_period_numeric_exclusive`
                    CHECK (
                        `period_precision` NOT IN (
                            'ACADEMIC_YEAR',
                            'NAMED_PERIOD'
                        )
                        OR (
                            `period_start_year` IS NULL
                            AND `period_start_month` IS NULL
                            AND `period_start_day` IS NULL
                            AND `period_end_year` IS NULL
                            AND `period_end_month` IS NULL
                            AND `period_end_day` IS NULL
                        )
                    ),

                CONSTRAINT `chk_personnel_moderator_period_bundle`
                    CHECK (
                        (
                            `period_precision` = 'YEAR'
                            AND `period_start_year` IS NOT NULL
                            AND `period_start_month` IS NULL
                            AND `period_start_day` IS NULL
                            AND `period_end_year` IS NULL
                            AND `period_end_month` IS NULL
                            AND `period_end_day` IS NULL
                            AND `source_period_text` IS NULL
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
                            AND `source_period_text` IS NULL
                        )
                        OR
                        (
                            `period_precision` = 'RANGE'
                            AND `period_start_year` IS NOT NULL
                            AND `period_end_year` IS NOT NULL
                            AND `source_period_text` IS NULL
                        )
                        OR
                        (
                            `period_precision` IN (
                                'ACADEMIC_YEAR',
                                'NAMED_PERIOD'
                            )
                            AND `source_period_text` IS NOT NULL
                            AND CHAR_LENGTH(TRIM(`source_period_text`)) > 0
                        )
                    ),

                CONSTRAINT `chk_personnel_moderator_start_calendar_day`
                    CHECK (
                        `period_start_day` IS NULL
                        OR (
                            `period_start_month` IN (1, 3, 5, 7, 8, 10, 12)
                            AND `period_start_day` BETWEEN 1 AND 31
                        )
                        OR (
                            `period_start_month` IN (4, 6, 9, 11)
                            AND `period_start_day` BETWEEN 1 AND 30
                        )
                        OR (
                            `period_start_month` = 2
                            AND (
                                `period_start_day` BETWEEN 1 AND 28
                                OR (
                                    `period_start_day` = 29
                                    AND (
                                        MOD(`period_start_year`, 400) = 0
                                        OR (
                                            MOD(`period_start_year`, 4) = 0
                                            AND MOD(`period_start_year`, 100) <> 0
                                        )
                                    )
                                )
                            )
                        )
                    ),

                CONSTRAINT `chk_personnel_moderator_end_calendar_day`
                    CHECK (
                        `period_end_day` IS NULL
                        OR (
                            `period_end_month` IN (1, 3, 5, 7, 8, 10, 12)
                            AND `period_end_day` BETWEEN 1 AND 31
                        )
                        OR (
                            `period_end_month` IN (4, 6, 9, 11)
                            AND `period_end_day` BETWEEN 1 AND 30
                        )
                        OR (
                            `period_end_month` = 2
                            AND (
                                `period_end_day` BETWEEN 1 AND 28
                                OR (
                                    `period_end_day` = 29
                                    AND (
                                        MOD(`period_end_year`, 400) = 0
                                        OR (
                                            MOD(`period_end_year`, 4) = 0
                                            AND MOD(`period_end_year`, 100) <> 0
                                        )
                                    )
                                )
                            )
                        )
                    ),

                CONSTRAINT `chk_personnel_moderator_period_year_order`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_start_year` IS NULL
                        OR `period_end_year` >= `period_start_year`
                    ),

                CONSTRAINT `chk_personnel_moderator_period_month_order`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_start_year` IS NULL
                        OR `period_end_year` > `period_start_year`
                        OR `period_start_month` IS NULL
                        OR `period_end_month` IS NULL
                        OR `period_end_month` >= `period_start_month`
                    ),

                CONSTRAINT `chk_personnel_moderator_period_day_order`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_start_year` IS NULL
                        OR `period_end_year` > `period_start_year`
                        OR `period_start_month` IS NULL
                        OR `period_end_month` IS NULL
                        OR `period_end_month` > `period_start_month`
                        OR `period_start_day` IS NULL
                        OR `period_end_day` IS NULL
                        OR `period_end_day` >= `period_start_day`
                    ),

                CONSTRAINT `chk_personnel_moderator_ongoing_end_exclusive`
                    CHECK (
                        `is_ongoing` = 0
                        OR (
                            `period_end_year` IS NULL
                            AND `period_end_month` IS NULL
                            AND `period_end_day` IS NULL
                        )
                    ),

                CONSTRAINT `chk_personnel_moderator_clubs_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`clubs_organizations`)) > 0
                    ),

                CONSTRAINT `chk_personnel_moderator_conducted_by_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`conducted_or_organized_by`)) > 0
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );

        /*
         * Personnel C.1.b — Coach/Trainer
         *
         * One record represents one distinct evidence-supported Coach/Trainer
         * service engagement for one faculty/personnel portfolio owner.
         *
         * Repeated sessions, practices, rehearsals, games, workshops,
         * meetings, reports, certificates, evidence files, OCR runs,
         * reviewer actions, or ranking uses belonging to the same underlying
         * engagement do not create additional accomplishments.
         *
         * Date(s) may preserve an exact or partial date, supported range,
         * academic/school year, semester, season, training-program period,
         * or another legitimate evidence-supported named period.
         *
         * Exact dates must never be fabricated from AY/SY/semester/season
         * or other broad period expressions.
         *
         * Coach/Trainer is the C.1.b category identity. A separate
         * unrestricted faculty-facing role field is not stored here.
         * Verified Coach, Trainer, or both remains reviewer/system metadata.
         *
         * Supporting Evidence remains in the shared evidence layer.
         * Verification, duplicate resolution, engagement identity,
         * verified-role metadata, and HR/manual scoring remain outside this
         * detail table.
         *
         * C1-2 maximum = 20 points, C.1 maximum = 30, Area C maximum = 40.
         * No authoritative lower-level automatic scoring formula is supplied.
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `personnel_coach_trainer_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `period_precision` VARCHAR(24)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `period_start_year` SMALLINT UNSIGNED NULL,

                `period_start_month` TINYINT UNSIGNED NULL,

                `period_start_day` TINYINT UNSIGNED NULL,

                `period_end_year` SMALLINT UNSIGNED NULL,

                `period_end_month` TINYINT UNSIGNED NULL,

                `period_end_day` TINYINT UNSIGNED NULL,

                `is_ongoing` TINYINT(1) NOT NULL DEFAULT 0,

                `source_period_text` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `activity` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `conducted_or_organized_by` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `remarks` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_personnel_coach_trainer_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION,

                CONSTRAINT `chk_personnel_coach_trainer_period_precision`
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

                CONSTRAINT `chk_personnel_coach_trainer_start_year`
                    CHECK (
                        `period_start_year` IS NULL
                        OR `period_start_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_coach_trainer_start_month`
                    CHECK (
                        `period_start_month` IS NULL
                        OR `period_start_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_personnel_coach_trainer_start_day`
                    CHECK (
                        `period_start_day` IS NULL
                        OR `period_start_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_personnel_coach_trainer_end_year`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_end_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_coach_trainer_end_month`
                    CHECK (
                        `period_end_month` IS NULL
                        OR `period_end_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_personnel_coach_trainer_end_day`
                    CHECK (
                        `period_end_day` IS NULL
                        OR `period_end_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_personnel_coach_trainer_ongoing`
                    CHECK (
                        `is_ongoing` IN (0, 1)
                    ),

                CONSTRAINT `chk_personnel_coach_trainer_start_component_hierarchy`
                    CHECK (
                        `period_start_day` IS NULL
                        OR `period_start_month` IS NOT NULL
                    ),

                CONSTRAINT `chk_personnel_coach_trainer_end_component_hierarchy`
                    CHECK (
                        `period_end_day` IS NULL
                        OR `period_end_month` IS NOT NULL
                    ),

                CONSTRAINT `chk_personnel_coach_trainer_text_period_numeric_exclusive`
                    CHECK (
                        `period_precision` NOT IN (
                            'ACADEMIC_YEAR',
                            'NAMED_PERIOD'
                        )
                        OR (
                            `period_start_year` IS NULL
                            AND `period_start_month` IS NULL
                            AND `period_start_day` IS NULL
                            AND `period_end_year` IS NULL
                            AND `period_end_month` IS NULL
                            AND `period_end_day` IS NULL
                        )
                    ),

                CONSTRAINT `chk_personnel_coach_trainer_period_bundle`
                    CHECK (
                        (
                            `period_precision` = 'YEAR'
                            AND `period_start_year` IS NOT NULL
                            AND `period_start_month` IS NULL
                            AND `period_start_day` IS NULL
                            AND `period_end_year` IS NULL
                            AND `period_end_month` IS NULL
                            AND `period_end_day` IS NULL
                            AND `source_period_text` IS NULL
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
                            AND `source_period_text` IS NULL
                        )
                        OR
                        (
                            `period_precision` = 'RANGE'
                            AND `period_start_year` IS NOT NULL
                            AND `period_end_year` IS NOT NULL
                            AND `source_period_text` IS NULL
                        )
                        OR
                        (
                            `period_precision` IN (
                                'ACADEMIC_YEAR',
                                'NAMED_PERIOD'
                            )
                            AND `source_period_text` IS NOT NULL
                            AND CHAR_LENGTH(TRIM(`source_period_text`)) > 0
                        )
                    ),

                CONSTRAINT `chk_personnel_coach_trainer_start_calendar_day`
                    CHECK (
                        `period_start_day` IS NULL
                        OR (
                            `period_start_month` IN (1, 3, 5, 7, 8, 10, 12)
                            AND `period_start_day` BETWEEN 1 AND 31
                        )
                        OR (
                            `period_start_month` IN (4, 6, 9, 11)
                            AND `period_start_day` BETWEEN 1 AND 30
                        )
                        OR (
                            `period_start_month` = 2
                            AND (
                                `period_start_day` BETWEEN 1 AND 28
                                OR (
                                    `period_start_day` = 29
                                    AND (
                                        MOD(`period_start_year`, 400) = 0
                                        OR (
                                            MOD(`period_start_year`, 4) = 0
                                            AND MOD(`period_start_year`, 100) <> 0
                                        )
                                    )
                                )
                            )
                        )
                    ),

                CONSTRAINT `chk_personnel_coach_trainer_end_calendar_day`
                    CHECK (
                        `period_end_day` IS NULL
                        OR (
                            `period_end_month` IN (1, 3, 5, 7, 8, 10, 12)
                            AND `period_end_day` BETWEEN 1 AND 31
                        )
                        OR (
                            `period_end_month` IN (4, 6, 9, 11)
                            AND `period_end_day` BETWEEN 1 AND 30
                        )
                        OR (
                            `period_end_month` = 2
                            AND (
                                `period_end_day` BETWEEN 1 AND 28
                                OR (
                                    `period_end_day` = 29
                                    AND (
                                        MOD(`period_end_year`, 400) = 0
                                        OR (
                                            MOD(`period_end_year`, 4) = 0
                                            AND MOD(`period_end_year`, 100) <> 0
                                        )
                                    )
                                )
                            )
                        )
                    ),

                CONSTRAINT `chk_personnel_coach_trainer_period_year_order`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_start_year` IS NULL
                        OR `period_end_year` >= `period_start_year`
                    ),

                CONSTRAINT `chk_personnel_coach_trainer_period_month_order`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_start_year` IS NULL
                        OR `period_end_year` > `period_start_year`
                        OR `period_start_month` IS NULL
                        OR `period_end_month` IS NULL
                        OR `period_end_month` >= `period_start_month`
                    ),

                CONSTRAINT `chk_personnel_coach_trainer_period_day_order`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_start_year` IS NULL
                        OR `period_end_year` > `period_start_year`
                        OR `period_start_month` IS NULL
                        OR `period_end_month` IS NULL
                        OR `period_end_month` > `period_start_month`
                        OR `period_start_day` IS NULL
                        OR `period_end_day` IS NULL
                        OR `period_end_day` >= `period_start_day`
                    ),

                CONSTRAINT `chk_personnel_coach_trainer_ongoing_end_exclusive`
                    CHECK (
                        `is_ongoing` = 0
                        OR (
                            `period_end_year` IS NULL
                            AND `period_end_month` IS NULL
                            AND `period_end_day` IS NULL
                        )
                    ),

                CONSTRAINT `chk_personnel_coach_trainer_activity_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`activity`)) > 0
                    ),

                CONSTRAINT `chk_personnel_coach_trainer_conducted_by_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`conducted_or_organized_by`)) > 0
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );

        /*
         * Personnel C.1.c — Membership in Working Committees
         *
         * One record represents one distinct evidence-supported faculty/
         * personnel working-committee membership/service assignment.
         *
         * Multiple meetings, agenda items, tasks, deliverables, outputs,
         * event days, minutes, reports, certificates, evidence files,
         * OCR runs, reviewer actions, or ranking uses belonging to the
         * same underlying committee appointment do not create additional
         * accomplishments.
         *
         * Date(s) preserves the actual evidence-supported service period.
         * Supported representations may include exact/partial dates,
         * ranges, AY/SY, semester, project/event period, or another
         * legitimate evidence-supported named period.
         *
         * Exact dates must never be fabricated from broad period labels.
         *
         * Activity preserves the source-defined committee work/assignment
         * context. A separate faculty-facing Committee field is not added.
         *
         * Committee identity and Role such as Chair, Co-Chair, Member,
         * Secretariat, or another supported role remain reviewer/system
         * metadata when required for ranking/display/audit.
         *
         * Supporting Evidence remains in the shared evidence layer.
         * Verification, committee qualification, role resolution,
         * assignment/term identity, duplicate resolution, and HR/manual
         * scoring remain outside this detail table.
         *
         * C1-3 maximum = 20 points, C.1 maximum = 30, Area C maximum = 40.
         * No authoritative lower-level automatic scoring formula exists.
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `personnel_working_committee_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `period_precision` VARCHAR(24)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `period_start_year` SMALLINT UNSIGNED NULL,

                `period_start_month` TINYINT UNSIGNED NULL,

                `period_start_day` TINYINT UNSIGNED NULL,

                `period_end_year` SMALLINT UNSIGNED NULL,

                `period_end_month` TINYINT UNSIGNED NULL,

                `period_end_day` TINYINT UNSIGNED NULL,

                `is_ongoing` TINYINT(1) NOT NULL DEFAULT 0,

                `source_period_text` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `activity` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `conducted_or_organized_by` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `remarks` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_personnel_working_committee_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION,

                CONSTRAINT `chk_personnel_working_committee_period_precision`
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

                CONSTRAINT `chk_personnel_working_committee_start_year`
                    CHECK (
                        `period_start_year` IS NULL
                        OR `period_start_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_working_committee_start_month`
                    CHECK (
                        `period_start_month` IS NULL
                        OR `period_start_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_personnel_working_committee_start_day`
                    CHECK (
                        `period_start_day` IS NULL
                        OR `period_start_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_personnel_working_committee_end_year`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_end_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_working_committee_end_month`
                    CHECK (
                        `period_end_month` IS NULL
                        OR `period_end_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_personnel_working_committee_end_day`
                    CHECK (
                        `period_end_day` IS NULL
                        OR `period_end_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_personnel_working_committee_ongoing`
                    CHECK (
                        `is_ongoing` IN (0, 1)
                    ),

                CONSTRAINT `chk_personnel_working_committee_start_component_hierarchy`
                    CHECK (
                        `period_start_day` IS NULL
                        OR `period_start_month` IS NOT NULL
                    ),

                CONSTRAINT `chk_personnel_working_committee_end_component_hierarchy`
                    CHECK (
                        `period_end_day` IS NULL
                        OR `period_end_month` IS NOT NULL
                    ),

                CONSTRAINT `chk_personnel_working_committee_text_period_numeric_exclusive`
                    CHECK (
                        `period_precision` NOT IN (
                            'ACADEMIC_YEAR',
                            'NAMED_PERIOD'
                        )
                        OR (
                            `period_start_year` IS NULL
                            AND `period_start_month` IS NULL
                            AND `period_start_day` IS NULL
                            AND `period_end_year` IS NULL
                            AND `period_end_month` IS NULL
                            AND `period_end_day` IS NULL
                        )
                    ),

                CONSTRAINT `chk_personnel_working_committee_period_bundle`
                    CHECK (
                        (
                            `period_precision` = 'YEAR'
                            AND `period_start_year` IS NOT NULL
                            AND `period_start_month` IS NULL
                            AND `period_start_day` IS NULL
                            AND `period_end_year` IS NULL
                            AND `period_end_month` IS NULL
                            AND `period_end_day` IS NULL
                            AND `source_period_text` IS NULL
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
                            AND `source_period_text` IS NULL
                        )
                        OR
                        (
                            `period_precision` = 'RANGE'
                            AND `period_start_year` IS NOT NULL
                            AND `period_end_year` IS NOT NULL
                            AND `source_period_text` IS NULL
                        )
                        OR
                        (
                            `period_precision` IN (
                                'ACADEMIC_YEAR',
                                'NAMED_PERIOD'
                            )
                            AND `source_period_text` IS NOT NULL
                            AND CHAR_LENGTH(TRIM(`source_period_text`)) > 0
                        )
                    ),

                CONSTRAINT `chk_personnel_working_committee_start_calendar_day`
                    CHECK (
                        `period_start_day` IS NULL
                        OR (
                            `period_start_month` IN (1, 3, 5, 7, 8, 10, 12)
                            AND `period_start_day` BETWEEN 1 AND 31
                        )
                        OR (
                            `period_start_month` IN (4, 6, 9, 11)
                            AND `period_start_day` BETWEEN 1 AND 30
                        )
                        OR (
                            `period_start_month` = 2
                            AND (
                                `period_start_day` BETWEEN 1 AND 28
                                OR (
                                    `period_start_day` = 29
                                    AND (
                                        MOD(`period_start_year`, 400) = 0
                                        OR (
                                            MOD(`period_start_year`, 4) = 0
                                            AND MOD(`period_start_year`, 100) <> 0
                                        )
                                    )
                                )
                            )
                        )
                    ),

                CONSTRAINT `chk_personnel_working_committee_end_calendar_day`
                    CHECK (
                        `period_end_day` IS NULL
                        OR (
                            `period_end_month` IN (1, 3, 5, 7, 8, 10, 12)
                            AND `period_end_day` BETWEEN 1 AND 31
                        )
                        OR (
                            `period_end_month` IN (4, 6, 9, 11)
                            AND `period_end_day` BETWEEN 1 AND 30
                        )
                        OR (
                            `period_end_month` = 2
                            AND (
                                `period_end_day` BETWEEN 1 AND 28
                                OR (
                                    `period_end_day` = 29
                                    AND (
                                        MOD(`period_end_year`, 400) = 0
                                        OR (
                                            MOD(`period_end_year`, 4) = 0
                                            AND MOD(`period_end_year`, 100) <> 0
                                        )
                                    )
                                )
                            )
                        )
                    ),

                CONSTRAINT `chk_personnel_working_committee_period_year_order`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_start_year` IS NULL
                        OR `period_end_year` >= `period_start_year`
                    ),

                CONSTRAINT `chk_personnel_working_committee_period_month_order`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_start_year` IS NULL
                        OR `period_end_year` > `period_start_year`
                        OR `period_start_month` IS NULL
                        OR `period_end_month` IS NULL
                        OR `period_end_month` >= `period_start_month`
                    ),

                CONSTRAINT `chk_personnel_working_committee_period_day_order`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_start_year` IS NULL
                        OR `period_end_year` > `period_start_year`
                        OR `period_start_month` IS NULL
                        OR `period_end_month` IS NULL
                        OR `period_end_month` > `period_start_month`
                        OR `period_start_day` IS NULL
                        OR `period_end_day` IS NULL
                        OR `period_end_day` >= `period_start_day`
                    ),

                CONSTRAINT `chk_personnel_working_committee_ongoing_end_exclusive`
                    CHECK (
                        `is_ongoing` = 0
                        OR (
                            `period_end_year` IS NULL
                            AND `period_end_month` IS NULL
                            AND `period_end_day` IS NULL
                        )
                    ),

                CONSTRAINT `chk_personnel_working_committee_activity_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`activity`)) > 0
                    ),

                CONSTRAINT `chk_personnel_working_committee_conducted_by_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`conducted_or_organized_by`)) > 0
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );

        /*
         * Personnel C.1.d — Rendered Service in School Activities
         *
         * One record represents one distinct evidence-supported instance
         * or bounded engagement in which the faculty/personnel member
         * actually rendered service for an identifiable school activity.
         *
         * Attendance, participation, ordinary employment duties,
         * moderator service, Coach/Trainer service, working-committee
         * service, invited professional roles, or recognition do not by
         * themselves establish a C.1.d record.
         *
         * Multiple tasks, shifts, preparation sessions, meetings,
         * event days, outputs, reports, certificates, or evidence files
         * belonging to the same underlying service engagement do not
         * automatically create additional accomplishments.
         *
         * Date(s) preserves only the precision supported by evidence.
         * Exact dates must not be fabricated from AY/SY, semester,
         * event calendars, schedules, recurring patterns, or broad
         * named periods.
         *
         * Activity identifies the school activity/program/event/project
         * for which service was rendered.
         *
         * Conducted/Organized by preserves the source-defined associated
         * entity without assigning an invented universal meaning.
         *
         * A separate mandatory faculty-facing Service Rendered field is
         * intentionally not stored here. Evidence-supported verified
         * Service Rendered description/role/task belongs to controlled
         * reviewer/system metadata where needed.
         *
         * Supporting Evidence remains in the shared evidence layer.
         * Verification, lifecycle/completion state, duplicate resolution,
         * category qualification, normalized activity identity,
         * Service Rendered metadata, and scoring remain outside this table.
         *
         * C1-4 maximum = 10 points, C.1 maximum = 30, Area C maximum = 40.
         * No authoritative lower-level automatic scoring formula exists.
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `personnel_school_activity_service_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `period_precision` VARCHAR(24)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `period_start_year` SMALLINT UNSIGNED NULL,

                `period_start_month` TINYINT UNSIGNED NULL,

                `period_start_day` TINYINT UNSIGNED NULL,

                `period_end_year` SMALLINT UNSIGNED NULL,

                `period_end_month` TINYINT UNSIGNED NULL,

                `period_end_day` TINYINT UNSIGNED NULL,

                `is_ongoing` TINYINT(1) NOT NULL DEFAULT 0,

                `source_period_text` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `activity` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `conducted_or_organized_by` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `remarks` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_personnel_school_activity_service_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION,

                CONSTRAINT `chk_personnel_school_service_period_precision`
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

                CONSTRAINT `chk_personnel_school_service_start_year`
                    CHECK (
                        `period_start_year` IS NULL
                        OR `period_start_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_school_service_start_month`
                    CHECK (
                        `period_start_month` IS NULL
                        OR `period_start_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_personnel_school_service_start_day`
                    CHECK (
                        `period_start_day` IS NULL
                        OR `period_start_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_personnel_school_service_end_year`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_end_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_school_service_end_month`
                    CHECK (
                        `period_end_month` IS NULL
                        OR `period_end_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_personnel_school_service_end_day`
                    CHECK (
                        `period_end_day` IS NULL
                        OR `period_end_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_personnel_school_service_ongoing`
                    CHECK (
                        `is_ongoing` IN (0, 1)
                    ),

                CONSTRAINT `chk_personnel_school_service_start_component_hierarchy`
                    CHECK (
                        `period_start_day` IS NULL
                        OR `period_start_month` IS NOT NULL
                    ),

                CONSTRAINT `chk_personnel_school_service_end_component_hierarchy`
                    CHECK (
                        `period_end_day` IS NULL
                        OR `period_end_month` IS NOT NULL
                    ),

                CONSTRAINT `chk_personnel_school_service_text_period_numeric_exclusive`
                    CHECK (
                        `period_precision` NOT IN (
                            'ACADEMIC_YEAR',
                            'NAMED_PERIOD'
                        )
                        OR (
                            `period_start_year` IS NULL
                            AND `period_start_month` IS NULL
                            AND `period_start_day` IS NULL
                            AND `period_end_year` IS NULL
                            AND `period_end_month` IS NULL
                            AND `period_end_day` IS NULL
                        )
                    ),

                CONSTRAINT `chk_personnel_school_service_period_bundle`
                    CHECK (
                        (
                            `period_precision` = 'YEAR'
                            AND `period_start_year` IS NOT NULL
                            AND `period_start_month` IS NULL
                            AND `period_start_day` IS NULL
                            AND `period_end_year` IS NULL
                            AND `period_end_month` IS NULL
                            AND `period_end_day` IS NULL
                            AND `source_period_text` IS NULL
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
                            AND `source_period_text` IS NULL
                        )
                        OR
                        (
                            `period_precision` = 'RANGE'
                            AND `period_start_year` IS NOT NULL
                            AND `period_end_year` IS NOT NULL
                            AND `source_period_text` IS NULL
                        )
                        OR
                        (
                            `period_precision` IN (
                                'ACADEMIC_YEAR',
                                'NAMED_PERIOD'
                            )
                            AND `source_period_text` IS NOT NULL
                            AND CHAR_LENGTH(TRIM(`source_period_text`)) > 0
                        )
                    ),

                CONSTRAINT `chk_personnel_school_service_start_calendar_day`
                    CHECK (
                        `period_start_day` IS NULL
                        OR (
                            `period_start_month` IN (1, 3, 5, 7, 8, 10, 12)
                            AND `period_start_day` BETWEEN 1 AND 31
                        )
                        OR (
                            `period_start_month` IN (4, 6, 9, 11)
                            AND `period_start_day` BETWEEN 1 AND 30
                        )
                        OR (
                            `period_start_month` = 2
                            AND (
                                `period_start_day` BETWEEN 1 AND 28
                                OR (
                                    `period_start_day` = 29
                                    AND (
                                        MOD(`period_start_year`, 400) = 0
                                        OR (
                                            MOD(`period_start_year`, 4) = 0
                                            AND MOD(`period_start_year`, 100) <> 0
                                        )
                                    )
                                )
                            )
                        )
                    ),

                CONSTRAINT `chk_personnel_school_service_end_calendar_day`
                    CHECK (
                        `period_end_day` IS NULL
                        OR (
                            `period_end_month` IN (1, 3, 5, 7, 8, 10, 12)
                            AND `period_end_day` BETWEEN 1 AND 31
                        )
                        OR (
                            `period_end_month` IN (4, 6, 9, 11)
                            AND `period_end_day` BETWEEN 1 AND 30
                        )
                        OR (
                            `period_end_month` = 2
                            AND (
                                `period_end_day` BETWEEN 1 AND 28
                                OR (
                                    `period_end_day` = 29
                                    AND (
                                        MOD(`period_end_year`, 400) = 0
                                        OR (
                                            MOD(`period_end_year`, 4) = 0
                                            AND MOD(`period_end_year`, 100) <> 0
                                        )
                                    )
                                )
                            )
                        )
                    ),

                CONSTRAINT `chk_personnel_school_service_period_year_order`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_start_year` IS NULL
                        OR `period_end_year` >= `period_start_year`
                    ),

                CONSTRAINT `chk_personnel_school_service_period_month_order`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_start_year` IS NULL
                        OR `period_end_year` > `period_start_year`
                        OR `period_start_month` IS NULL
                        OR `period_end_month` IS NULL
                        OR `period_end_month` >= `period_start_month`
                    ),

                CONSTRAINT `chk_personnel_school_service_period_day_order`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_start_year` IS NULL
                        OR `period_end_year` > `period_start_year`
                        OR `period_start_month` IS NULL
                        OR `period_end_month` IS NULL
                        OR `period_end_month` > `period_start_month`
                        OR `period_start_day` IS NULL
                        OR `period_end_day` IS NULL
                        OR `period_end_day` >= `period_start_day`
                    ),

                CONSTRAINT `chk_personnel_school_service_ongoing_end_exclusive`
                    CHECK (
                        `is_ongoing` = 0
                        OR (
                            `period_end_year` IS NULL
                            AND `period_end_month` IS NULL
                            AND `period_end_day` IS NULL
                        )
                    ),

                CONSTRAINT `chk_personnel_school_service_activity_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`activity`)) > 0
                    ),

                CONSTRAINT `chk_personnel_school_service_conducted_by_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`conducted_or_organized_by`)) > 0
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );

        /*
         * Personnel C.2.e — Active Involvement in Church Activities
         *
         * One record represents one distinct evidence-supported instance
         * or bounded engagement in which the faculty/personnel member was
         * actively involved in a church activity.
         *
         * Active involvement must reflect actual involvement, service, or
         * meaningful participation beyond passive presence or affiliation.
         *
         * Parish/church membership, denomination/religious affiliation,
         * ordinary attendance at Mass/worship/service, personal devotion,
         * sacramental participation, invitation, or religious context alone
         * do not establish a C.2.e accomplishment.
         *
         * Multiple services, sessions, rehearsals, meetings, preparations,
         * tasks, outputs, photos, or evidence files belonging to one
         * underlying involvement engagement do not automatically create
         * additional accomplishments.
         *
         * Date(s) preserves only evidence-supported temporal precision.
         * Supported representations may include an exact or partial date,
         * bounded range, recurring involvement period, AY/SY, semester,
         * liturgical/activity season, church-program period, or another
         * legitimate evidence-supported named period.
         *
         * Exact dates must not be fabricated from church calendars,
         * feast dates, recurring schedules, AY conventions, or assumptions.
         *
         * Activity identifies the evidence-supported church activity,
         * program, service, event, ministry activity, outreach, or other
         * applicable church-context activity.
         *
         * Conducted/Organized by preserves the evidence-supported associated
         * entity without inventing a universal interpretation.
         *
         * The detail table does not store or infer the faculty member's
         * personal religion, denomination, belief, devotion, worship
         * practice, sacramental status, morality, or religious identity.
         *
         * Supporting Evidence remains in the shared evidence layer.
         * Verified involvement/service/role wording, church-context
         * qualification, privacy-sensitive reviewer decisions, lifecycle
         * state, duplicate resolution, and scoring remain outside this table.
         *
         * C.2.e maximum = 25 points, C.2 maximum = 30, Area C maximum = 40.
         * No authoritative lower-level automatic scoring formula exists.
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `personnel_church_activity_involvement_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `period_precision` VARCHAR(24)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `period_start_year` SMALLINT UNSIGNED NULL,

                `period_start_month` TINYINT UNSIGNED NULL,

                `period_start_day` TINYINT UNSIGNED NULL,

                `period_end_year` SMALLINT UNSIGNED NULL,

                `period_end_month` TINYINT UNSIGNED NULL,

                `period_end_day` TINYINT UNSIGNED NULL,

                `is_ongoing` TINYINT(1) NOT NULL DEFAULT 0,

                `source_period_text` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `activity` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `conducted_or_organized_by` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `remarks` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_personnel_church_activity_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION,

                CONSTRAINT `chk_personnel_church_activity_period_precision`
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

                CONSTRAINT `chk_personnel_church_activity_start_year`
                    CHECK (
                        `period_start_year` IS NULL
                        OR `period_start_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_church_activity_start_month`
                    CHECK (
                        `period_start_month` IS NULL
                        OR `period_start_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_personnel_church_activity_start_day`
                    CHECK (
                        `period_start_day` IS NULL
                        OR `period_start_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_personnel_church_activity_end_year`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_end_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_church_activity_end_month`
                    CHECK (
                        `period_end_month` IS NULL
                        OR `period_end_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_personnel_church_activity_end_day`
                    CHECK (
                        `period_end_day` IS NULL
                        OR `period_end_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_personnel_church_activity_ongoing`
                    CHECK (
                        `is_ongoing` IN (0, 1)
                    ),

                CONSTRAINT `chk_personnel_church_activity_start_component_hierarchy`
                    CHECK (
                        `period_start_day` IS NULL
                        OR `period_start_month` IS NOT NULL
                    ),

                CONSTRAINT `chk_personnel_church_activity_end_component_hierarchy`
                    CHECK (
                        `period_end_day` IS NULL
                        OR `period_end_month` IS NOT NULL
                    ),

                CONSTRAINT `chk_personnel_church_activity_text_period_numeric_exclusive`
                    CHECK (
                        `period_precision` NOT IN (
                            'ACADEMIC_YEAR',
                            'NAMED_PERIOD'
                        )
                        OR (
                            `period_start_year` IS NULL
                            AND `period_start_month` IS NULL
                            AND `period_start_day` IS NULL
                            AND `period_end_year` IS NULL
                            AND `period_end_month` IS NULL
                            AND `period_end_day` IS NULL
                        )
                    ),

                CONSTRAINT `chk_personnel_church_activity_period_bundle`
                    CHECK (
                        (
                            `period_precision` = 'YEAR'
                            AND `period_start_year` IS NOT NULL
                            AND `period_start_month` IS NULL
                            AND `period_start_day` IS NULL
                            AND `period_end_year` IS NULL
                            AND `period_end_month` IS NULL
                            AND `period_end_day` IS NULL
                            AND `source_period_text` IS NULL
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
                            AND `source_period_text` IS NULL
                        )
                        OR
                        (
                            `period_precision` = 'RANGE'
                            AND `period_start_year` IS NOT NULL
                            AND `period_end_year` IS NOT NULL
                            AND `source_period_text` IS NULL
                        )
                        OR
                        (
                            `period_precision` IN (
                                'ACADEMIC_YEAR',
                                'NAMED_PERIOD'
                            )
                            AND `source_period_text` IS NOT NULL
                            AND CHAR_LENGTH(TRIM(`source_period_text`)) > 0
                        )
                    ),

                CONSTRAINT `chk_personnel_church_activity_start_calendar_day`
                    CHECK (
                        `period_start_day` IS NULL
                        OR (
                            `period_start_month` IN (1, 3, 5, 7, 8, 10, 12)
                            AND `period_start_day` BETWEEN 1 AND 31
                        )
                        OR (
                            `period_start_month` IN (4, 6, 9, 11)
                            AND `period_start_day` BETWEEN 1 AND 30
                        )
                        OR (
                            `period_start_month` = 2
                            AND (
                                `period_start_day` BETWEEN 1 AND 28
                                OR (
                                    `period_start_day` = 29
                                    AND (
                                        MOD(`period_start_year`, 400) = 0
                                        OR (
                                            MOD(`period_start_year`, 4) = 0
                                            AND MOD(`period_start_year`, 100) <> 0
                                        )
                                    )
                                )
                            )
                        )
                    ),

                CONSTRAINT `chk_personnel_church_activity_end_calendar_day`
                    CHECK (
                        `period_end_day` IS NULL
                        OR (
                            `period_end_month` IN (1, 3, 5, 7, 8, 10, 12)
                            AND `period_end_day` BETWEEN 1 AND 31
                        )
                        OR (
                            `period_end_month` IN (4, 6, 9, 11)
                            AND `period_end_day` BETWEEN 1 AND 30
                        )
                        OR (
                            `period_end_month` = 2
                            AND (
                                `period_end_day` BETWEEN 1 AND 28
                                OR (
                                    `period_end_day` = 29
                                    AND (
                                        MOD(`period_end_year`, 400) = 0
                                        OR (
                                            MOD(`period_end_year`, 4) = 0
                                            AND MOD(`period_end_year`, 100) <> 0
                                        )
                                    )
                                )
                            )
                        )
                    ),

                CONSTRAINT `chk_personnel_church_activity_period_year_order`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_start_year` IS NULL
                        OR `period_end_year` >= `period_start_year`
                    ),

                CONSTRAINT `chk_personnel_church_activity_period_month_order`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_start_year` IS NULL
                        OR `period_end_year` > `period_start_year`
                        OR `period_start_month` IS NULL
                        OR `period_end_month` IS NULL
                        OR `period_end_month` >= `period_start_month`
                    ),

                CONSTRAINT `chk_personnel_church_activity_period_day_order`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_start_year` IS NULL
                        OR `period_end_year` > `period_start_year`
                        OR `period_start_month` IS NULL
                        OR `period_end_month` IS NULL
                        OR `period_end_month` > `period_start_month`
                        OR `period_start_day` IS NULL
                        OR `period_end_day` IS NULL
                        OR `period_end_day` >= `period_start_day`
                    ),

                CONSTRAINT `chk_personnel_church_activity_ongoing_end_exclusive`
                    CHECK (
                        `is_ongoing` = 0
                        OR (
                            `period_end_year` IS NULL
                            AND `period_end_month` IS NULL
                            AND `period_end_day` IS NULL
                        )
                    ),

                CONSTRAINT `chk_personnel_church_activity_activity_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`activity`)) > 0
                    ),

                CONSTRAINT `chk_personnel_church_activity_conducted_by_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`conducted_or_organized_by`)) > 0
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );

        /*
         * Personnel C.2.f — Active Involvement in Community/Civic Activities
         *
         * One record represents one distinct evidence-supported instance
         * or bounded engagement in which the faculty/personnel member was
         * actively involved in a community or civic activity.
         *
         * The category captures actual involvement, not mere residence,
         * citizenship, civic identity, external-organization affiliation,
         * attendance/presence, invitation, donation/support alone,
         * routine public-facing employment duties, publicity, or recognition.
         *
         * Multiple sessions, meetings, service days, outreach stops,
         * preparations, tasks, outputs, photos, or evidence files belonging
         * to one underlying engagement do not automatically create additional
         * accomplishments.
         *
         * Date(s) preserves only evidence-supported temporal precision.
         * Supported representations may include an exact or partial date,
         * bounded range, recurring involvement period, AY/SY, semester,
         * project/program/campaign period, or another legitimate
         * evidence-supported named period.
         *
         * Exact dates must not be fabricated from event calendars,
         * recurring schedules, public holidays, civic observances,
         * AY conventions, or assumptions.
         *
         * Activity identifies the evidence-supported community/civic
         * activity, program, project, initiative, campaign, outreach,
         * service engagement, civic undertaking, or equivalent context.
         *
         * Conducted/Organized by preserves the evidence-supported associated
         * entity without inventing a universal interpretation.
         *
         * Supporting Evidence remains in the shared evidence layer.
         * Verified involvement/service/role wording, category qualification,
         * lifecycle state, duplicate resolution, and scoring remain outside
         * this table.
         *
         * C.2.f maximum = 25 points, C.2 maximum = 30, Area C maximum = 40.
         * No authoritative lower-level automatic scoring formula exists.
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `personnel_community_civic_involvement_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `period_precision` VARCHAR(24)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `period_start_year` SMALLINT UNSIGNED NULL,

                `period_start_month` TINYINT UNSIGNED NULL,

                `period_start_day` TINYINT UNSIGNED NULL,

                `period_end_year` SMALLINT UNSIGNED NULL,

                `period_end_month` TINYINT UNSIGNED NULL,

                `period_end_day` TINYINT UNSIGNED NULL,

                `is_ongoing` TINYINT(1) NOT NULL DEFAULT 0,

                `source_period_text` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `activity` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `conducted_or_organized_by` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `remarks` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_personnel_community_civic_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION,

                CONSTRAINT `chk_personnel_community_civic_period_precision`
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

                CONSTRAINT `chk_personnel_community_civic_start_year`
                    CHECK (
                        `period_start_year` IS NULL
                        OR `period_start_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_community_civic_start_month`
                    CHECK (
                        `period_start_month` IS NULL
                        OR `period_start_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_personnel_community_civic_start_day`
                    CHECK (
                        `period_start_day` IS NULL
                        OR `period_start_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_personnel_community_civic_end_year`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_end_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_community_civic_end_month`
                    CHECK (
                        `period_end_month` IS NULL
                        OR `period_end_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_personnel_community_civic_end_day`
                    CHECK (
                        `period_end_day` IS NULL
                        OR `period_end_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_personnel_community_civic_ongoing`
                    CHECK (
                        `is_ongoing` IN (0, 1)
                    ),

                CONSTRAINT `chk_personnel_community_civic_start_component_hierarchy`
                    CHECK (
                        `period_start_day` IS NULL
                        OR `period_start_month` IS NOT NULL
                    ),

                CONSTRAINT `chk_personnel_community_civic_end_component_hierarchy`
                    CHECK (
                        `period_end_day` IS NULL
                        OR `period_end_month` IS NOT NULL
                    ),

                CONSTRAINT `chk_personnel_community_civic_text_period_numeric_exclusive`
                    CHECK (
                        `period_precision` NOT IN (
                            'ACADEMIC_YEAR',
                            'NAMED_PERIOD'
                        )
                        OR (
                            `period_start_year` IS NULL
                            AND `period_start_month` IS NULL
                            AND `period_start_day` IS NULL
                            AND `period_end_year` IS NULL
                            AND `period_end_month` IS NULL
                            AND `period_end_day` IS NULL
                        )
                    ),

                CONSTRAINT `chk_personnel_community_civic_period_bundle`
                    CHECK (
                        (
                            `period_precision` = 'YEAR'
                            AND `period_start_year` IS NOT NULL
                            AND `period_start_month` IS NULL
                            AND `period_start_day` IS NULL
                            AND `period_end_year` IS NULL
                            AND `period_end_month` IS NULL
                            AND `period_end_day` IS NULL
                            AND `source_period_text` IS NULL
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
                            AND `source_period_text` IS NULL
                        )
                        OR
                        (
                            `period_precision` = 'RANGE'
                            AND `period_start_year` IS NOT NULL
                            AND `period_end_year` IS NOT NULL
                            AND `source_period_text` IS NULL
                        )
                        OR
                        (
                            `period_precision` IN (
                                'ACADEMIC_YEAR',
                                'NAMED_PERIOD'
                            )
                            AND `source_period_text` IS NOT NULL
                            AND CHAR_LENGTH(TRIM(`source_period_text`)) > 0
                        )
                    ),

                CONSTRAINT `chk_personnel_community_civic_start_calendar_day`
                    CHECK (
                        `period_start_day` IS NULL
                        OR (
                            `period_start_month` IN (1, 3, 5, 7, 8, 10, 12)
                            AND `period_start_day` BETWEEN 1 AND 31
                        )
                        OR (
                            `period_start_month` IN (4, 6, 9, 11)
                            AND `period_start_day` BETWEEN 1 AND 30
                        )
                        OR (
                            `period_start_month` = 2
                            AND (
                                `period_start_day` BETWEEN 1 AND 28
                                OR (
                                    `period_start_day` = 29
                                    AND (
                                        MOD(`period_start_year`, 400) = 0
                                        OR (
                                            MOD(`period_start_year`, 4) = 0
                                            AND MOD(`period_start_year`, 100) <> 0
                                        )
                                    )
                                )
                            )
                        )
                    ),

                CONSTRAINT `chk_personnel_community_civic_end_calendar_day`
                    CHECK (
                        `period_end_day` IS NULL
                        OR (
                            `period_end_month` IN (1, 3, 5, 7, 8, 10, 12)
                            AND `period_end_day` BETWEEN 1 AND 31
                        )
                        OR (
                            `period_end_month` IN (4, 6, 9, 11)
                            AND `period_end_day` BETWEEN 1 AND 30
                        )
                        OR (
                            `period_end_month` = 2
                            AND (
                                `period_end_day` BETWEEN 1 AND 28
                                OR (
                                    `period_end_day` = 29
                                    AND (
                                        MOD(`period_end_year`, 400) = 0
                                        OR (
                                            MOD(`period_end_year`, 4) = 0
                                            AND MOD(`period_end_year`, 100) <> 0
                                        )
                                    )
                                )
                            )
                        )
                    ),

                CONSTRAINT `chk_personnel_community_civic_period_year_order`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_start_year` IS NULL
                        OR `period_end_year` >= `period_start_year`
                    ),

                CONSTRAINT `chk_personnel_community_civic_period_month_order`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_start_year` IS NULL
                        OR `period_end_year` > `period_start_year`
                        OR `period_start_month` IS NULL
                        OR `period_end_month` IS NULL
                        OR `period_end_month` >= `period_start_month`
                    ),

                CONSTRAINT `chk_personnel_community_civic_period_day_order`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_start_year` IS NULL
                        OR `period_end_year` > `period_start_year`
                        OR `period_start_month` IS NULL
                        OR `period_end_month` IS NULL
                        OR `period_end_month` > `period_start_month`
                        OR `period_start_day` IS NULL
                        OR `period_end_day` IS NULL
                        OR `period_end_day` >= `period_start_day`
                    ),

                CONSTRAINT `chk_personnel_community_civic_ongoing_end_exclusive`
                    CHECK (
                        `is_ongoing` = 0
                        OR (
                            `period_end_year` IS NULL
                            AND `period_end_month` IS NULL
                            AND `period_end_day` IS NULL
                        )
                    ),

                CONSTRAINT `chk_personnel_community_civic_activity_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`activity`)) > 0
                    ),

                CONSTRAINT `chk_personnel_community_civic_conducted_by_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`conducted_or_organized_by`)) > 0
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARACTER SET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
            SQL
        );

        /*
         * Personnel C.2.g — Support to Charity and Community Projects
         *
         * One record represents one distinct evidence-supported
         * support/contribution fact made by the faculty/personnel member
         * to a charity or community project.
         *
         * Support may be financial, material, in-kind, resource-based,
         * logistical, or another evidence-supported contribution.
         *
         * This category stores the support/contribution fact itself.
         * It must not be used merely for attendance, affiliation, publicity,
         * recognition, residence/community identity, ordinary employment,
         * or active community/civic service that belongs under C.2.f.
         *
         * Several receipts, installments, item lines, delivery batches,
         * documents, photos, or evidence files may support one bounded
         * contribution and do not automatically create additional records.
         *
         * Date(s) preserves only evidence-supported contribution timing.
         * Supported representations may include an exact or partial date,
         * payment/transfer date, delivery/turnover date, bounded support
         * period, AY/SY, semester, project/campaign period, or another
         * legitimate evidence-supported named period.
         *
         * Exact contribution dates must not be fabricated from invoice,
         * purchase, receipt-issue, acknowledgment, project/event,
         * certificate, upload, or other document dates unless evidence
         * establishes that date as the actual contribution event.
         *
         * Activity identifies the evidence-supported charity/community
         * project, program, campaign, initiative, relief effort,
         * donation drive, or equivalent project/support context.
         *
         * Conducted/Organized by preserves the evidence-supported associated
         * entity without redefining it as beneficiary, donor, sponsor,
         * funder, recipient, venue, signatory, employer, or government level.
         *
         * The ranking source's role/support requirement does not justify a
         * separate mandatory faculty-facing field. Evidence-supported
         * contribution/support context may remain in Remarks and/or
         * reviewer/system metadata.
         *
         * Supporting Evidence remains in the shared evidence layer.
         * Contribution identity, duplicate resolution, category qualification,
         * reviewer findings, lifecycle state, and scoring remain outside
         * this detail table.
         *
         * C2c maximum = 5 points, C.2 maximum = 30, Area C maximum = 40.
         * No authoritative lower-level automatic scoring formula exists.
         */
        $this->db->query(
            <<<'SQL'
            CREATE TABLE `personnel_charity_community_support_details` (
                `record_version_id` CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `period_precision` VARCHAR(24)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `period_start_year` SMALLINT UNSIGNED NULL,

                `period_start_month` TINYINT UNSIGNED NULL,

                `period_start_day` TINYINT UNSIGNED NULL,

                `period_end_year` SMALLINT UNSIGNED NULL,

                `period_end_month` TINYINT UNSIGNED NULL,

                `period_end_day` TINYINT UNSIGNED NULL,

                `is_ongoing` TINYINT(1) NOT NULL DEFAULT 0,

                `source_period_text` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                `activity` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `conducted_or_organized_by` VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                `remarks` TEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                PRIMARY KEY (`record_version_id`),

                CONSTRAINT `fk_personnel_charity_support_version`
                    FOREIGN KEY (`record_version_id`)
                    REFERENCES `achievement_record_versions` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION,

                CONSTRAINT `chk_personnel_charity_support_period_precision`
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

                CONSTRAINT `chk_personnel_charity_support_start_year`
                    CHECK (
                        `period_start_year` IS NULL
                        OR `period_start_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_charity_support_start_month`
                    CHECK (
                        `period_start_month` IS NULL
                        OR `period_start_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_personnel_charity_support_start_day`
                    CHECK (
                        `period_start_day` IS NULL
                        OR `period_start_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_personnel_charity_support_end_year`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_end_year` BETWEEN 1000 AND 9999
                    ),

                CONSTRAINT `chk_personnel_charity_support_end_month`
                    CHECK (
                        `period_end_month` IS NULL
                        OR `period_end_month` BETWEEN 1 AND 12
                    ),

                CONSTRAINT `chk_personnel_charity_support_end_day`
                    CHECK (
                        `period_end_day` IS NULL
                        OR `period_end_day` BETWEEN 1 AND 31
                    ),

                CONSTRAINT `chk_personnel_charity_support_ongoing`
                    CHECK (
                        `is_ongoing` IN (0, 1)
                    ),

                CONSTRAINT `chk_personnel_charity_support_start_component_hierarchy`
                    CHECK (
                        `period_start_day` IS NULL
                        OR `period_start_month` IS NOT NULL
                    ),

                CONSTRAINT `chk_personnel_charity_support_end_component_hierarchy`
                    CHECK (
                        `period_end_day` IS NULL
                        OR `period_end_month` IS NOT NULL
                    ),

                CONSTRAINT `chk_personnel_charity_support_text_period_numeric_exclusive`
                    CHECK (
                        `period_precision` NOT IN (
                            'ACADEMIC_YEAR',
                            'NAMED_PERIOD'
                        )
                        OR (
                            `period_start_year` IS NULL
                            AND `period_start_month` IS NULL
                            AND `period_start_day` IS NULL
                            AND `period_end_year` IS NULL
                            AND `period_end_month` IS NULL
                            AND `period_end_day` IS NULL
                        )
                    ),

                CONSTRAINT `chk_personnel_charity_support_period_bundle`
                    CHECK (
                        (
                            `period_precision` = 'YEAR'
                            AND `period_start_year` IS NOT NULL
                            AND `period_start_month` IS NULL
                            AND `period_start_day` IS NULL
                            AND `period_end_year` IS NULL
                            AND `period_end_month` IS NULL
                            AND `period_end_day` IS NULL
                            AND `source_period_text` IS NULL
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
                            AND `source_period_text` IS NULL
                        )
                        OR
                        (
                            `period_precision` = 'RANGE'
                            AND `period_start_year` IS NOT NULL
                            AND `period_end_year` IS NOT NULL
                            AND `source_period_text` IS NULL
                        )
                        OR
                        (
                            `period_precision` IN (
                                'ACADEMIC_YEAR',
                                'NAMED_PERIOD'
                            )
                            AND `source_period_text` IS NOT NULL
                            AND CHAR_LENGTH(TRIM(`source_period_text`)) > 0
                        )
                    ),

                CONSTRAINT `chk_personnel_charity_support_start_calendar_day`
                    CHECK (
                        `period_start_day` IS NULL
                        OR (
                            `period_start_month` IN (1, 3, 5, 7, 8, 10, 12)
                            AND `period_start_day` BETWEEN 1 AND 31
                        )
                        OR (
                            `period_start_month` IN (4, 6, 9, 11)
                            AND `period_start_day` BETWEEN 1 AND 30
                        )
                        OR (
                            `period_start_month` = 2
                            AND (
                                `period_start_day` BETWEEN 1 AND 28
                                OR (
                                    `period_start_day` = 29
                                    AND (
                                        MOD(`period_start_year`, 400) = 0
                                        OR (
                                            MOD(`period_start_year`, 4) = 0
                                            AND MOD(`period_start_year`, 100) <> 0
                                        )
                                    )
                                )
                            )
                        )
                    ),

                CONSTRAINT `chk_personnel_charity_support_end_calendar_day`
                    CHECK (
                        `period_end_day` IS NULL
                        OR (
                            `period_end_month` IN (1, 3, 5, 7, 8, 10, 12)
                            AND `period_end_day` BETWEEN 1 AND 31
                        )
                        OR (
                            `period_end_month` IN (4, 6, 9, 11)
                            AND `period_end_day` BETWEEN 1 AND 30
                        )
                        OR (
                            `period_end_month` = 2
                            AND (
                                `period_end_day` BETWEEN 1 AND 28
                                OR (
                                    `period_end_day` = 29
                                    AND (
                                        MOD(`period_end_year`, 400) = 0
                                        OR (
                                            MOD(`period_end_year`, 4) = 0
                                            AND MOD(`period_end_year`, 100) <> 0
                                        )
                                    )
                                )
                            )
                        )
                    ),

                CONSTRAINT `chk_personnel_charity_support_period_year_order`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_start_year` IS NULL
                        OR `period_end_year` >= `period_start_year`
                    ),

                CONSTRAINT `chk_personnel_charity_support_period_month_order`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_start_year` IS NULL
                        OR `period_end_year` > `period_start_year`
                        OR `period_start_month` IS NULL
                        OR `period_end_month` IS NULL
                        OR `period_end_month` >= `period_start_month`
                    ),

                CONSTRAINT `chk_personnel_charity_support_period_day_order`
                    CHECK (
                        `period_end_year` IS NULL
                        OR `period_start_year` IS NULL
                        OR `period_end_year` > `period_start_year`
                        OR `period_start_month` IS NULL
                        OR `period_end_month` IS NULL
                        OR `period_end_month` > `period_start_month`
                        OR `period_start_day` IS NULL
                        OR `period_end_day` IS NULL
                        OR `period_end_day` >= `period_start_day`
                    ),

                CONSTRAINT `chk_personnel_charity_support_ongoing_end_exclusive`
                    CHECK (
                        `is_ongoing` = 0
                        OR (
                            `period_end_year` IS NULL
                            AND `period_end_month` IS NULL
                            AND `period_end_day` IS NULL
                        )
                    ),

                CONSTRAINT `chk_personnel_charity_support_activity_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`activity`)) > 0
                    ),

                CONSTRAINT `chk_personnel_charity_support_conducted_by_nonblank`
                    CHECK (
                        CHAR_LENGTH(TRIM(`conducted_or_organized_by`)) > 0
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
            'DROP TABLE IF EXISTS `personnel_charity_community_support_details`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `personnel_community_civic_involvement_details`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `personnel_church_activity_involvement_details`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `personnel_school_activity_service_details`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `personnel_working_committee_details`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `personnel_coach_trainer_details`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `personnel_moderator_assignment_details`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `personnel_creative_work_details`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `personnel_instructional_material_details`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `personnel_recognition_award_details`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `personnel_research_details`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `personnel_publication_details`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `personnel_invited_professional_engagement_details`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `personnel_seminar_training_attendance_details`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `personnel_professional_membership_details`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `personnel_education_details`'
        );
    }
}
