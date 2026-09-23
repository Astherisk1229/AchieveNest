<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

final class ReconcileStudentSportsCanonicalColumns extends Migration
{
    private const TABLE = 'student_sports_details';

    private const CHECK_CONSTRAINTS = [
        'chk_student_sports_competition_type',
        'chk_student_sports_specified_competition',
        'chk_student_sports_level_context',
    ];

    public function up()
    {
        $fields = $this->db->getFieldNames(self::TABLE);

        $hasLegacyCompetitionType =
            in_array('competition_type', $fields, true);

        $hasLegacySpecifiedCompetition =
            in_array('specified_competition', $fields, true);

        $hasCanonicalCompetitionType =
            in_array('event_type_competition', $fields, true);

        $hasCanonicalSpecifiedCompetition =
            in_array('specified_competition_meet', $fields, true);

        /*
         * Already reconciled.
         */
        if (
            $hasCanonicalCompetitionType
            && $hasCanonicalSpecifiedCompetition
            && ! $hasLegacyCompetitionType
            && ! $hasLegacySpecifiedCompetition
        ) {
            return;
        }

        /*
         * Fail closed on partial or ambiguous schema states.
         */
        if (
            ! $hasLegacyCompetitionType
            || ! $hasLegacySpecifiedCompetition
            || $hasCanonicalCompetitionType
            || $hasCanonicalSpecifiedCompetition
        ) {
            throw new RuntimeException(
                'Student Sports schema is not in the expected '
                . 'pre-reconciliation state.'
            );
        }

        /*
         * Student 07 — Sports
         *
         * Three existing CHECK constraints reference the legacy
         * competition column names. MySQL therefore requires those
         * constraints to be dropped before the columns can be renamed.
         *
         * Perform the constraint replacement and column rename together
         * in one ALTER TABLE statement so the canonical constraints are
         * restored immediately against the canonical field names.
         */
        $this->db->query(
            <<<'SQL'
            ALTER TABLE `student_sports_details`

                DROP CHECK `chk_student_sports_competition_type`,
                DROP CHECK `chk_student_sports_specified_competition`,
                DROP CHECK `chk_student_sports_level_context`,

                CHANGE COLUMN
                    `competition_type`
                    `event_type_competition`
                    VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                CHANGE COLUMN
                    `specified_competition`
                    `specified_competition_meet`
                    VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                ADD CONSTRAINT `chk_student_sports_competition_type`
                    CHECK (
                        `event_type_competition` IN (
                            'PRISAA',
                            'NDEA',
                            'INTRAMURALS_UNIVERSITY_MEET',
                            'OTHER_APPROVED_COMPETITION'
                        )
                    ),

                ADD CONSTRAINT `chk_student_sports_specified_competition`
                    CHECK (
                        (
                            `event_type_competition`
                                = 'OTHER_APPROVED_COMPETITION'
                            AND `specified_competition_meet` IS NOT NULL
                            AND CHAR_LENGTH(
                                TRIM(`specified_competition_meet`)
                            ) > 0
                        )
                        OR
                        (
                            `event_type_competition`
                                <> 'OTHER_APPROVED_COMPETITION'
                            AND `specified_competition_meet` IS NULL
                        )
                    ),

                ADD CONSTRAINT `chk_student_sports_level_context`
                    CHECK (
                        (
                            `event_type_competition` = 'PRISAA'
                            AND `competition_level` IS NOT NULL
                        )
                        OR
                        (
                            `event_type_competition` IN (
                                'NDEA',
                                'INTRAMURALS_UNIVERSITY_MEET'
                            )
                            AND `competition_level` IS NULL
                        )
                        OR
                        (
                            `event_type_competition`
                                = 'OTHER_APPROVED_COMPETITION'
                        )
                    )
            SQL
        );

        /*
         * CodeIgniter may retain field metadata obtained before ALTER.
         */
        $this->db->resetDataCache();

        $fields = $this->db->getFieldNames(self::TABLE);

        if (
            ! in_array('event_type_competition', $fields, true)
            || ! in_array('specified_competition_meet', $fields, true)
            || in_array('competition_type', $fields, true)
            || in_array('specified_competition', $fields, true)
        ) {
            throw new RuntimeException(
                'Student Sports canonical column reconciliation '
                . 'verification failed.'
            );
        }

        $this->assertCheckConstraintsExist();
    }

