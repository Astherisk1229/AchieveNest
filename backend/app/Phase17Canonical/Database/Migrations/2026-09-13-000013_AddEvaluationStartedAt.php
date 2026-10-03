<?php
namespace Phase17Canonical\Database\Migrations;
use CodeIgniter\Database\Migration;
use RuntimeException;
final class AddEvaluationStartedAt extends Migration
{
    public function up() { if($this->db->DBDriver!=='MySQLi')throw new RuntimeException('Canonical MySQL required.'); if(!$this->db->fieldExists('evaluation_started_at','personnel_evaluations'))$this->forge->addColumn('personnel_evaluations',['evaluation_started_at'=>['type'=>'DATETIME','null'=>true,'after'=>'submitted_at']]); }
    public function down(){throw new RuntimeException('Forward-only canonical migration.');}
}
