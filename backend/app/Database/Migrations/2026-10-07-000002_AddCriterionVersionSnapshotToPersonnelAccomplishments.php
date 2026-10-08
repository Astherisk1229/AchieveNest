<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Stores the HR criterion identity and immutable rule snapshot on new accomplishments. */
class AddCriterionVersionSnapshotToPersonnelAccomplishments extends Migration
{
    public function up()
    {
        $table = 'personnel_accomplishments';
        if (! $this->db->tableExists($table)) return;

        $columns = [
            'criterion_id' => ['type' => 'VARCHAR', 'constraint' => 64, 'null' => true],
            'evaluation_scale_version_id' => ['type' => 'VARCHAR', 'constraint' => 64, 'null' => true],
            'criterion_snapshot' => ['type' => 'JSON', 'null' => true],
        ];
        foreach ($columns as $name => $definition) {
            if (! $this->db->fieldExists($name, $table)) $this->forge->addColumn($table, [$name => $definition]);
        }

        $hasIndex = false;
        foreach ($this->db->getIndexData($table) as $index) {
            if (($index->name ?? '') === 'idx_personnel_accomplishment_criterion_version') $hasIndex = true;
        }
        if (! $hasIndex) {
            $this->forge->addKey(['evaluation_scale_version_id', 'criterion_id'], false, false, 'idx_personnel_accomplishment_criterion_version');
            $this->forge->processIndexes($table);
        }
    }

    public function down()
    {
        $table = 'personnel_accomplishments';
        if ($this->db->tableExists($table)) {
            foreach ($this->db->getIndexData($table) as $index) {
                if (($index->name ?? '') === 'idx_personnel_accomplishment_criterion_version') {
                    $this->forge->dropKey($table, 'idx_personnel_accomplishment_criterion_version');
                    break;
                }
            }
        }
        foreach (['criterion_snapshot', 'evaluation_scale_version_id', 'criterion_id'] as $field) {
            if ($this->db->tableExists($table) && $this->db->fieldExists($field, $table)) $this->forge->dropColumn($table, $field);
        }
    }
}
