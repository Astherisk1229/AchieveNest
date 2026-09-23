<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

final class ReconcileStudentRecognitionCanonicalColumns extends Migration
{
    public function up()
    {
        $table = 'student_recognition_details';

        if (! $this->db->tableExists($table)) {
            throw new RuntimeException(
                'student_recognition_details table is required before migration 000015.'
            );
        }

        $hasOldGrantingBody = $this->db->fieldExists(
            'granting_body',
            $table
        );

        $hasNewGrantingBody = $this->db->fieldExists(
            'granting_body_name',
            $table
        );

        if ($hasOldGrantingBody && $hasNewGrantingBody) {
            throw new RuntimeException(
                'Migration 000015 cannot reconcile granting body because both old and canonical columns exist.'
            );
        }

        $hasOldOrganization = $this->db->fieldExists(
            'organization_club',
            $table
        );

        $hasNewOrganization = $this->db->fieldExists(
            'recognized_organization_name',
            $table
        );

        if ($hasOldOrganization && $hasNewOrganization) {
            throw new RuntimeException(
                'Migration 000015 cannot reconcile organization because both old and canonical columns exist.'
            );
        }

        if ($hasOldGrantingBody) {
            $this->db->query(
                <<<'SQL'
                ALTER TABLE `student_recognition_details`
                    CHANGE COLUMN `granting_body`
                        `granting_body_name`
                        VARCHAR(255)
                        CHARACTER SET utf8mb4
                        COLLATE utf8mb4_unicode_ci
                        NOT NULL
                SQL
            );
        }

        if ($hasOldOrganization) {
            $this->db->query(
                <<<'SQL'
                ALTER TABLE `student_recognition_details`
                    CHANGE COLUMN `organization_club`
                        `recognized_organization_name`
                        VARCHAR(255)
                        CHARACTER SET utf8mb4
                        COLLATE utf8mb4_unicode_ci
                        NULL
                SQL
            );
        }

        /*
         * ALTER TABLE changes the physical schema immediately, but
         * CodeIgniter may still hold the previous field metadata in
         * this connection. Clear it before post-DDL verification.
         */
        $this->db->resetDataCache();

        if (
            ! $this->db->fieldExists('granting_body_name', $table)
            || ! $this->db->fieldExists(
                'recognized_organization_name',
                $table
            )
        ) {
            throw new RuntimeException(
                'Migration 000015 failed to establish canonical Student 06 recognition columns.'
            );
        }
    }

    public function down()
    {
        $table = 'student_recognition_details';

        if (! $this->db->tableExists($table)) {
            return;
        }

        $hasCanonicalGrantingBody = $this->db->fieldExists(
            'granting_body_name',
            $table
        );

        $hasOldGrantingBody = $this->db->fieldExists(
            'granting_body',
            $table
        );

        if ($hasCanonicalGrantingBody && $hasOldGrantingBody) {
            throw new RuntimeException(
                'Cannot rollback migration 000015 because both granting-body columns exist.'
            );
        }

        $hasCanonicalOrganization = $this->db->fieldExists(
            'recognized_organization_name',
            $table
        );

        $hasOldOrganization = $this->db->fieldExists(
            'organization_club',
            $table
        );

        if ($hasCanonicalOrganization && $hasOldOrganization) {
            throw new RuntimeException(
                'Cannot rollback migration 000015 because both organization columns exist.'
            );
        }

        if ($hasCanonicalGrantingBody) {
            $this->db->query(
                <<<'SQL'
                ALTER TABLE `student_recognition_details`
                    CHANGE COLUMN `granting_body_name`
                        `granting_body`
                        VARCHAR(255)
                        CHARACTER SET utf8mb4
                        COLLATE utf8mb4_unicode_ci
                        NOT NULL
                SQL
            );
        }

        if ($hasCanonicalOrganization) {
            $this->db->query(
                <<<'SQL'
                ALTER TABLE `student_recognition_details`
                    CHANGE COLUMN `recognized_organization_name`
                        `organization_club`
                        VARCHAR(255)
                        CHARACTER SET utf8mb4
                        COLLATE utf8mb4_unicode_ci
                        NULL
                SQL
            );
        }
    }
}
