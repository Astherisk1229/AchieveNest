<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateAchievementContractAndMigrationControl extends Migration
{
    public function up()
    {
        $this->db->query("
    CREATE TABLE achievement_contracts (
        contract_code VARCHAR(100)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

        domain VARCHAR(20)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

        display_name VARCHAR(255)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

        category_code VARCHAR(64)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        subcategory_code VARCHAR(64)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        criterion_code VARCHAR(64)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        contract_version SMALLINT UNSIGNED
            NOT NULL
            DEFAULT 1,

        is_active TINYINT(1)
            NOT NULL
            DEFAULT 1,

        legacy_category_id CHAR(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        legacy_subcategory_id CHAR(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        PRIMARY KEY (contract_code),

        INDEX idx_achievement_contracts_domain_active (
            domain,
            is_active
        ),

        INDEX idx_achievement_contracts_legacy_category (
            legacy_category_id
        ),

        INDEX idx_achievement_contracts_legacy_subcategory (
            legacy_subcategory_id
        ),

        CONSTRAINT fk_achievement_contracts_legacy_category
            FOREIGN KEY (legacy_category_id)
            REFERENCES portfolio_categories(id)
            ON DELETE RESTRICT
            ON UPDATE NO ACTION,

        CONSTRAINT fk_achievement_contracts_legacy_subcategory
            FOREIGN KEY (legacy_subcategory_id)
            REFERENCES portfolio_subcategories(id)
            ON DELETE RESTRICT
            ON UPDATE NO ACTION,

        CONSTRAINT chk_achievement_contracts_domain
            CHECK (
                domain IN ('STUDENT', 'FACULTY', 'NTP')
            ),

        CONSTRAINT chk_achievement_contracts_version
            CHECK (
                contract_version > 0
            ),

        CONSTRAINT chk_achievement_contracts_active
            CHECK (
                is_active IN (0, 1)
            )
    )
    ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci
");

$this->db->query("
    CREATE TABLE migration_backfill_runs (
        id CHAR(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

        run_type VARCHAR(40)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

        idempotency_key VARCHAR(100)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

        mode VARCHAR(20)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

        status VARCHAR(30)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

        target_database VARCHAR(100)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

        started_by_profile_id CHAR(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        started_at DATETIME(6)
            NOT NULL
            DEFAULT CURRENT_TIMESTAMP(6),

        completed_at DATETIME(6)
            NULL,

        last_checkpoint VARCHAR(100)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        processed_count BIGINT UNSIGNED
            NOT NULL
            DEFAULT 0,

        mapped_count BIGINT UNSIGNED
            NOT NULL
            DEFAULT 0,

        quarantined_count BIGINT UNSIGNED
            NOT NULL
            DEFAULT 0,

        excluded_count BIGINT UNSIGNED
            NOT NULL
            DEFAULT 0,

        failed_count BIGINT UNSIGNED
            NOT NULL
            DEFAULT 0,

        summary_json JSON
            NULL,

        failure_message TEXT
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

        UNIQUE KEY uq_migration_backfill_runs_idempotency (
            run_type,
            idempotency_key
        ),

        INDEX idx_migration_backfill_runs_status (
            run_type,
            status
        ),

        INDEX idx_migration_backfill_runs_started_by (
            started_by_profile_id
        ),

        CONSTRAINT fk_migration_backfill_runs_started_by
            FOREIGN KEY (started_by_profile_id)
            REFERENCES profiles(id)
            ON DELETE SET NULL
            ON UPDATE NO ACTION
    )
    ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci
");

$this->db->query("
    CREATE TABLE achievement_legacy_crosswalk (
        id CHAR(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

        legacy_table VARCHAR(64)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

        legacy_id CHAR(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

        achievement_record_id CHAR(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        record_version_id CHAR(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        backfill_run_id CHAR(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        mapping_status VARCHAR(30)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

        mapped_contract_code VARCHAR(100)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        legacy_payload JSON
            NULL,

        mapping_notes TEXT
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        mapped_by_profile_id CHAR(36)
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

        UNIQUE KEY uq_achievement_legacy_crosswalk_source (
            legacy_table,
            legacy_id
        ),

        INDEX idx_achievement_legacy_crosswalk_status (
            mapping_status
        ),

        INDEX idx_achievement_legacy_crosswalk_contract (
            mapped_contract_code
        ),

        INDEX idx_achievement_legacy_crosswalk_mapped_by (
            mapped_by_profile_id
        ),

        INDEX idx_achievement_legacy_crosswalk_backfill_run (
            backfill_run_id
        ),

        CONSTRAINT fk_achievement_legacy_crosswalk_contract
            FOREIGN KEY (mapped_contract_code)
            REFERENCES achievement_contracts(contract_code)
            ON DELETE RESTRICT
            ON UPDATE NO ACTION,

        CONSTRAINT fk_achievement_legacy_crosswalk_mapped_by
            FOREIGN KEY (mapped_by_profile_id)
            REFERENCES profiles(id)
            ON DELETE SET NULL
            ON UPDATE NO ACTION,

        CONSTRAINT fk_achievement_legacy_crosswalk_backfill_run
            FOREIGN KEY (backfill_run_id)
            REFERENCES migration_backfill_runs(id)
            ON DELETE RESTRICT
            ON UPDATE NO ACTION
    )
    ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci
");

$this->db->query("
    CREATE TABLE achievement_legacy_evidence_crosswalk (
        id CHAR(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

        legacy_table VARCHAR(64)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

        legacy_evidence_id CHAR(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

        achievement_evidence_id CHAR(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        backfill_run_id CHAR(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        mapping_status VARCHAR(30)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

        source_parent_legacy_table VARCHAR(64)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        source_parent_legacy_id CHAR(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        mapping_notes TEXT
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        mapped_by_profile_id CHAR(36)
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

        UNIQUE KEY uq_achievement_legacy_evidence_source (
            legacy_table,
            legacy_evidence_id
        ),

        INDEX idx_achievement_legacy_evidence_status (
            mapping_status
        ),

        INDEX idx_achievement_legacy_evidence_parent (
            source_parent_legacy_table,
            source_parent_legacy_id
        ),

        INDEX idx_achievement_legacy_evidence_mapped_by (
            mapped_by_profile_id
        ),

        INDEX idx_achievement_legacy_evidence_backfill_run (
            backfill_run_id
        ),

        CONSTRAINT fk_achievement_legacy_evidence_mapped_by
            FOREIGN KEY (mapped_by_profile_id)
            REFERENCES profiles(id)
            ON DELETE SET NULL
            ON UPDATE NO ACTION,

        CONSTRAINT fk_achievement_legacy_evidence_backfill_run
            FOREIGN KEY (backfill_run_id)
            REFERENCES migration_backfill_runs(id)
            ON DELETE RESTRICT
            ON UPDATE NO ACTION
    )
    ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci
");

$this->db->query("
    CREATE TABLE migration_review_queue (
        id CHAR(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

        review_type VARCHAR(40)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

        source_table VARCHAR(64)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

        source_id CHAR(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

        related_crosswalk_id CHAR(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        backfill_run_id CHAR(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        reason_code VARCHAR(60)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

        reason_details TEXT
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        review_status VARCHAR(30)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NOT NULL,

        assigned_to_profile_id CHAR(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        resolved_by_profile_id CHAR(36)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        resolution_code VARCHAR(60)
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        resolution_notes TEXT
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            NULL,

        queued_at DATETIME(6)
            NOT NULL
            DEFAULT CURRENT_TIMESTAMP(6),

        assigned_at DATETIME(6)
            NULL,

        resolved_at DATETIME(6)
            NULL,

        created_at DATETIME(6)
            NOT NULL
            DEFAULT CURRENT_TIMESTAMP(6),

        updated_at DATETIME(6)
            NOT NULL
            DEFAULT CURRENT_TIMESTAMP(6)
            ON UPDATE CURRENT_TIMESTAMP(6),

        PRIMARY KEY (id),

        UNIQUE KEY uq_migration_review_queue_source_reason (
            review_type,
            source_table,
            source_id,
            reason_code
        ),

        INDEX idx_migration_review_queue_status (
            review_status
        ),

        INDEX idx_migration_review_queue_assigned_to (
            assigned_to_profile_id
        ),

        INDEX idx_migration_review_queue_resolved_by (
            resolved_by_profile_id
        ),

        INDEX idx_migration_review_queue_crosswalk (
            related_crosswalk_id
        ),

        INDEX idx_migration_review_queue_backfill_run (
            backfill_run_id
        ),

        CONSTRAINT fk_migration_review_queue_crosswalk
            FOREIGN KEY (related_crosswalk_id)
            REFERENCES achievement_legacy_crosswalk(id)
            ON DELETE SET NULL
            ON UPDATE NO ACTION,

        CONSTRAINT fk_migration_review_queue_backfill_run
            FOREIGN KEY (backfill_run_id)
            REFERENCES migration_backfill_runs(id)
            ON DELETE RESTRICT
            ON UPDATE NO ACTION,

        CONSTRAINT fk_migration_review_queue_assigned_to
            FOREIGN KEY (assigned_to_profile_id)
            REFERENCES profiles(id)
            ON DELETE SET NULL
            ON UPDATE NO ACTION,

        CONSTRAINT fk_migration_review_queue_resolved_by
            FOREIGN KEY (resolved_by_profile_id)
            REFERENCES profiles(id)
            ON DELETE SET NULL
            ON UPDATE NO ACTION
    )
    ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci
");

    }

    public function down()
{
    $this->db->query('DROP TABLE IF EXISTS migration_review_queue');
    $this->db->query('DROP TABLE IF EXISTS achievement_legacy_evidence_crosswalk');
    $this->db->query('DROP TABLE IF EXISTS achievement_legacy_crosswalk');
    $this->db->query('DROP TABLE IF EXISTS migration_backfill_runs');
    $this->db->query('DROP TABLE IF EXISTS achievement_contracts');
}
}
