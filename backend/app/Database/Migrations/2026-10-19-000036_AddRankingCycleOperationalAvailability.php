<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddRankingCycleOperationalAvailability extends Migration
{
    public function up()
    {
        if (! $this->db->tableExists('ranking_cycles') || $this->db->fieldExists('operational_enabled', 'ranking_cycles')) return;
        $this->forge->addColumn('ranking_cycles', [
            'operational_enabled' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 1, 'null' => false, 'after' => 'academic_year'],
        ]);
    }

    public function down()
    {
        if ($this->db->tableExists('ranking_cycles') && $this->db->fieldExists('operational_enabled', 'ranking_cycles')) {
            $this->forge->dropColumn('ranking_cycles', 'operational_enabled');
        }
    }
}
