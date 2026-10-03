<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

/** Forward-only MySQL extension for canonical Dean annual ratings. */
class ExtendAnnualReviewsForRatings extends Migration
{
    public function up()
    {
        if ($this->db->DBDriver !== 'MySQLi') throw new RuntimeException('Dean annual-review migration requires the canonical MySQL migration path.');
        if (! $this->db->tableExists('personnel_annual_reviews') || ! $this->db->tableExists('personnel_evaluations')) throw new RuntimeException('Canonical personnel review tables must exist before applying this migration.');
        try { $this->db->query('ALTER TABLE personnel_annual_reviews DROP CHECK ck_par_decision'); } catch (\Throwable $e) {}
        $this->db->query('ALTER TABLE personnel_annual_reviews MODIFY decision VARCHAR(32) NULL');
        foreach (['annual_rating'=>['type'=>'VARCHAR','constraint'=>32,'null'=>true],'review_status'=>['type'=>'VARCHAR','constraint'=>20,'null'=>true],'finalized_at'=>['type'=>'DATETIME','null'=>true],'correction_reason'=>['type'=>'TEXT','null'=>true]] as $field=>$definition) {
            if(!$this->db->fieldExists($field,'personnel_annual_reviews')) $this->forge->addColumn('personnel_annual_reviews',[$field=>$definition]);
        }
        if(!$this->db->fieldExists('eligibility_snapshot','personnel_evaluations')) $this->forge->addColumn('personnel_evaluations',['eligibility_snapshot'=>['type'=>'JSON','null'=>true]]);
    }
    public function down() { throw new RuntimeException('Forward-only live schema migration; rollback is intentionally disabled.'); }
}
