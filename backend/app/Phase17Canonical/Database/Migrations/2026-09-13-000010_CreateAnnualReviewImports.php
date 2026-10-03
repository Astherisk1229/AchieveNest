<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

class CreateAnnualReviewImports extends Migration
{
    public function up()
    {
        if ($this->db->DBDriver !== 'MySQLi') throw new RuntimeException('Annual-review import migration requires canonical MySQL.');
        if ($this->db->tableExists('personnel_annual_review_imports')) return;
        $this->forge->addField([
            'id'=>['type'=>'VARCHAR','constraint'=>64], 'personnel_profile_id'=>['type'=>'VARCHAR','constraint'=>64,'null'=>true],
            'evaluation_period_id'=>['type'=>'VARCHAR','constraint'=>64], 'source'=>['type'=>'VARCHAR','constraint'=>32,'default'=>'excel_import'],
            'source_file_path'=>['type'=>'VARCHAR','constraint'=>500], 'original_filename'=>['type'=>'VARCHAR','constraint'=>255],
            'file_hash'=>['type'=>'CHAR','constraint'=>64], 'template_identifier'=>['type'=>'VARCHAR','constraint'=>100],
            'detected_personnel_name'=>['type'=>'VARCHAR','constraint'=>255], 'review_1_school_year'=>['type'=>'VARCHAR','constraint'=>16,'null'=>true],
            'review_1_rating'=>['type'=>'VARCHAR','constraint'=>32,'null'=>true], 'review_2_school_year'=>['type'=>'VARCHAR','constraint'=>16,'null'=>true],
            'review_2_rating'=>['type'=>'VARCHAR','constraint'=>32,'null'=>true], 'two_review_status'=>['type'=>'VARCHAR','constraint'=>20],
            'two_review_reason'=>['type'=>'VARCHAR','constraint'=>255,'null'=>true], 'validation_status'=>['type'=>'VARCHAR','constraint'=>32],
            'validation_issues'=>['type'=>'JSON','null'=>true], 'match_status'=>['type'=>'VARCHAR','constraint'=>20],
            'uploaded_by'=>['type'=>'VARCHAR','constraint'=>64], 'uploader_workspace'=>['type'=>'VARCHAR','constraint'=>20],
            'uploaded_at'=>['type'=>'DATETIME'], 'confirmed_at'=>['type'=>'DATETIME','null'=>true],
            'supersedes_import_id'=>['type'=>'VARCHAR','constraint'=>64,'null'=>true], 'superseded_at'=>['type'=>'DATETIME','null'=>true],
            'correction_reason'=>['type'=>'TEXT','null'=>true], 'created_at'=>['type'=>'DATETIME'], 'updated_at'=>['type'=>'DATETIME'],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey(['personnel_profile_id','evaluation_period_id','superseded_at']);
        $this->forge->addKey(['file_hash','evaluation_period_id']);
        $this->forge->createTable('personnel_annual_review_imports');
    }
    public function down() { throw new RuntimeException('Forward-only canonical migration.'); }
}
