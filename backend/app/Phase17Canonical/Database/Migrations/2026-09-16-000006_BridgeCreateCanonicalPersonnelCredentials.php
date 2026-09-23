<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Phase L0: canonical credential facts. No placement or rank decisions are stored here. */
class BridgeCreateCanonicalPersonnelCredentials extends Migration
{
    use September15BridgeGuard;

public function up()
    {
        $this->assertBridgeStep(6);
        $this->db->query("CREATE TABLE IF NOT EXISTS personnel_credentials (
            id VARCHAR(36) PRIMARY KEY,
            personnel_profile_id VARCHAR(36) NOT NULL,
            credential_type VARCHAR(30) NOT NULL,
            degree_level VARCHAR(30) NULL,
            board_licensure_status VARCHAR(30) NULL,
            credential_title VARCHAR(255) NOT NULL,
            issuing_institution_authority VARCHAR(255) NULL,
            earned_issued_on DATE NULL,
            verification_status VARCHAR(30) NOT NULL DEFAULT 'submitted',
            verified_by_profile_id VARCHAR(36) NULL,
            verified_at DATETIME NULL,
            verification_notes TEXT NULL,
            provenance VARCHAR(100) NOT NULL,
            supporting_document_reference VARCHAR(500) NOT NULL,
            supporting_evidence_id VARCHAR(36) NULL,
            record_state VARCHAR(30) NOT NULL DEFAULT 'active',
            supersedes_credential_id VARCHAR(36) NULL,
            submitted_by_profile_id VARCHAR(36) NOT NULL,
            submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_personnel_credentials_history (personnel_profile_id, created_at),
            INDEX idx_personnel_credentials_verified (personnel_profile_id, verification_status, record_state),
            INDEX idx_personnel_credentials_supporting_evidence (supporting_evidence_id),
            CONSTRAINT fk_personnel_credential_personnel FOREIGN KEY (personnel_profile_id) REFERENCES personnel_profiles(profile_id),
            CONSTRAINT fk_personnel_credential_verifier FOREIGN KEY (verified_by_profile_id) REFERENCES profiles(id),
            CONSTRAINT fk_personnel_credential_submitter FOREIGN KEY (submitted_by_profile_id) REFERENCES profiles(id),
            CONSTRAINT fk_personnel_credential_supersedes FOREIGN KEY (supersedes_credential_id) REFERENCES personnel_credentials(id),
            CONSTRAINT chk_personnel_credential_type CHECK (credential_type IN ('degree','board_licensure','other')),
            CONSTRAINT chk_personnel_credential_degree CHECK (degree_level IS NULL OR degree_level IN ('baccalaureate','masters','doctorate')),
            CONSTRAINT chk_personnel_credential_board CHECK (board_licensure_status IS NULL OR board_licensure_status IN ('board_passer','non_board')),
            CONSTRAINT chk_personnel_credential_verification CHECK (verification_status IN ('submitted','verified','rejected')),
            CONSTRAINT chk_personnel_credential_state CHECK (record_state IN ('active','superseded','revoked')),
            CONSTRAINT chk_personnel_credential_shape CHECK (
                (credential_type='degree' AND degree_level IS NOT NULL AND board_licensure_status IS NULL)
                OR (credential_type='board_licensure' AND board_licensure_status IS NOT NULL AND degree_level IS NULL)
                OR (credential_type='other' AND degree_level IS NULL AND board_licensure_status IS NULL)
            ),
            CONSTRAINT chk_personnel_credential_verified CHECK (
                verification_status<>'verified' OR (verified_by_profile_id IS NOT NULL AND verified_at IS NOT NULL)
            )
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        $this->db->query("CREATE TABLE IF NOT EXISTS personnel_credential_events (
            id VARCHAR(36) PRIMARY KEY,
            credential_id VARCHAR(36) NOT NULL,
            personnel_profile_id VARCHAR(36) NOT NULL,
            event_type VARCHAR(40) NOT NULL,
            performed_by_profile_id VARCHAR(36) NOT NULL,
            event_payload JSON NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_personnel_credential_events (credential_id, created_at),
            INDEX idx_personnel_credential_personnel_events (personnel_profile_id, created_at),
            CONSTRAINT fk_credential_event_credential FOREIGN KEY (credential_id) REFERENCES personnel_credentials(id),
            CONSTRAINT fk_credential_event_personnel FOREIGN KEY (personnel_profile_id) REFERENCES personnel_profiles(profile_id),
            CONSTRAINT fk_credential_event_actor FOREIGN KEY (performed_by_profile_id) REFERENCES profiles(id),
            CONSTRAINT chk_credential_event_type CHECK (event_type IN ('submitted','verified','rejected','superseded','revoked'))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    }

    }