    public function down()
    {
        $fields = $this->db->getFieldNames(self::TABLE);

        $hasCanonicalCompetitionType =
            in_array('event_type_competition', $fields, true);

        $hasCanonicalSpecifiedCompetition =
            in_array('specified_competition_meet', $fields, true);

        $hasLegacyCompetitionType =
            in_array('competition_type', $fields, true);

        $hasLegacySpecifiedCompetition =
            in_array('specified_competition', $fields, true);

        /*
         * Already rolled back.
         */
        if (
            $hasLegacyCompetitionType
            && $hasLegacySpecifiedCompetition
            && ! $hasCanonicalCompetitionType
            && ! $hasCanonicalSpecifiedCompetition
        ) {
            return;
        }

        if (
            ! $hasCanonicalCompetitionType
            || ! $hasCanonicalSpecifiedCompetition
            || $hasLegacyCompetitionType
            || $hasLegacySpecifiedCompetition
        ) {
            throw new RuntimeException(
                'Student Sports schema is not in the expected '
                . 'canonical state for rollback.'
            );
        }

        $this->db->query(
            <<<'SQL'
            ALTER TABLE `student_sports_details`

                DROP CHECK `chk_student_sports_competition_type`,
                DROP CHECK `chk_student_sports_specified_competition`,
                DROP CHECK `chk_student_sports_level_context`,

                CHANGE COLUMN
                    `event_type_competition`
                    `competition_type`
                    VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                CHANGE COLUMN
                    `specified_competition_meet`
                    `specified_competition`
                    VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                ADD CONSTRAINT `chk_student_sports_competition_type`
                    CHECK (
                        `competition_type` IN (
                            'PRISAA',
                            'NDEA',
                            'INTRAMURALS_UNIVERSITY_MEET',
                            'OTHER_APPROVED_COMPETITION'
                        )
                    ),

                ADD CONSTRAINT `chk_student_sports_specified_competition`
                    CHECK (
                        (
                            `competition_type`
                                = 'OTHER_APPROVED_COMPETITION'
                            AND `specified_competition` IS NOT NULL
                            AND CHAR_LENGTH(
                                TRIM(`specified_competition`)
                            ) > 0
                        )
                        OR
                        (
                            `competition_type`
                                <> 'OTHER_APPROVED_COMPETITION'
                            AND `specified_competition` IS NULL
                        )
                    ),

                ADD CONSTRAINT `chk_student_sports_level_context`
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
                            `competition_type`
                                = 'OTHER_APPROVED_COMPETITION'
                        )
                    )
            SQL
        );

        $this->db->resetDataCache();

        $fields = $this->db->getFieldNames(self::TABLE);

        if (
            ! in_array('competition_type', $fields, true)
            || ! in_array('specified_competition', $fields, true)
            || in_array('event_type_competition', $fields, true)
            || in_array('specified_competition_meet', $fields, true)
        ) {
            throw new RuntimeException(
                'Student Sports rollback verification failed.'
            );
        }

        $this->assertCheckConstraintsExist();
    }

    private function assertCheckConstraintsExist(): void
    {
        $rows = $this->db->query(
            <<<'SQL'
            SELECT `CONSTRAINT_NAME`
            FROM `INFORMATION_SCHEMA`.`TABLE_CONSTRAINTS`
            WHERE `TABLE_SCHEMA` = DATABASE()
              AND `TABLE_NAME` = 'student_sports_details'
              AND `CONSTRAINT_TYPE` = 'CHECK'
            SQL
        )->getResultArray();

        $constraintNames = array_column(
            $rows,
            'CONSTRAINT_NAME'
        );

        foreach (self::CHECK_CONSTRAINTS as $constraintName) {
            if (! in_array($constraintName, $constraintNames, true)) {
                throw new RuntimeException(
                    'Student Sports CHECK constraint missing after '
                    . 'reconciliation: '
                    . $constraintName
                );
            }
        }
    }
}