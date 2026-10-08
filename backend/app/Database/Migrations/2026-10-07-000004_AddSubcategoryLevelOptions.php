<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Adds an optional subcategory owner to the existing versioned criteria options table. */
class AddSubcategoryLevelOptions extends Migration
{
    public function up()
    {
        foreach (['evaluation_scale_categories', 'evaluation_scale_subcategories'] as $table) {
            if ($this->db->tableExists($table) && ! $this->db->fieldExists('is_active', $table)) {
                $this->forge->addColumn($table, [
                    'is_active' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 1],
                ]);
            }
        }
        if ($this->db->tableExists('evaluation_scale_criterion_options')
            && ! $this->db->fieldExists('scale_subcategory_id', 'evaluation_scale_criterion_options')) {
            $this->forge->addColumn('evaluation_scale_criterion_options', [
                'scale_subcategory_id' => ['type' => 'VARCHAR', 'constraint' => 64, 'null' => true],
            ]);
            $this->db->query('CREATE INDEX idx_esco_subcategory_group ON evaluation_scale_criterion_options (scale_subcategory_id, option_group_code)');
        }
        if ($this->db->tableExists('evaluation_scale_criterion_options') && ! $this->db->fieldExists('is_active', 'evaluation_scale_criterion_options')) {
            $this->forge->addColumn('evaluation_scale_criterion_options', [
                'is_active' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 1],
            ]);
        }
    }

    public function down()
    {
        if ($this->db->tableExists('evaluation_scale_criterion_options')) {
            if ($this->db->fieldExists('scale_subcategory_id', 'evaluation_scale_criterion_options')) {
                $this->db->query('DROP INDEX idx_esco_subcategory_group ON evaluation_scale_criterion_options');
                $this->forge->dropColumn('evaluation_scale_criterion_options', 'scale_subcategory_id');
            }
            if ($this->db->fieldExists('is_active', 'evaluation_scale_criterion_options')) $this->forge->dropColumn('evaluation_scale_criterion_options', 'is_active');
        }
        foreach (['evaluation_scale_subcategories', 'evaluation_scale_categories'] as $table) {
            if ($this->db->tableExists($table) && $this->db->fieldExists('is_active', $table)) $this->forge->dropColumn($table, 'is_active');
        }
    }
}
