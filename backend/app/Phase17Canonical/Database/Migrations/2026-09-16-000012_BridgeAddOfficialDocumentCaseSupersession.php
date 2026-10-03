<?php
namespace Phase17Canonical\Database\Migrations;
use CodeIgniter\Database\Migration;

class BridgeAddOfficialDocumentCaseSupersession extends Migration
{
    use September15BridgeGuard;

public function up()
    {
        $this->assertBridgeStep(12);
        if(!$this->db->fieldExists('evaluation_root_id','personnel_official_evaluation_documents')){
            $this->db->query("ALTER TABLE personnel_official_evaluation_documents ADD COLUMN evaluation_root_id VARCHAR(64) NULL AFTER evaluation_id");
            $this->db->query("CREATE INDEX idx_official_eval_document_case ON personnel_official_evaluation_documents (personnel_profile_id,ranking_cycle_id,ranking_track_id,evaluation_root_id,document_type,status,evaluation_version)");
        }
    }
    }
