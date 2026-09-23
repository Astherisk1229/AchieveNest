<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddEvidenceIdToPersonnelEvaluationItems extends Migration
{
    public function up()
    {
        $db = $this->db;

        // 1. Add evidence_id to personnel_evaluation_items if not present
        if ($db->tableExists('public.personnel_evaluation_items') || $db->tableExists('personnel_evaluation_items')) {
            $tableName = $db->tableExists('public.personnel_evaluation_items') ? 'public.personnel_evaluation_items' : 'personnel_evaluation_items';

            if (! $db->fieldExists('evidence_id', $tableName)) {
                $db->query("ALTER TABLE {$tableName} ADD COLUMN evidence_id VARCHAR(64) NULL;");
                $db->query("CREATE INDEX IF NOT EXISTS idx_personnel_eval_items_evidence_id ON {$tableName}(evidence_id);");
            }
        }

        // 2. Add index on sha256 in personnel_accomplishment_evidence
        if ($db->tableExists('public.personnel_accomplishment_evidence') || $db->tableExists('personnel_accomplishment_evidence')) {
            $evTable = $db->tableExists('public.personnel_accomplishment_evidence') ? 'public.personnel_accomplishment_evidence' : 'personnel_accomplishment_evidence';
            if ($db->fieldExists('sha256', $evTable)) {
                $db->query("CREATE INDEX IF NOT EXISTS idx_personnel_evidence_sha256 ON {$evTable}(sha256);");
            }
        }
    }

    public function down()
    {
        $db = $this->db;
        $tableName = $db->tableExists('public.personnel_evaluation_items') ? 'public.personnel_evaluation_items' : 'personnel_evaluation_items';
        if ($db->fieldExists('evidence_id', $tableName)) {
            $db->query("ALTER TABLE {$tableName} DROP COLUMN IF EXISTS evidence_id;");
        }
    }
}
