<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

final class AddOrganizationProfileConfiguration extends Migration
{
    public function up()
    {
        if ($this->db->DBDriver === 'Postgre') {
            $this->db->query('ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS profile_configuration jsonb NULL');
            return;
        }
        if (! $this->db->fieldExists('profile_configuration', 'organizations')) {
            $this->db->query('ALTER TABLE organizations ADD COLUMN profile_configuration JSON NULL');
        }
    }

    public function down()
    {
        if ($this->db->DBDriver === 'Postgre') {
            $this->db->query('ALTER TABLE public.organizations DROP COLUMN IF EXISTS profile_configuration');
            return;
        }
        if ($this->db->DBDriver === 'MySQLi' && $this->db->fieldExists('profile_configuration', 'organizations')) {
            $this->db->query('ALTER TABLE organizations DROP COLUMN profile_configuration');
        }
    }
}
