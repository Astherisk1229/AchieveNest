<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;
use App\Services\CanonicalMigrationTargetGuard;
use RuntimeException;

/** Durable recalculation work and event history for criteria-version activation. */
final class CreateEvaluationCriteriaRecalculationQueue extends Migration
{
    public function up(): void
    {
        if ($this->db->DBDriver !== 'MySQLi') throw new RuntimeException('Evaluation criteria migrations require MySQLi.');
        CanonicalMigrationTargetGuard::assertAllowed($this->db, 'create evaluation criteria recalculation queue');
        foreach (['personnel_evaluations','personnel_evaluation_periods','evaluation_scale_versions'] as $table) {
            if (! $this->db->tableExists($table)) throw new RuntimeException("Required table {$table} does not exist.");
        }

        if (! $this->db->tableExists('evaluation_criteria_recalculation_jobs')) {
            $this->forge->addField([
                'id'=>['type'=>'VARCHAR','constraint'=>36],
                'evaluation_id'=>['type'=>'VARCHAR','constraint'=>36],
                'source_version_id'=>['type'=>'VARCHAR','constraint'=>64],
                'target_version_id'=>['type'=>'VARCHAR','constraint'=>64],
                'status'=>['type'=>'VARCHAR','constraint'=>32,'default'=>'pending'],
                'reconfirmation_status'=>['type'=>'VARCHAR','constraint'=>32,'default'=>'not_required'],
                'required_reviewer_profile_id'=>['type'=>'VARCHAR','constraint'=>36,'null'=>true],
                'reconfirmed_by_profile_id'=>['type'=>'VARCHAR','constraint'=>36,'null'=>true],
                'reconfirmed_at'=>['type'=>'DATETIME','null'=>true],
                'attempt_count'=>['type'=>'SMALLINT','default'=>0],
                'last_error_code'=>['type'=>'VARCHAR','constraint'=>100,'null'=>true],
                'last_error_message'=>['type'=>'TEXT','null'=>true],
                'previous_result_snapshot'=>['type'=>'JSON','null'=>true],
                'result_snapshot'=>['type'=>'JSON','null'=>true],
                'created_at'=>['type'=>'DATETIME','null'=>false],
                'updated_at'=>['type'=>'DATETIME','null'=>false],
                'started_at'=>['type'=>'DATETIME','null'=>true],
                'completed_at'=>['type'=>'DATETIME','null'=>true],
            ]);
            $this->forge->addKey('id', true);
            $this->forge->addUniqueKey(['evaluation_id','target_version_id'],'uq_criteria_recalc_eval_target');
            $this->forge->addKey(['status','created_at'],false,false,'idx_criteria_recalc_status_created');
            $this->forge->addKey(['evaluation_id','created_at'],false,false,'idx_criteria_recalc_eval_created');
            $this->forge->createTable('evaluation_criteria_recalculation_jobs');
        }

        if (! $this->db->tableExists('evaluation_criteria_recalculation_events')) {
            $this->forge->addField([
                'id'=>['type'=>'VARCHAR','constraint'=>36],
                'job_id'=>['type'=>'VARCHAR','constraint'=>36],
                'evaluation_id'=>['type'=>'VARCHAR','constraint'=>36],
                'event_type'=>['type'=>'VARCHAR','constraint'=>48],
                'actor_profile_id'=>['type'=>'VARCHAR','constraint'=>36,'null'=>true],
                'details'=>['type'=>'JSON','null'=>true],
                'created_at'=>['type'=>'DATETIME','null'=>false],
            ]);
            $this->forge->addKey('id',true);
            $this->forge->addKey(['job_id','created_at'],false,false,'idx_criteria_recalc_events_job');
            $this->forge->createTable('evaluation_criteria_recalculation_events');
        }

        foreach (['id','evaluation_id','source_version_id','target_version_id','status','reconfirmation_status','previous_result_snapshot','result_snapshot'] as $field) {
            if (! $this->db->fieldExists($field,'evaluation_criteria_recalculation_jobs')) throw new RuntimeException("Criteria recalculation job schema is incomplete: {$field}.");
        }
        foreach (['id','job_id','evaluation_id','event_type','details'] as $field) {
            if (! $this->db->fieldExists($field,'evaluation_criteria_recalculation_events')) throw new RuntimeException("Criteria recalculation event schema is incomplete: {$field}.");
        }
    }

    public function down(): void
    {
        throw new RuntimeException('Refusing to drop durable criteria recalculation jobs and audit history.');
    }
}
