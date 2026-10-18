<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Preserve evaluation snapshots while allowing personnel to remove repository entries. */
class AddPersonnelAccomplishmentSoftDelete extends Migration
{
    public function up()
    {
        $table = 'personnel_accomplishments';
        if ($this->db->tableExists($table) && ! $this->db->fieldExists('deleted_at', $table)) {
            $this->forge->addColumn($table, [
                'deleted_at' => ['type' => 'DATETIME', 'null' => true],
            ]);
        }
    }

    public function down()
    {
        $table = 'personnel_accomplishments';
        if ($this->db->tableExists($table) && $this->db->fieldExists('deleted_at', $table)) {
            $this->forge->dropColumn($table, 'deleted_at');
        }
    }
}
