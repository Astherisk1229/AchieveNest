<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AlignPersonnelEvaluationStatusConstraint extends Migration
{
    private const STATUSES = "'draft','submitted','in_evaluation','ready_for_finalization','returned_for_revision','completed','in_progress','under_review','revision_requested','finalized'";

    public function up()
    {
        if (! $this->db->tableExists('personnel_evaluations')) return;

        if ($this->db->DBDriver === 'Postgre') {
            $this->db->query('ALTER TABLE public.personnel_evaluations DROP CONSTRAINT IF EXISTS ck_evaluations_status');
            $this->db->query('ALTER TABLE public.personnel_evaluations ADD CONSTRAINT ck_evaluations_status CHECK (status IN (' . self::STATUSES . '))');
            return;
        }

        $this->db->query('ALTER TABLE personnel_evaluations DROP CHECK ck_evaluations_status');
        $this->db->query('ALTER TABLE personnel_evaluations ADD CONSTRAINT ck_evaluations_status CHECK (status IN (' . self::STATUSES . '))');
    }

    public function down()
    {
        if (! $this->db->tableExists('personnel_evaluations')) return;

        if ($this->db->DBDriver === 'Postgre') {
            $this->db->query('ALTER TABLE public.personnel_evaluations DROP CONSTRAINT IF EXISTS ck_evaluations_status');
            $this->db->query("ALTER TABLE public.personnel_evaluations ADD CONSTRAINT ck_evaluations_status CHECK (status IN ('draft','in_progress','under_review','revision_requested','ready_for_finalization','finalized'))");
            return;
        }

        $this->db->query('ALTER TABLE personnel_evaluations DROP CHECK ck_evaluations_status');
        $this->db->query("ALTER TABLE personnel_evaluations ADD CONSTRAINT ck_evaluations_status CHECK (status IN ('draft','in_progress','under_review','revision_requested','ready_for_finalization','finalized'))");
    }
}
