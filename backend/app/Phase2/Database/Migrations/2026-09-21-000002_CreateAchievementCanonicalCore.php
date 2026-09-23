<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateAchievementCanonicalCore extends Migration
{
    public function up()
    {
        $this->db->query("
            CREATE TABLE achievement_records (
                id CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                owner_profile_id CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                owner_domain VARCHAR(20)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                current_version_id CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                canonical_status VARCHAR(30)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL
                    DEFAULT 'active',

                surviving_record_id CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                created_by_profile_id CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                created_at DATETIME(6)
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP(6),

                updated_at DATETIME(6)
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP(6)
                    ON UPDATE CURRENT_TIMESTAMP(6),

                PRIMARY KEY (id),

                INDEX idx_achievement_records_owner_domain_status (
                    owner_profile_id,
                    owner_domain,
                    canonical_status
                ),

                INDEX idx_achievement_records_current_version (
                    current_version_id
                ),

                INDEX idx_achievement_records_surviving_record (
                    surviving_record_id
                ),

                INDEX idx_achievement_records_created_by (
                    created_by_profile_id
                ),

                CONSTRAINT fk_achievement_records_owner
                    FOREIGN KEY (owner_profile_id)
                    REFERENCES profiles(id)
                    ON DELETE RESTRICT
                    ON UPDATE NO ACTION,

                CONSTRAINT fk_achievement_records_surviving_record
                    FOREIGN KEY (surviving_record_id)
                    REFERENCES achievement_records(id)
                    ON DELETE RESTRICT
                    ON UPDATE NO ACTION,

                CONSTRAINT fk_achievement_records_created_by
                    FOREIGN KEY (created_by_profile_id)
                    REFERENCES profiles(id)
                    ON DELETE SET NULL
                    ON UPDATE NO ACTION,

                CONSTRAINT chk_achievement_records_owner_domain
                    CHECK (
                        owner_domain IN ('STUDENT', 'PERSONNEL')
                    ),

                CONSTRAINT chk_achievement_records_canonical_status
                    CHECK (
                        canonical_status IN (
                            'active',
                            'superseded',
                            'archived'
                        )
                    ),

                CONSTRAINT chk_achievement_records_surviving_not_self
                    CHECK (
                        surviving_record_id IS NULL
                        OR surviving_record_id <> id
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARSET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
        ");

        $this->db->query("
            CREATE TABLE achievement_record_versions (
                id CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                achievement_record_id CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                version_number INT UNSIGNED
                    NOT NULL,

                previous_version_id CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                contract_code VARCHAR(100)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                submission_state VARCHAR(30)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                source_type VARCHAR(30)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NOT NULL,

                created_by_profile_id CHAR(36)
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_unicode_ci
                    NULL,

                revision_token INT UNSIGNED
                    NOT NULL
                    DEFAULT 1,

                created_at DATETIME(6)
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP(6),

                submitted_at DATETIME(6)
                    NULL,

                locked_at DATETIME(6)
                    NULL,

                PRIMARY KEY (id),

                UNIQUE KEY uq_achievement_record_versions_record_version (
                    achievement_record_id,
                    version_number
                ),

                INDEX idx_achievement_record_versions_record_state (
                    achievement_record_id,
                    submission_state
                ),

                INDEX idx_achievement_record_versions_previous (
                    previous_version_id
                ),

                INDEX idx_achievement_record_versions_contract (
                    contract_code
                ),

                INDEX idx_achievement_record_versions_created_by (
                    created_by_profile_id
                ),

                INDEX idx_achievement_record_versions_submitted_at (
                    submitted_at
                ),

                CONSTRAINT fk_achievement_record_versions_record
                    FOREIGN KEY (achievement_record_id)
                    REFERENCES achievement_records(id)
                    ON DELETE RESTRICT
                    ON UPDATE NO ACTION,

                CONSTRAINT fk_achievement_record_versions_previous
                    FOREIGN KEY (previous_version_id)
                    REFERENCES achievement_record_versions(id)
                    ON DELETE RESTRICT
                    ON UPDATE NO ACTION,

                CONSTRAINT fk_achievement_record_versions_contract
                    FOREIGN KEY (contract_code)
                    REFERENCES achievement_contracts(contract_code)
                    ON DELETE RESTRICT
                    ON UPDATE NO ACTION,

                CONSTRAINT fk_achievement_record_versions_created_by
                    FOREIGN KEY (created_by_profile_id)
                    REFERENCES profiles(id)
                    ON DELETE SET NULL
                    ON UPDATE NO ACTION,

                CONSTRAINT chk_achievement_record_versions_number
                    CHECK (
                        version_number > 0
                    ),

                CONSTRAINT chk_achievement_record_versions_previous_not_self
                    CHECK (
                        previous_version_id IS NULL
                        OR previous_version_id <> id
                    ),

                CONSTRAINT chk_achievement_record_versions_submission_state
                    CHECK (
                        submission_state IN (
                            'draft',
                            'submitted',
                            'revision_requested',
                            'resolved'
                        )
                    ),

                CONSTRAINT chk_achievement_record_versions_source_type
                    CHECK (
                        source_type IN (
                            'OWNER_ENTRY',
                            'INTERNAL_EVENT',
                            'LEGACY_BACKFILL',
                            'REVIEWER_RESOLUTION'
                        )
                    )
            )
            ENGINE=InnoDB
            DEFAULT CHARSET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
        ");

        $this->db->query("
            ALTER TABLE achievement_records
                ADD CONSTRAINT fk_achievement_records_current_version
                FOREIGN KEY (current_version_id)
                REFERENCES achievement_record_versions(id)
                ON DELETE RESTRICT
                ON UPDATE NO ACTION
        ");
    }

    public function down()
    {
        $this->db->query("
            ALTER TABLE achievement_records
                DROP FOREIGN KEY fk_achievement_records_current_version
        ");

        $this->db->query('DROP TABLE IF EXISTS achievement_record_versions');
        $this->db->query('DROP TABLE IF EXISTS achievement_records');
    }
}
