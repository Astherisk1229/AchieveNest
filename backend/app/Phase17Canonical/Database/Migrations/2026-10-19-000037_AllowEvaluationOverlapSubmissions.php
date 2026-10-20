<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Keeps the canonical period table's schedule rule aligned with HR validation. */
class AllowEvaluationOverlapSubmissions extends Migration
{
    public function up()
    {
        if (! $this->db->tableExists('personnel_evaluation_periods')) return;
        try { $this->db->query('ALTER TABLE personnel_evaluation_periods DROP CHECK ck_personnel_period_evaluation_dates'); } catch (\Throwable $error) {}
        $this->db->query('ALTER TABLE personnel_evaluation_periods ADD CONSTRAINT ck_personnel_period_evaluation_dates CHECK (evaluation_start_at >= submission_open_at AND evaluation_start_at < evaluation_end_at)');
    }

    public function down()
    {
        if (! $this->db->tableExists('personnel_evaluation_periods')) return;
        try { $this->db->query('ALTER TABLE personnel_evaluation_periods DROP CHECK ck_personnel_period_evaluation_dates'); } catch (\Throwable $error) {}
        $this->db->query('ALTER TABLE personnel_evaluation_periods ADD CONSTRAINT ck_personnel_period_evaluation_dates CHECK (evaluation_start_at >= submission_close_at AND evaluation_start_at < evaluation_end_at)');
    }
}
