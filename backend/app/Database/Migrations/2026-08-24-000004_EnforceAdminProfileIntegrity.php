<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class EnforceAdminProfileIntegrity extends Migration
{
    public function up()
    {
        // 1. Enforce NULL academic fields for dedicated admin accounts (hr_admin and osad_admin)
        $this->db->query(<<<'SQL'
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_admin_null_academic_fields_check,
    ADD CONSTRAINT profiles_admin_null_academic_fields_check
        CHECK (
            account_type NOT IN ('hr_admin', 'osad_admin')
            OR (
                department_id IS NULL
                AND degree_program_id IS NULL
                AND year_level IS NULL
            )
        );
SQL);

        // 2. Require non-null, nonblank designation for dedicated admin accounts (hr_admin and osad_admin)
        $this->db->query(<<<'SQL'
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_admin_designation_check,
    ADD CONSTRAINT profiles_admin_designation_check
        CHECK (
            account_type NOT IN ('hr_admin', 'osad_admin')
            OR (
                designation IS NOT NULL
                AND btrim(designation) <> ''
            )
        );
SQL);
    }

    public function down()
    {
        $this->db->query(<<<'SQL'
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_admin_null_academic_fields_check,
    DROP CONSTRAINT IF EXISTS profiles_admin_designation_check;
SQL);
    }
}
