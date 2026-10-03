<?php
namespace App\Database\Migrations;
use CodeIgniter\Database\Migration;

class AddOfficialDocumentCaseSupersession extends Migration
{
    public function up()
    {
        if(!$this->db->fieldExists('evaluation_root_id','personnel_official_evaluation_documents')){
            $this->db->query("ALTER TABLE personnel_official_evaluation_documents ADD COLUMN evaluation_root_id VARCHAR(64) NULL AFTER evaluation_id");
            $this->db->query("CREATE INDEX idx_official_eval_document_case ON personnel_official_evaluation_documents (personnel_profile_id,ranking_cycle_id,ranking_track_id,evaluation_root_id,document_type,status,evaluation_version)");
        }
    }
    public function down(){if($this->db->fieldExists('evaluation_root_id','personnel_official_evaluation_documents')){$this->db->query('DROP INDEX idx_official_eval_document_case ON personnel_official_evaluation_documents');$this->forge->dropColumn('personnel_official_evaluation_documents','evaluation_root_id');}}
}
