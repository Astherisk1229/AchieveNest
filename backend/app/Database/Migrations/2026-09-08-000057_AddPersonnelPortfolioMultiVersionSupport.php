<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddPersonnelPortfolioMultiVersionSupport extends Migration
{
    public function up()
    {
        $db = $this->db;

        // Additive version metadata columns for Plan C Phase C4
        // Check column existence before adding to be safe across MySQL / PostgreSQL
        $fields = [
            'version_number' => [
                'type'       => 'INT',
                'default'    => 1,
                'null'       => false,
            ],
            'previous_version_id' => [
                'type'       => 'VARCHAR',
                'constraint' => '64',
                'null'       => true,
                'default'    => null,
            ],
            'evaluation_cycle_id' => [
                'type'       => 'VARCHAR',
                'constraint' => '50',
                'null'       => true,
                'default'    => null,
            ],
            'source_working_revision_id' => [
                'type'       => 'VARCHAR',
                'constraint' => '64',
                'null'       => true,
                'default'    => null,
            ],
        ];

        // Safe additive migration
        if ($db->tableExists('public.personnel_evaluations') || $db->tableExists('personnel_evaluations')) {
            $forge = \Config\Database::forge();
            $tableName = $db->tableExists('public.personnel_evaluations') ? 'public.personnel_evaluations' : 'personnel_evaluations';

            foreach ($fields as $colName => $colDef) {
                if (! $db->fieldExists($colName, $tableName)) {
                    $forge->addColumn($tableName, [$colName => $colDef]);
                }
            }
        }
    }

    public function down()
    {
        // Additive-safe: no destructive drop
    }
}
