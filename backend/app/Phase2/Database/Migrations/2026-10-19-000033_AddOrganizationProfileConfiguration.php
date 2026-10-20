<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

final class AddOrganizationProfileConfiguration extends Migration
{
    public function up()
    {
        if (! $this->db->fieldExists('profile_configuration', 'organizations')) {
            $this->db->query('ALTER TABLE organizations ADD COLUMN profile_configuration JSON NULL');
        }
    }

    public function down()
    {
        // Preserve public organization profile data once stored.
    }
}
