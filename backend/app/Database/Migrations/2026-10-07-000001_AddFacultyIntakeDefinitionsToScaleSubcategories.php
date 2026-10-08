<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Adds an HR-authored, versioned intake contract to the scale's selectable leaf rows. */
class AddFacultyIntakeDefinitionsToScaleSubcategories extends Migration
{
    public function up()
    {
        $table = 'evaluation_scale_subcategories';
        $columns = [
            'intake_active' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 1],
            'intake_mode' => ['type' => 'VARCHAR', 'constraint' => 16, 'default' => 'FORM'],
            'field_schema' => ['type' => 'JSON', 'null' => true],
            'evidence_rules' => ['type' => 'JSON', 'null' => true],
            'scoring_rule_reference' => ['type' => 'TEXT', 'null' => true],
        ];

        foreach ($columns as $name => $definition) {
            if (! $this->db->fieldExists($name, $table)) {
                $this->forge->addColumn($table, [$name => $definition]);
            }
        }
    }

    public function down()
    {
        $table = 'evaluation_scale_subcategories';
        foreach (['scoring_rule_reference', 'evidence_rules', 'field_schema', 'intake_mode', 'intake_active'] as $name) {
            if ($this->db->fieldExists($name, $table)) {
                $this->forge->dropColumn($table, $name);
            }
        }
    }
}
