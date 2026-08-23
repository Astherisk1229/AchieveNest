<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddStructuredNameToProfiles extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
ALTER TABLE public.profiles
    ADD COLUMN first_name text NOT NULL DEFAULT '',
    ADD COLUMN middle_name text,
    ADD COLUMN last_name text NOT NULL DEFAULT '',
    ADD COLUMN suffix text
SQL);

        $this->db->query(<<<'SQL'
ALTER TABLE public.profiles
    ALTER COLUMN first_name DROP DEFAULT,
    ALTER COLUMN last_name DROP DEFAULT
SQL);
    }

    public function down()
    {
        $this->db->query(<<<'SQL'
ALTER TABLE public.profiles
    DROP COLUMN IF EXISTS first_name,
    DROP COLUMN IF EXISTS middle_name,
    DROP COLUMN IF EXISTS last_name,
    DROP COLUMN IF EXISTS suffix
SQL);
    }
}
