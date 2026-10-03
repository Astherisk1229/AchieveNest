<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddPersonnelEmploymentStartDate extends Migration
{
    public function up()
    {
        if (! $this->db->fieldExists('employment_start_date', 'personnel_profiles')) {
            $this->forge->addColumn('personnel_profiles', [
                'employment_start_date' => ['type' => 'DATE', 'null' => true, 'after' => 'employment_status'],
            ]);
        }
    }

    public function down()
    {
        if ($this->db->fieldExists('employment_start_date', 'personnel_profiles')) {
            $this->forge->dropColumn('personnel_profiles', 'employment_start_date');
        }
    }
}
