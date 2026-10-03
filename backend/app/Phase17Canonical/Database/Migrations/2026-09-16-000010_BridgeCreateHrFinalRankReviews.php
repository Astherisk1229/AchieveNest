<?php
namespace Phase17Canonical\Database\Migrations;
use CodeIgniter\Database\Migration;
class BridgeCreateHrFinalRankReviews extends Migration
{
    use September15BridgeGuard;

public function up()
    {
        $this->assertBridgeStep(10);
  $this->db->query("CREATE TABLE IF NOT EXISTS personnel_hr_final_rank_reviews (
   id VARCHAR(36) PRIMARY KEY, recommended_rank_decision_id VARCHAR(36) NOT NULL, personnel_profile_id VARCHAR(36) NOT NULL,
   ranking_cycle_id VARCHAR(36) NOT NULL, ranking_track_id VARCHAR(36) NOT NULL, evaluation_id VARCHAR(36) NOT NULL, evaluation_version INT UNSIGNED NOT NULL,
   evaluator_recommended_rank_code VARCHAR(100) NOT NULL, hr_final_rank_code VARCHAR(100) NULL, action_type VARCHAR(30) NOT NULL,
   hr_justification TEXT NULL, return_reason TEXT NULL, status VARCHAR(40) NOT NULL, reviewed_by_profile_id VARCHAR(36) NOT NULL,
   reviewed_at DATETIME NOT NULL, reconsideration_evaluation_id VARCHAR(36) NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   UNIQUE KEY uq_hr_final_rank_recommended_decision (recommended_rank_decision_id),
   INDEX idx_hr_final_rank_evaluation (evaluation_id,created_at),
   CONSTRAINT fk_hr_final_recommended FOREIGN KEY (recommended_rank_decision_id) REFERENCES personnel_recommended_rank_decisions(id),
   CONSTRAINT fk_hr_final_personnel FOREIGN KEY (personnel_profile_id) REFERENCES personnel_profiles(profile_id),
   CONSTRAINT fk_hr_final_cycle FOREIGN KEY (ranking_cycle_id) REFERENCES ranking_cycles(id),
   CONSTRAINT fk_hr_final_track FOREIGN KEY (ranking_track_id) REFERENCES personnel_evaluation_periods(id),
   CONSTRAINT fk_hr_final_evaluation FOREIGN KEY (evaluation_id) REFERENCES personnel_evaluations(id),
   CONSTRAINT fk_hr_final_reconsideration FOREIGN KEY (reconsideration_evaluation_id) REFERENCES personnel_evaluations(id),
   CONSTRAINT fk_hr_final_actor FOREIGN KEY (reviewed_by_profile_id) REFERENCES profiles(id),
   CONSTRAINT chk_hr_final_action CHECK (action_type IN ('accepted','adjusted','returned_for_reconsideration')),
   CONSTRAINT chk_hr_final_status CHECK (status IN ('finalized_ready_for_printing','returned_for_reconsideration','reconsideration_started'))
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  $this->db->query("CREATE TABLE IF NOT EXISTS personnel_hr_final_rank_events (
   id VARCHAR(36) PRIMARY KEY, hr_review_id VARCHAR(36) NOT NULL, evaluation_id VARCHAR(36) NOT NULL, event_type VARCHAR(40) NOT NULL,
   performed_by_profile_id VARCHAR(36) NOT NULL, event_payload JSON NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   INDEX idx_hr_final_rank_events (hr_review_id,created_at),
   CONSTRAINT fk_hr_final_event_review FOREIGN KEY (hr_review_id) REFERENCES personnel_hr_final_rank_reviews(id),
   CONSTRAINT fk_hr_final_event_evaluation FOREIGN KEY (evaluation_id) REFERENCES personnel_evaluations(id),
   CONSTRAINT fk_hr_final_event_actor FOREIGN KEY (performed_by_profile_id) REFERENCES profiles(id),
   CONSTRAINT chk_hr_final_event_type CHECK (event_type IN ('accepted','adjusted','returned_for_reconsideration','reconsideration_version_created'))
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
 }
 }
