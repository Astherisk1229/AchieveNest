<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

class AddCriterionCodeToPersonnelEvaluationItems extends Migration
{
    public function up()
    {
        if ($this->db->DBDriver !== 'MySQLi') throw new RuntimeException('Canonical criterion-code compatibility requires MySQLi.');
        $this->db->resetDataCache();
        if (! $this->db->tableExists('personnel_evaluation_items')) throw new RuntimeException('Required personnel_evaluation_items table is missing.');
        if (! $this->db->fieldExists('category_area', 'personnel_evaluation_items')) {
            $this->forge->addColumn('personnel_evaluation_items', ['category_area'=>['type'=>'VARCHAR','constraint'=>50,'null'=>true,'after'=>'created_at']]);
        }
        if (! $this->db->fieldExists('criterion_code', 'personnel_evaluation_items')) {
            $this->forge->addColumn('personnel_evaluation_items', ['criterion_code'=>['type'=>'VARCHAR','constraint'=>50,'null'=>true,'after'=>'category_area']]);
        }
        $this->db->resetDataCache();
        foreach ($this->db->getFieldData('personnel_evaluation_items') as $field) {
            if ($field->name === 'criterion_code' && strtolower($field->type) === 'varchar' && (int)$field->max_length === 50 && (bool)$field->nullable) return;
        }
        throw new RuntimeException('Existing personnel_evaluation_items.criterion_code is incompatible.');
    }

    public function down()
    {
        if ($this->db->fieldExists('criterion_code','personnel_evaluation_items')) $this->forge->dropColumn('personnel_evaluation_items','criterion_code');
    }
}
