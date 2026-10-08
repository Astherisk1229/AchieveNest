<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Allows official Faculty categories without leaf rows to expose a versioned manual intake entry. */
class AddCategoryLevelFacultyIntakeDefinitions extends Migration
{
    public function up()
    {
        $table = 'evaluation_scale_categories';
        $columns = [
            'intake_active' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 0],
            'intake_mode' => ['type' => 'VARCHAR', 'constraint' => 16, 'default' => 'MANUAL_HR'],
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
        $table = 'evaluation_scale_categories';
        foreach (['scoring_rule_reference', 'evidence_rules', 'field_schema', 'intake_mode', 'intake_active'] as $name) {
            if ($this->db->fieldExists($name, $table)) {
                $this->forge->dropColumn($table, $name);
            }
        }
    }
}
