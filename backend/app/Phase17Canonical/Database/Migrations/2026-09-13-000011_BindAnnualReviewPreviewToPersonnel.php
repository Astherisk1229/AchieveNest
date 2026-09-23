<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

class BindAnnualReviewPreviewToPersonnel extends Migration
{
    public function up()
    {
        if ($this->db->DBDriver !== 'MySQLi') {
            throw new RuntimeException('Annual-review import migration requires canonical MySQL.');
        }
        if (! $this->db->tableExists('personnel_annual_review_imports')
            || $this->db->fieldExists('expected_personnel_profile_id', 'personnel_annual_review_imports')) {
            return;
        }

        $this->forge->addColumn('personnel_annual_review_imports', [
            'expected_personnel_profile_id' => [
                'type' => 'VARCHAR',
                'constraint' => 64,
                'null' => true,
                'after' => 'personnel_profile_id',
            ],
        ]);
        $this->db->query(
            'CREATE INDEX idx_annual_review_expected_personnel ON personnel_annual_review_imports (expected_personnel_profile_id, evaluation_period_id)'
        );
    }

    public function down()
    {
        throw new RuntimeException('Forward-only canonical migration.');
    }
}
