<?php

namespace Phase17Canonical\Database\Migrations;

use RuntimeException;

require_once APPPATH . 'Database/Migrations/2026-09-12-000005_AddEvaluationScaleVersionGovernance.php';

class AddEvaluationScaleVersionGovernance extends \App\Database\Migrations\AddEvaluationScaleVersionGovernance
{
    public function up()
    {
        if ($this->db->DBDriver !== 'MySQLi') throw new RuntimeException('Canonical evaluation-scale governance requires MySQLi.');
        $this->db->resetDataCache();
        if (! $this->db->tableExists('evaluation_scale_versions')) throw new RuntimeException('Required evaluation_scale_versions table is missing.');
        parent::up();
        $this->db->resetDataCache();
        foreach (['change_reason','change_summary','source_type','created_by_user_id'] as $field) {
            if (! $this->db->fieldExists($field, 'evaluation_scale_versions')) throw new RuntimeException("Evaluation-scale governance failed to create {$field}.");
        }
        foreach (['ver-admin-2025-001','ver-ntp-2025-001'] as $id) {
            $row = $this->db->table('evaluation_scale_versions')->select('source_type')->where('id', $id)->get()->getRowArray();
            if (($row['source_type'] ?? null) !== 'SEEDED_OFFICIAL_SOURCE') throw new RuntimeException("Evaluation-scale governance is incompatible for {$id}.");
        }
    }
}
