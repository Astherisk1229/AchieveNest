<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddDeanAssignmentEndMetadata extends Migration
{
    public function up(): void
    {
        $columns = [];
        if (! $this->db->fieldExists('ended_by', 'dean_assignments')) $columns['ended_by'] = ['type' => 'CHAR', 'constraint' => 36, 'null' => true, 'after' => 'assigned_at'];
        if (! $this->db->fieldExists('ended_at', 'dean_assignments')) $columns['ended_at'] = ['type' => 'DATETIME', 'null' => true, 'after' => 'ended_by'];
        if (! $this->db->fieldExists('end_reason', 'dean_assignments')) $columns['end_reason'] = ['type' => 'TEXT', 'null' => true, 'after' => 'ended_at'];
        if ($columns !== []) $this->forge->addColumn('dean_assignments', $columns);
    }

    public function down(): void
    {
        foreach (['end_reason', 'ended_at', 'ended_by'] as $column) {
            if ($this->db->fieldExists($column, 'dean_assignments')) $this->forge->dropColumn('dean_assignments', $column);
        }
    }
}
