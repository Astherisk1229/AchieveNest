<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Phase L: suggestion evidence and immutable placement lifecycle audit. */
class CreatePlacementSuggestionLifecycle extends Migration
{
    public function up()
    {
        $this->db->query("ALTER TABLE personnel_rank_placements
            DROP INDEX uq_personnel_pending_placement,
            MODIFY pending_personnel_guard VARCHAR(36) GENERATED ALWAYS AS (CASE WHEN status IN ('pending_future','activation_failed') THEN personnel_profile_id ELSE NULL END) STORED,
            ADD UNIQUE KEY uq_personnel_pending_placement (pending_personnel_guard)");

        $this->db->query("CREATE TABLE IF NOT EXISTS personnel_rank_placement_suggestions (
            id VARCHAR(36) PRIMARY KEY,
            personnel_profile_id VARCHAR(36) NOT NULL,
            suggested_placement_group_id BIGINT UNSIGNED NULL,
            status VARCHAR(30) NOT NULL,
            explanation VARCHAR(500) NOT NULL,
            credential_references JSON NOT NULL,
            candidate_tier_codes JSON NOT NULL,
            generated_by_profile_id VARCHAR(36) NOT NULL,
            confirmed_placement_id VARCHAR(36) NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_placement_suggestion_personnel (personnel_profile_id, created_at),
            CONSTRAINT fk_placement_suggestion_personnel FOREIGN KEY (personnel_profile_id) REFERENCES personnel_profiles(profile_id),
            CONSTRAINT fk_placement_suggestion_group FOREIGN KEY (suggested_placement_group_id) REFERENCES rank_placement_groups(id),
            CONSTRAINT fk_placement_suggestion_actor FOREIGN KEY (generated_by_profile_id) REFERENCES profiles(id),
            CONSTRAINT fk_placement_suggestion_placement FOREIGN KEY (confirmed_placement_id) REFERENCES personnel_rank_placements(id),
            CONSTRAINT chk_placement_suggestion_status CHECK (status IN ('suggested','ambiguous','unresolved','confirmed'))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        $this->db->query("CREATE TABLE IF NOT EXISTS personnel_rank_placement_events (
            id VARCHAR(36) PRIMARY KEY,
            placement_id VARCHAR(36) NOT NULL,
            personnel_profile_id VARCHAR(36) NOT NULL,
            event_type VARCHAR(40) NOT NULL,
            performed_by_profile_id VARCHAR(36) NULL,
            event_payload JSON NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_placement_event_timeline (placement_id, created_at),
            INDEX idx_personnel_placement_events (personnel_profile_id, created_at),
            CONSTRAINT fk_placement_event_placement FOREIGN KEY (placement_id) REFERENCES personnel_rank_placements(id),
            CONSTRAINT fk_placement_event_personnel FOREIGN KEY (personnel_profile_id) REFERENCES personnel_profiles(profile_id),
            CONSTRAINT fk_placement_event_actor FOREIGN KEY (performed_by_profile_id) REFERENCES profiles(id),
            CONSTRAINT chk_placement_event_type CHECK (event_type IN ('confirmed','activated','activation_failed','activation_retried','corrected','cancelled'))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    }

    public function down()
    {
        $this->db->query('DROP TABLE IF EXISTS personnel_rank_placement_events');
        $this->db->query('DROP TABLE IF EXISTS personnel_rank_placement_suggestions');
        $this->db->query("ALTER TABLE personnel_rank_placements
            DROP INDEX uq_personnel_pending_placement,
            MODIFY pending_personnel_guard VARCHAR(36) GENERATED ALWAYS AS (CASE WHEN status='pending_future' THEN personnel_profile_id ELSE NULL END) STORED,
            ADD UNIQUE KEY uq_personnel_pending_placement (pending_personnel_guard)");
    }
}
