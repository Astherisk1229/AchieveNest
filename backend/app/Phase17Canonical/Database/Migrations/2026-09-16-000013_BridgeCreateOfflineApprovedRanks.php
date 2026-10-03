<?php
namespace Phase17Canonical\Database\Migrations;
use CodeIgniter\Database\Migration;
class BridgeCreateOfflineApprovedRanks extends Migration
{
    use September15BridgeGuard;

public function up()
    {
        $this->assertBridgeStep(13);
  $this->db->query("CREATE TABLE IF NOT EXISTS personnel_approved_rank_records (
   id VARCHAR(36) PRIMARY KEY,hr_final_rank_review_id VARCHAR(36) NOT NULL,official_document_id VARCHAR(36) NOT NULL,personnel_profile_id VARCHAR(36) NOT NULL,
   ranking_cycle_id VARCHAR(36) NOT NULL,ranking_track_id VARCHAR(36) NOT NULL,evaluation_id VARCHAR(36) NOT NULL,evaluation_version INT UNSIGNED NOT NULL,
   approved_rank_code VARCHAR(100) NOT NULL,previous_rank_code_snapshot VARCHAR(100) NOT NULL,approval_date DATE NOT NULL,effectivity_date DATE NOT NULL,
   status VARCHAR(40) NOT NULL,signed_document_storage_path TEXT NOT NULL,signed_document_original_name VARCHAR(255) NOT NULL,signed_document_mime_type VARCHAR(100) NOT NULL,
   signed_document_sha256 CHAR(64) NOT NULL,signed_document_byte_size BIGINT UNSIGNED NOT NULL,recorded_by_profile_id VARCHAR(36) NOT NULL,recorded_at DATETIME NOT NULL,activated_at DATETIME NULL,
   pending_personnel_guard VARCHAR(36) GENERATED ALWAYS AS (CASE WHEN status='approved_pending_effectivity' THEN personnel_profile_id ELSE NULL END) STORED,
   UNIQUE KEY uq_approved_rank_case (hr_final_rank_review_id),UNIQUE KEY uq_approved_rank_pending_personnel (pending_personnel_guard),
   INDEX idx_approved_rank_personnel_effective (personnel_profile_id,effectivity_date,status),
   CONSTRAINT fk_approved_rank_review FOREIGN KEY(hr_final_rank_review_id) REFERENCES personnel_hr_final_rank_reviews(id),
   CONSTRAINT fk_approved_rank_official_document FOREIGN KEY(official_document_id) REFERENCES personnel_official_evaluation_documents(id),
   CONSTRAINT fk_approved_rank_personnel FOREIGN KEY(personnel_profile_id) REFERENCES personnel_profiles(profile_id),
   CONSTRAINT fk_approved_rank_cycle FOREIGN KEY(ranking_cycle_id) REFERENCES ranking_cycles(id),CONSTRAINT fk_approved_rank_track FOREIGN KEY(ranking_track_id) REFERENCES personnel_evaluation_periods(id),
   CONSTRAINT fk_approved_rank_evaluation FOREIGN KEY(evaluation_id) REFERENCES personnel_evaluations(id),CONSTRAINT fk_approved_rank_actor FOREIGN KEY(recorded_by_profile_id) REFERENCES profiles(id),
   CONSTRAINT chk_approved_rank_status CHECK(status IN('approved_pending_effectivity','active'))
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  $this->db->query("CREATE TABLE IF NOT EXISTS personnel_rank_history (
   id VARCHAR(36) PRIMARY KEY,approved_rank_record_id VARCHAR(36) NOT NULL,personnel_profile_id VARCHAR(36) NOT NULL,rank_code VARCHAR(100) NOT NULL,
   effective_from DATE NOT NULL,effective_to DATE NULL,status VARCHAR(20) NOT NULL,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   INDEX idx_rank_history_period(personnel_profile_id,effective_from,effective_to),UNIQUE KEY uq_rank_history_approval(approved_rank_record_id),
   CONSTRAINT fk_rank_history_approval FOREIGN KEY(approved_rank_record_id) REFERENCES personnel_approved_rank_records(id),CONSTRAINT fk_rank_history_personnel FOREIGN KEY(personnel_profile_id) REFERENCES personnel_profiles(profile_id),
   CONSTRAINT chk_rank_history_status CHECK(status IN('pending','current','historical')),CONSTRAINT chk_rank_history_dates CHECK(effective_to IS NULL OR effective_to>=effective_from)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  $this->db->query("CREATE TABLE IF NOT EXISTS personnel_approved_rank_events(id VARCHAR(36) PRIMARY KEY,approved_rank_record_id VARCHAR(36) NOT NULL,event_type VARCHAR(40) NOT NULL,performed_by_profile_id VARCHAR(36) NOT NULL,event_payload JSON NULL,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,INDEX idx_approved_rank_events(approved_rank_record_id,created_at),CONSTRAINT fk_approved_rank_event_record FOREIGN KEY(approved_rank_record_id) REFERENCES personnel_approved_rank_records(id),CONSTRAINT fk_approved_rank_event_actor FOREIGN KEY(performed_by_profile_id) REFERENCES profiles(id),CONSTRAINT chk_approved_rank_event_type CHECK(event_type IN('recorded_pending_effectivity','recorded_and_activated'))) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
 }
 }
