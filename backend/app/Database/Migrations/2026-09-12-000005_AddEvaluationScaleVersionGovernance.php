<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddEvaluationScaleVersionGovernance extends Migration
{
    public function up()
    {
        $fields = [
            'change_reason' => ['type'=>'TEXT', 'null'=>true, 'after'=>'effective_end_date'],
            'change_summary' => ['type'=>'TEXT', 'null'=>true, 'after'=>'change_reason'],
            'source_type' => ['type'=>'VARCHAR', 'constraint'=>32, 'null'=>true, 'after'=>'change_summary'],
            'created_by_user_id' => ['type'=>'VARCHAR', 'constraint'=>64, 'null'=>true, 'after'=>'source_document_ref'],
        ];
        foreach ($fields as $name => $definition) if (! $this->db->fieldExists($name, 'evaluation_scale_versions')) $this->forge->addColumn('evaluation_scale_versions', [$name=>$definition]);
        $this->db->table('evaluation_scale_versions')->where('id', 'ver-admin-2025-001')->update(['source_type'=>'SEEDED_OFFICIAL_SOURCE', 'change_reason'=>'Initial official criteria import', 'change_summary'=>'Structured from the official Administrators Ranking Scale source document.']);
        $this->db->table('evaluation_scale_versions')->where('id', 'ver-ntp-2025-001')->update(['source_type'=>'SEEDED_OFFICIAL_SOURCE', 'change_reason'=>'Initial official criteria import', 'change_summary'=>'Structured from the official Non-Teaching Personnel Ranking Scale source document.']);
    }

    public function down()
    {
        foreach (['created_by_user_id','source_type','change_summary','change_reason'] as $field) if ($this->db->fieldExists($field, 'evaluation_scale_versions')) $this->forge->dropColumn('evaluation_scale_versions', $field);
    }
}
