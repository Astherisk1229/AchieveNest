<?php

namespace Phase17Canonical\Database\Migrations;

use RuntimeException;

require_once APPPATH . 'Database/Migrations/2026-09-11-000004_AddRankingCriteriaClassification.php';

class AddRankingCriteriaClassification extends \App\Database\Migrations\AddRankingCriteriaClassification
{
    public function up()
    {
        if ($this->db->DBDriver !== 'MySQLi') throw new RuntimeException('Canonical ranking classification requires MySQLi.');
        $this->db->resetDataCache();
        foreach (['evaluation_scales', 'evaluation_scale_versions', 'evaluation_scale_areas', 'evaluation_scale_categories', 'evaluation_scale_subcategories', 'evaluation_scale_criteria', 'personnel_evaluation_periods'] as $table) {
            if (! $this->db->tableExists($table)) throw new RuntimeException("Required {$table} table is missing.");
        }
        parent::up();
        $this->db->resetDataCache();
        foreach (['personnel_group'] as $field) if (! $this->db->fieldExists($field, 'evaluation_scales')) throw new RuntimeException("Ranking classification failed to create {$field}.");
        foreach (['scoring_mode', 'requires_manual_hr_rule'] as $field) if (! $this->db->fieldExists($field, 'evaluation_scale_categories')) throw new RuntimeException("Ranking classification failed to create {$field}.");
        $this->assertIds('evaluation_scale_areas', ['area-ntp-final-a', 'area-ntp-final-b']);
        $this->assertIds('evaluation_scale_categories', ['cat-ntp-final-a1','cat-ntp-final-a2','cat-ntp-final-a3','cat-ntp-final-b1','cat-ntp-final-b2','cat-ntp-final-b3','cat-ntp-final-b4','cat-ntp-final-b5']);
    }

    private function assertIds(string $table, array $ids): void
    {
        foreach ($ids as $id) if ($this->db->table($table)->where('id', $id)->countAllResults() !== 1) throw new RuntimeException("Canonical ranking classification is missing {$table}.{$id}.");
    }
}
