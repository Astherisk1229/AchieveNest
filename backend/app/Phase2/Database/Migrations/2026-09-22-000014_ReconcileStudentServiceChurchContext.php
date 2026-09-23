<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

final class ReconcileStudentServiceChurchContext extends Migration
{
    public function up()
    {
        if (! $this->db->tableExists('student_service_details')) {
            throw new RuntimeException(
                'student_service_details table is required before migration 000014.'
            );
        }

        if (
            $this->db->fieldExists(
                'church_parish_ministry_organization',
                'student_service_details'
            )
        ) {
            return;
        }

        $this->db->query(
            <<<'SQL'
            ALTER TABLE `student_service_details`
                ADD COLUMN `church_parish_ministry_organization`
                    VARCHAR(255)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL
                    AFTER `university_unit_or_office`
            SQL
        );
    }

    public function down()
    {
        if (! $this->db->tableExists('student_service_details')) {
            return;
        }

        if (
            ! $this->db->fieldExists(
                'church_parish_ministry_organization',
                'student_service_details'
            )
        ) {
            return;
        }

        $count = $this->db
            ->table('student_service_details')
            ->where(
                'church_parish_ministry_organization IS NOT NULL',
                null,
                false
            )
            ->countAllResults();

        if ($count > 0) {
            throw new RuntimeException(
                'Cannot rollback migration 000014 while church service context data exists.'
            );
        }

        $this->db->query(
            <<<'SQL'
            ALTER TABLE `student_service_details`
                DROP COLUMN `church_parish_ministry_organization`
            SQL
        );
    }
}
