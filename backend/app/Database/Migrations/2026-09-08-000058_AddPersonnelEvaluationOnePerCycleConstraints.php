<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Migration: AddPersonnelEvaluationOnePerCycleConstraints
 *
 * Plan C — Phase C5: One-Evaluation-Per-Cycle & Multi-Version Unique Constraints.
 */
class AddPersonnelEvaluationOnePerCycleConstraints extends Migration
{
    public function up()
    {
        $db = $this->db;
        $forge = \Config\Database::forge();

        $tableName = $db->tableExists('public.personnel_evaluations') ? 'public.personnel_evaluations' : 'personnel_evaluations';

        if ($db->tableExists($tableName)) {
            // Safe index creation
            $db->query("
                CREATE UNIQUE INDEX IF NOT EXISTS uq_personnel_eval_cycle_version
                ON {$tableName} (personnel_profile_id, academic_year, version_number)
            ");

            $db->query("
                CREATE INDEX IF NOT EXISTS idx_personnel_eval_cycle_lookup
                ON {$tableName} (personnel_profile_id, academic_year)
            ");
        }
    }

    public function down()
    {
        // Additive-safe: no destructive drop
    }
}
