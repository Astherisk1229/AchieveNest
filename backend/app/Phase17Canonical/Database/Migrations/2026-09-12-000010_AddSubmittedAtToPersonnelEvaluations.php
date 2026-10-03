<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

final class AddSubmittedAtToPersonnelEvaluations extends Migration
{
    public function up()
    {
        if ($this->db->DBDriver !== 'MySQLi') {
            throw new RuntimeException('Canonical submitted-at compatibility requires MySQLi.');
        }

        $this->db->resetDataCache();

        if (! $this->db->tableExists('personnel_evaluations')) {
            throw new RuntimeException('Required personnel_evaluations table is missing.');
        }

        if (! $this->db->fieldExists('submitted_at', 'personnel_evaluations')) {
            $this->forge->addColumn('personnel_evaluations', [
                'submitted_at' => [
                    'type'       => 'DATETIME',
                    'constraint' => 6,
                    'null'       => true,
                    'default'    => null,
                    'after'      => 'updated_at',
                ],
            ]);
        }

        $column = $this->db->table('information_schema.COLUMNS')
            ->select('DATA_TYPE, DATETIME_PRECISION, IS_NULLABLE, COLUMN_DEFAULT')
            ->where('TABLE_SCHEMA', $this->db->database)
            ->where('TABLE_NAME', 'personnel_evaluations')
            ->where('COLUMN_NAME', 'submitted_at')
            ->get()
            ->getRowArray();

        if (
            $column === null
            || strtolower((string) $column['DATA_TYPE']) !== 'datetime'
            || (int) $column['DATETIME_PRECISION'] !== 6
            || strtoupper((string) $column['IS_NULLABLE']) !== 'YES'
            || $column['COLUMN_DEFAULT'] !== null
        ) {
            throw new RuntimeException('Existing personnel_evaluations.submitted_at is incompatible.');
        }
    }

    public function down()
    {
        $this->db->resetDataCache();

        if (
            $this->db->tableExists('personnel_evaluations')
            && $this->db->fieldExists('submitted_at', 'personnel_evaluations')
        ) {
            $this->forge->dropColumn('personnel_evaluations', 'submitted_at');
        }
    }
}
