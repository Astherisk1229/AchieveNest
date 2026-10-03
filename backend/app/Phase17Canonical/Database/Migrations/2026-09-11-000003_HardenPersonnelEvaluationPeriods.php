<?php

namespace Phase17Canonical\Database\Migrations;

use RuntimeException;

require_once APPPATH . 'Database/Migrations/2026-09-11-000003_HardenPersonnelEvaluationPeriods.php';

class HardenPersonnelEvaluationPeriods extends \App\Database\Migrations\HardenPersonnelEvaluationPeriods
{
    public function up()
    {
        if ($this->db->DBDriver !== 'MySQLi') throw new RuntimeException('Canonical evaluation-period hardening requires MySQLi.');
        $this->db->resetDataCache();
        foreach (['personnel_evaluation_periods', 'personnel_evaluation_period_events'] as $table) {
            if (! $this->db->tableExists($table)) throw new RuntimeException("Required {$table} table is missing.");
        }
        parent::up();
        $this->db->resetDataCache();
        foreach (['version', 'coverage_identity'] as $field) {
            if (! $this->db->fieldExists($field, 'personnel_evaluation_periods')) throw new RuntimeException("Evaluation-period hardening failed to create {$field}.");
        }
        if (! $this->db->fieldExists('request_id', 'personnel_evaluation_period_events') || ! $this->db->tableExists('personnel_evaluation_idempotency')) {
            throw new RuntimeException('Evaluation-period hardening is incomplete.');
        }
    }
}
