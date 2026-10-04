<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Wiring remediation Phase 5 (item 4).
 * Personnel can edit their own contact number, location, about-me and specialization. The profile
 * modal only changed local state, so nothing survived a refresh. Name, ID, designation, email and
 * attainment stay HR-managed. Idempotent. down() is a no-op because the columns may hold live data.
 */
final class AddPersonnelSelfServiceProfileFields extends Migration
{
    public function up()
    {
        $columns = [
            'contact_number' => 'varchar(40) NULL',
            'location'       => 'varchar(160) NULL',
            'about_me'       => 'text NULL',
            'specialization' => 'varchar(160) NULL',
        ];
        foreach ($columns as $name => $definition) {
            if (! $this->db->fieldExists($name, 'personnel_profiles')) {
                $this->db->query("ALTER TABLE `personnel_profiles` ADD COLUMN `{$name}` {$definition}");
            }
        }
    }

    public function down()
    {
    }
}
