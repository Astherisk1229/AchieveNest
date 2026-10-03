<?php
namespace Phase17Canonical\Database\Migrations;use CodeIgniter\Database\Migration;
class BridgeAddRankCorrectionAndCancellation extends Migration
{
    use September15BridgeGuard;

public function up()
    {
        $this->assertBridgeStep(15);
 $this->db->query(
    'ALTER TABLE personnel_approved_rank_records
     ADD INDEX idx_approved_rank_review (hr_final_rank_review_id)'
);

$this->db->query(
    'ALTER TABLE personnel_approved_rank_records
     DROP INDEX uq_approved_rank_case'
);
 foreach(['source_approved_rank_record_id'=>'VARCHAR(36) NULL','record_kind'=>"VARCHAR(20) NOT NULL DEFAULT 'original'",'correction_type'=>'VARCHAR(20) NULL']as$c=>$sql)if(!$this->db->fieldExists($c,'personnel_approved_rank_records'))$this->db->query("ALTER TABLE personnel_approved_rank_records ADD COLUMN {$c} {$sql}");
 $this->db->query("ALTER TABLE personnel_approved_rank_records ADD COLUMN original_case_guard VARCHAR(36) GENERATED ALWAYS AS (CASE WHEN record_kind='original' AND status<>'cancelled' THEN hr_final_rank_review_id ELSE NULL END) STORED");$this->db->query('ALTER TABLE personnel_approved_rank_records ADD UNIQUE KEY uq_approved_rank_original_case(original_case_guard)');$this->db->query('ALTER TABLE personnel_approved_rank_records ADD INDEX idx_approved_rank_lineage(source_approved_rank_record_id)');$this->db->query('ALTER TABLE personnel_approved_rank_records ADD CONSTRAINT fk_approved_rank_source FOREIGN KEY(source_approved_rank_record_id) REFERENCES personnel_approved_rank_records(id)');
 $this->db->query('ALTER TABLE personnel_rank_history DROP CHECK chk_rank_history_status');$this->db->query("ALTER TABLE personnel_rank_history ADD CONSTRAINT chk_rank_history_status CHECK(status IN('pending','current','historical','cancelled','corrected'))");
 $this->db->query("CREATE TABLE IF NOT EXISTS personnel_rank_corrections(id VARCHAR(36) PRIMARY KEY,original_approved_rank_record_id VARCHAR(36) NOT NULL,corrected_approved_rank_record_id VARCHAR(36) NOT NULL,correction_type VARCHAR(20) NOT NULL,reason TEXT NOT NULL,document_action VARCHAR(30) NOT NULL,performed_by_profile_id VARCHAR(36) NOT NULL,completed_at DATETIME NOT NULL,UNIQUE KEY uq_rank_correction_original(original_approved_rank_record_id),UNIQUE KEY uq_rank_correction_replacement(corrected_approved_rank_record_id),CONSTRAINT fk_rank_correction_original FOREIGN KEY(original_approved_rank_record_id) REFERENCES personnel_approved_rank_records(id),CONSTRAINT fk_rank_correction_replacement FOREIGN KEY(corrected_approved_rank_record_id) REFERENCES personnel_approved_rank_records(id),CONSTRAINT fk_rank_correction_actor FOREIGN KEY(performed_by_profile_id) REFERENCES profiles(id),CONSTRAINT chk_rank_correction_type CHECK(correction_type IN('data','substantive')),CONSTRAINT chk_rank_correction_document CHECK(document_action IN('original_reused','new_document_supplied'))) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
 $this->db->query('ALTER TABLE personnel_approved_rank_events DROP CHECK chk_approved_rank_event_type');$this->db->query("ALTER TABLE personnel_approved_rank_events ADD CONSTRAINT chk_approved_rank_event_type CHECK(event_type IN('recorded_pending_effectivity','recorded_and_activated','activation_attempted','activation_failed','activation_succeeded','retry_attempted','retry_succeeded','correction_requested','cancellation_requested','correction_initiated','correction_completed','correction_document_reused','correction_document_supplied','correction_linked','replacement_pending_created','cancellation'))");
 }
 }
