<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddCanonicalClassificationToPersonnelAccomplishments extends Migration
{
    public function up()
    {
        if (! $this->db->tableExists('personnel_accomplishments')) {
            return;
        }

        $fields = [];
        if (! $this->db->fieldExists('category_code', 'personnel_accomplishments')) {
            $fields['category_code'] = ['type' => 'VARCHAR', 'constraint' => 32, 'null' => true, 'after' => 'domain'];
        }
        if (! $this->db->fieldExists('category_area', 'personnel_accomplishments')) {
            $fields['category_area'] = ['type' => 'VARCHAR', 'constraint' => 16, 'null' => true, 'after' => 'category_code'];
        }
        if (! $this->db->fieldExists('category_metadata', 'personnel_accomplishments')) {
            $fields['category_metadata'] = ['type' => 'JSON', 'null' => true, 'after' => 'description'];
        }
        if ($fields !== []) {
            $this->forge->addColumn('personnel_accomplishments', $fields);
        }

        // Narrow legacy recovery: these titles unambiguously identify the official degree criterion.
        // Broader domain/title inference is intentionally prohibited.
        if ($this->db->fieldExists('category_code', 'personnel_accomplishments')) {
            $this->db->query(
                "UPDATE personnel_accomplishments
                 SET category_code = 'A.1', category_area = 'areaA'
                 WHERE category_code IS NULL
                   AND (title LIKE 'Doctor of Philosophy%' OR title LIKE 'Ph.D.%')"
            );
        }

        // Existing broad-domain rows cannot be safely assigned an official criterion.
        // Remove legacy pre-Dean self-scores while leaving their factual records intact.
        if ($this->db->fieldExists('claimed_points', 'personnel_accomplishments')) {
            $this->forge->modifyColumn('personnel_accomplishments', [
                'claimed_points' => ['type' => 'DECIMAL', 'constraint' => '10,2', 'null' => true, 'default' => null],
            ]);
            $this->db->table('personnel_accomplishments')->set('claimed_points', null)->update();
        }

        if ($this->db->tableExists('personnel_evaluation_items')) {
            $scoreColumns = [];
            foreach (['claimed_points', 'verified_points', 'raw_points', 'criterion_capped_points', 'awarded_points', 'max_allowed_points', 'accepted_points'] as $column) {
                if ($this->db->fieldExists($column, 'personnel_evaluation_items')) {
                    $scoreColumns[$column] = ['type' => 'DECIMAL', 'constraint' => '10,2', 'null' => true, 'default' => null];
                }
            }
            if ($scoreColumns !== []) {
                $this->forge->modifyColumn('personnel_evaluation_items', $scoreColumns);
                $builder = $this->db->table('personnel_evaluation_items');
                if ($this->db->fieldExists('accepted_points', 'personnel_evaluation_items')) {
                    $builder->where('accepted_points', null);
                }
                foreach (array_keys($scoreColumns) as $column) $builder->set($column, null);
                $builder->update();
            }
        }
    }

    public function down()
    {
        foreach (['category_metadata', 'category_area', 'category_code'] as $field) {
            if ($this->db->fieldExists($field, 'personnel_accomplishments')) {
                $this->forge->dropColumn('personnel_accomplishments', $field);
            }
        }
    }
}
