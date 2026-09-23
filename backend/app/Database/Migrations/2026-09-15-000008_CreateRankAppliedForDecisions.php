<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Phase M: immutable-context Rank Applied For suggestion and reviewer confirmation. */
class CreateRankAppliedForDecisions extends Migration
{
    public function up()
    {
        $this->db->query("CREATE TABLE IF NOT EXISTS personnel_rank_applied_for_decisions (
            id VARCHAR(36) PRIMARY KEY,
            personnel_profile_id VARCHAR(36) NOT NULL,
            ranking_cycle_id VARCHAR(36) NOT NULL,
            ranking_track_id VARCHAR(36) NOT NULL,
            present_rank_code_snapshot VARCHAR(100) NOT NULL,
            present_rank_label_snapshot VARCHAR(150) NOT NULL,
            placement_id_snapshot VARCHAR(36) NOT NULL,
            placement_group_id_snapshot BIGINT UNSIGNED NOT NULL,
            verified_credential_references JSON NOT NULL,
            context_hash CHAR(64) NOT NULL,
            suggested_rank_code VARCHAR(100) NOT NULL,
            valid_rank_options JSON NOT NULL,
            suggestion_rule VARCHAR(100) NOT NULL,
            suggestion_basis VARCHAR(500) NOT NULL,
            confirmed_rank_code VARCHAR(100) NULL,
            confirmed_by_profile_id VARCHAR(36) NULL,
            confirmed_at DATETIME NULL,
            deviation_reason TEXT NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'suggested',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_rank_applied_personnel_track (personnel_profile_id, ranking_track_id, created_at),
            INDEX idx_rank_applied_status (status, created_at),
            CONSTRAINT fk_rank_applied_personnel FOREIGN KEY (personnel_profile_id) REFERENCES personnel_profiles(profile_id),
            CONSTRAINT fk_rank_applied_cycle FOREIGN KEY (ranking_cycle_id) REFERENCES ranking_cycles(id),
            CONSTRAINT fk_rank_applied_track FOREIGN KEY (ranking_track_id) REFERENCES personnel_evaluation_periods(id),
            CONSTRAINT fk_rank_applied_placement FOREIGN KEY (placement_id_snapshot) REFERENCES personnel_rank_placements(id),
            CONSTRAINT fk_rank_applied_group FOREIGN KEY (placement_group_id_snapshot) REFERENCES rank_placement_groups(id),
            CONSTRAINT fk_rank_applied_confirmer FOREIGN KEY (confirmed_by_profile_id) REFERENCES profiles(id),
            CONSTRAINT chk_rank_applied_status CHECK (status IN ('suggested','confirmed','stale'))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        $this->db->query("CREATE TABLE IF NOT EXISTS personnel_rank_applied_for_events (
            id VARCHAR(36) PRIMARY KEY,
            decision_id VARCHAR(36) NOT NULL,
            personnel_profile_id VARCHAR(36) NOT NULL,
            event_type VARCHAR(40) NOT NULL,
            performed_by_profile_id VARCHAR(36) NOT NULL,
            event_payload JSON NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_rank_applied_events (decision_id, created_at),
            CONSTRAINT fk_rank_applied_event_decision FOREIGN KEY (decision_id) REFERENCES personnel_rank_applied_for_decisions(id),
            CONSTRAINT fk_rank_applied_event_personnel FOREIGN KEY (personnel_profile_id) REFERENCES personnel_profiles(profile_id),
            CONSTRAINT fk_rank_applied_event_actor FOREIGN KEY (performed_by_profile_id) REFERENCES profiles(id),
            CONSTRAINT chk_rank_applied_event_type CHECK (event_type IN ('suggested','confirmed','deviated','stale_rejected'))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    }

    public function down()
    {
        $this->db->query('DROP TABLE IF EXISTS personnel_rank_applied_for_events');
        $this->db->query('DROP TABLE IF EXISTS personnel_rank_applied_for_decisions');
    }
}
