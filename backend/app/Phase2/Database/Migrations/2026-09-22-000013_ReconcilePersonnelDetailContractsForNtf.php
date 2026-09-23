<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

class ReconcilePersonnelDetailContractsForNtf extends Migration
{
    public function up()
    {
        /*
         * Phase 2 corrective reconciliation
         *
         * Purpose:
         * - Preserve the finalized Faculty contracts.
         * - Allow the shared personnel detail tables to also represent
         *   finalized NTF (Non-Teaching Faculty) contracts without
         *   fabricating Faculty-only scoring dimensions.
         *
         * This migration does not seed contract-registry rows.
         */

        /*
         * NTF B.1.a — Moderator or Officer of Clubs
         *
         * Faculty C.1.a is specifically Moderator of Clubs/Organizations.
         * NTF B.1.a explicitly allows either Moderator or Officer.
         *
         * NULL is intentionally allowed because Faculty C.1.a does not
         * require a separately stored assignment-role field. Contract-aware
         * application validation must require this field for NTF B.1.a.
         */
        $this->db->query(
            <<<'SQL'
            ALTER TABLE `personnel_moderator_assignment_details`
                ADD COLUMN `assignment_role` VARCHAR(32)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL
                    AFTER `clubs_organizations`,
                ADD CONSTRAINT `chk_personnel_moderator_assignment_role`
                    CHECK (
                        `assignment_role` IS NULL
                        OR `assignment_role` IN (
                            'MODERATOR',
                            'OFFICER'
                        )
                    )
            SQL
        );

        /*
         * NTF B.4 — Invited as Judge / Lecturer / Resource Person
         *
         * The shared Faculty B.1 table currently requires three scoring
         * dimensions that are not fields of the finalized NTF B.4 contract:
         *
         * - sponsoring_organization_type
         * - engagement_extent
         * - participant_scope
         *
         * They remain valid Faculty fields, but become nullable at the
         * physical schema level. Contract-aware validation must continue
         * requiring them for Faculty B.1 while permitting NULL for NTF B.4.
         */

        $this->db->query(
            <<<'SQL'
            ALTER TABLE `personnel_invited_professional_engagement_details`
                DROP CHECK `chk_personnel_invited_engagement_sponsor_type`,
                DROP CHECK `chk_personnel_invited_engagement_extent`,
                DROP CHECK `chk_personnel_invited_engagement_scope`
            SQL
        );

        $this->db->query(
            <<<'SQL'
            ALTER TABLE `personnel_invited_professional_engagement_details`
                MODIFY COLUMN `sponsoring_organization_type` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,
                MODIFY COLUMN `engagement_extent` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,
                MODIFY COLUMN `participant_scope` VARCHAR(32)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL
            SQL
        );

        $this->db->query(
            <<<'SQL'
            ALTER TABLE `personnel_invited_professional_engagement_details`
                ADD CONSTRAINT `chk_personnel_invited_engagement_sponsor_type`
                    CHECK (
                        `sponsoring_organization_type` IS NULL
                        OR `sponsoring_organization_type` IN (
                            'NDMU',
                            'EXTERNAL_AGENCIES_OTHER_SCHOOLS'
                        )
                    ),
                ADD CONSTRAINT `chk_personnel_invited_engagement_extent`
                    CHECK (
                        `engagement_extent` IS NULL
                        OR `engagement_extent` IN (
                            'ONE_HOUR',
                            'HALF_DAY',
                            'ONE_DAY',
                            'TWO_DAYS',
                            'MORE_THAN_TWO_DAYS'
                        )
                    ),
                ADD CONSTRAINT `chk_personnel_invited_engagement_scope`
                    CHECK (
                        `participant_scope` IS NULL
                        OR `participant_scope` IN (
                            'LOCAL',
                            'REGIONAL',
                            'NATIONAL',
                            'INTERNATIONAL'
                        )
                    )
            SQL
        );
    }

    public function down()
    {
        /*
         * Restoring the original NOT NULL Faculty-oriented structure is only
         * safe when no rows rely on the NTF nullable behavior.
         */
        $row = $this->db->query(
            <<<'SQL'
            SELECT COUNT(*) AS unsafe_rows
            FROM `personnel_invited_professional_engagement_details`
            WHERE `sponsoring_organization_type` IS NULL
               OR `engagement_extent` IS NULL
               OR `participant_scope` IS NULL
            SQL
        )->getRowArray();

        if ((int) ($row['unsafe_rows'] ?? 0) > 0) {
            throw new RuntimeException(
                'Cannot rollback Phase2 migration 000013: invited professional engagement rows contain NTF-compatible NULL scoring dimensions.'
            );
        }

        $this->db->query(
            <<<'SQL'
            ALTER TABLE `personnel_invited_professional_engagement_details`
                DROP CHECK `chk_personnel_invited_engagement_sponsor_type`,
                DROP CHECK `chk_personnel_invited_engagement_extent`,
                DROP CHECK `chk_personnel_invited_engagement_scope`
            SQL
        );

        $this->db->query(
            <<<'SQL'
            ALTER TABLE `personnel_invited_professional_engagement_details`
                MODIFY COLUMN `sponsoring_organization_type` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,
                MODIFY COLUMN `engagement_extent` VARCHAR(64)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,
                MODIFY COLUMN `participant_scope` VARCHAR(32)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL
            SQL
        );

        $this->db->query(
            <<<'SQL'
            ALTER TABLE `personnel_invited_professional_engagement_details`
                ADD CONSTRAINT `chk_personnel_invited_engagement_sponsor_type`
                    CHECK (
                        `sponsoring_organization_type` IN (
                            'NDMU',
                            'EXTERNAL_AGENCIES_OTHER_SCHOOLS'
                        )
                    ),
                ADD CONSTRAINT `chk_personnel_invited_engagement_extent`
                    CHECK (
                        `engagement_extent` IN (
                            'ONE_HOUR',
                            'HALF_DAY',
                            'ONE_DAY',
                            'TWO_DAYS',
                            'MORE_THAN_TWO_DAYS'
                        )
                    ),
                ADD CONSTRAINT `chk_personnel_invited_engagement_scope`
                    CHECK (
                        `participant_scope` IN (
                            'LOCAL',
                            'REGIONAL',
                            'NATIONAL',
                            'INTERNATIONAL'
                        )
                    )
            SQL
        );

        $this->db->query(
            <<<'SQL'
            ALTER TABLE `personnel_moderator_assignment_details`
                DROP CHECK `chk_personnel_moderator_assignment_role`,
                DROP COLUMN `assignment_role`
            SQL
        );
    }
}
