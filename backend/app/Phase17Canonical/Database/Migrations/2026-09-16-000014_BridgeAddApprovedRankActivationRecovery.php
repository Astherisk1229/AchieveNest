<?php
namespace Phase17Canonical\Database\Migrations;
use CodeIgniter\Database\Migration;
class BridgeAddApprovedRankActivationRecovery extends Migration
{
    use September15BridgeGuard;

public function up()
    {
        $this->assertBridgeStep(14);
  foreach(['activation_failure_code'=>'VARCHAR(100) NULL','activation_failure_reason'=>'TEXT NULL','last_activation_attempt_at'=>'DATETIME NULL','recovery_reason'=>'TEXT NULL']as$c=>$sql)if(!$this->db->fieldExists($c,'personnel_approved_rank_records'))$this->db->query("ALTER TABLE personnel_approved_rank_records ADD COLUMN {$c} {$sql}");
  $this->db->query('ALTER TABLE personnel_approved_rank_records DROP CHECK chk_approved_rank_status');
  $this->db->query("ALTER TABLE personnel_approved_rank_records ADD CONSTRAINT chk_approved_rank_status CHECK(status IN('approved_pending_effectivity','activation_failed','active','correction_pending','cancellation_pending','corrected','cancelled'))");
  $this->db->query('ALTER TABLE personnel_approved_rank_records DROP INDEX uq_approved_rank_pending_personnel');
  $this->db->query('ALTER TABLE personnel_approved_rank_records DROP COLUMN pending_personnel_guard');
  $this->db->query("ALTER TABLE personnel_approved_rank_records ADD COLUMN pending_personnel_guard VARCHAR(36) GENERATED ALWAYS AS (CASE WHEN status IN('approved_pending_effectivity','activation_failed','correction_pending','cancellation_pending') THEN personnel_profile_id ELSE NULL END) STORED");
  $this->db->query('ALTER TABLE personnel_approved_rank_records ADD UNIQUE KEY uq_approved_rank_pending_personnel (pending_personnel_guard)');
  $this->db->query('ALTER TABLE personnel_approved_rank_events DROP CHECK chk_approved_rank_event_type');
  $this->db->query('ALTER TABLE personnel_approved_rank_events MODIFY performed_by_profile_id VARCHAR(36) NULL');
  if(!$this->db->fieldExists('actor_context','personnel_approved_rank_events'))$this->db->query("ALTER TABLE personnel_approved_rank_events ADD COLUMN actor_context VARCHAR(30) NOT NULL DEFAULT 'authenticated_hr'");
  $this->db->query("ALTER TABLE personnel_approved_rank_events ADD CONSTRAINT chk_approved_rank_event_type CHECK(event_type IN('recorded_pending_effectivity','recorded_and_activated','activation_attempted','activation_failed','activation_succeeded','retry_attempted','retry_succeeded','correction_requested','cancellation_requested'))");
  $this->db->query("CREATE TABLE IF NOT EXISTS personnel_rank_activation_attempts(id VARCHAR(36) PRIMARY KEY,approved_rank_record_id VARCHAR(36) NOT NULL,attempt_number INT UNSIGNED NOT NULL,trigger_type VARCHAR(20) NOT NULL,actor_context VARCHAR(30) NOT NULL,performed_by_profile_id VARCHAR(36) NULL,outcome VARCHAR(20) NOT NULL,failure_code VARCHAR(100) NULL,failure_reason TEXT NULL,attempted_at DATETIME NOT NULL,UNIQUE KEY uq_rank_activation_attempt_number(approved_rank_record_id,attempt_number),INDEX idx_rank_activation_attempts(approved_rank_record_id,attempted_at),CONSTRAINT fk_rank_activation_attempt_record FOREIGN KEY(approved_rank_record_id) REFERENCES personnel_approved_rank_records(id),CONSTRAINT fk_rank_activation_attempt_actor FOREIGN KEY(performed_by_profile_id) REFERENCES profiles(id),CONSTRAINT chk_rank_activation_trigger CHECK(trigger_type IN('automatic','manual_retry')),CONSTRAINT chk_rank_activation_outcome CHECK(outcome IN('succeeded','failed'))) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
 }
 }
