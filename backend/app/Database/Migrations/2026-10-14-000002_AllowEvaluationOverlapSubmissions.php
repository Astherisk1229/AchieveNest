<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Allow evaluation to run while submissions are still open.
 *
 * This migration must sort after the latest applied App migration. Otherwise
 * CodeIgniter's timestamp runner leaves the constraint change pending.
 */
class AllowEvaluationOverlapSubmissions extends Migration
{
    public function up()
    {
        if (! $this->db->tableExists('personnel_evaluation_periods')) return;
        try { $this->db->query('ALTER TABLE personnel_evaluation_periods DROP CHECK ck_personnel_period_evaluation_dates'); } catch (\Throwable $e) {}
        $this->db->query('ALTER TABLE personnel_evaluation_periods ADD CONSTRAINT ck_personnel_period_evaluation_dates CHECK (evaluation_start_at >= submission_open_at AND evaluation_start_at < evaluation_end_at)');
    }

    public function down()
    {
        if (! $this->db->tableExists('personnel_evaluation_periods')) return;
        try { $this->db->query('ALTER TABLE personnel_evaluation_periods DROP CHECK ck_personnel_period_evaluation_dates'); } catch (\Throwable $e) {}
        $this->db->query('ALTER TABLE personnel_evaluation_periods ADD CONSTRAINT ck_personnel_period_evaluation_dates CHECK (evaluation_start_at >= submission_close_at AND evaluation_start_at < evaluation_end_at)');
    }
}
