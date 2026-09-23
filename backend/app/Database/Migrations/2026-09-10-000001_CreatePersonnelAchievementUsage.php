<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreatePersonnelAchievementUsage extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'       => 'VARCHAR',
                'constraint' => 36,
            ],
            'achievement_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 36,
            ],
            'personnel_profile_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 36,
            ],
            'portfolio_submission_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 36,
            ],
            'academic_year' => [
                'type'       => 'VARCHAR',
                'constraint' => 20,
            ],
            'used_at' => [
                'type' => 'DATETIME',
            ],
            'reuse_lock_years' => [
                'type'       => 'INT',
                'constraint' => 11,
                'default'    => 2,
            ],
            'eligible_again_academic_year' => [
                'type'       => 'VARCHAR',
                'constraint' => 20,
            ],
            'created_at' => [
                'type' => 'DATETIME',
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addKey(['achievement_id', 'portfolio_submission_id'], false, true, 'uk_achievement_submission');
        $this->forge->addKey('personnel_profile_id');
        $this->forge->addKey('achievement_id');
        $this->forge->createTable('personnel_achievement_usage', true);
    }

    public function down()
    {
        $this->forge->dropTable('personnel_achievement_usage', true);
    }
}
