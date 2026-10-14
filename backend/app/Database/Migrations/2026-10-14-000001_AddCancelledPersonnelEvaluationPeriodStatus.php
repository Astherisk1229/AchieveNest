<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

class AddCancelledPersonnelEvaluationPeriodStatus extends Migration
{
    public function up()
    {
        if (! $this->db->tableExists('personnel_evaluation_periods')) return;
        $this->db->query("ALTER TABLE personnel_evaluation_periods MODIFY status ENUM('DRAFT','OPEN_FOR_SUBMISSION','SUBMISSION_CLOSED','EVALUATION_ONGOING','CLOSED','ARCHIVED','CANCELLED') NOT NULL DEFAULT 'DRAFT'");
    }

    public function down()
    {
        if (! $this->db->tableExists('personnel_evaluation_periods')) return;
        if ($this->db->table('personnel_evaluation_periods')->where('status', 'CANCELLED')->countAllResults() > 0) {
            throw new RuntimeException('Cannot remove CANCELLED status while cancelled personnel evaluation periods exist.');
        }
        $this->db->query("ALTER TABLE personnel_evaluation_periods MODIFY status ENUM('DRAFT','OPEN_FOR_SUBMISSION','SUBMISSION_CLOSED','EVALUATION_ONGOING','CLOSED','ARCHIVED') NOT NULL DEFAULT 'DRAFT'");
    }
}
