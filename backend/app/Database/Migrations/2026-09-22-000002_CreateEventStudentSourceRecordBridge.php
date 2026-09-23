<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Adds finalized student-specific event facts and their canonical portfolio link. */
class CreateEventStudentSourceRecordBridge extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS event_student_source_records (
    id CHAR(36) NOT NULL,
    event_id CHAR(36) NOT NULL,
    student_profile_id CHAR(36) NOT NULL,
    category_id CHAR(36) NOT NULL,
    subcategory_id CHAR(36) NULL,
    participation_role VARCHAR(80) NULL,
    verified_engagement_outcome VARCHAR(40) NULL,
    placement VARCHAR(40) NULL,
    structured_attributes JSON NULL,
    attendance_verified TINYINT(1) NOT NULL DEFAULT 0,
    facts_finalized TINYINT(1) NOT NULL DEFAULT 0,
    verification_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    fact_fingerprint CHAR(64) NOT NULL,
    source_record_id CHAR(36) NULL,
    bridge_status VARCHAR(30) NOT NULL DEFAULT 'NOT_READY',
    reason_codes JSON NULL,
    created_by CHAR(36) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_event_student_source_fact (event_id, student_profile_id, fact_fingerprint),
    UNIQUE KEY uq_event_source_record (source_record_id),
    KEY idx_event_source_candidates (event_id, bridge_status),
    CONSTRAINT fk_event_source_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_source_student FOREIGN KEY (student_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_source_category FOREIGN KEY (category_id) REFERENCES portfolio_categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_event_source_subcategory FOREIGN KEY (subcategory_id) REFERENCES portfolio_subcategories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_event_source_record FOREIGN KEY (source_record_id) REFERENCES student_portfolio_records(id) ON DELETE SET NULL,
    CONSTRAINT fk_event_source_creator FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL,
    CONSTRAINT ck_event_source_verification CHECK (verification_status IN ('pending','verified','rejected','archived')),
    CONSTRAINT ck_event_source_bridge_status CHECK (bridge_status IN ('NOT_READY','READY_TO_CREATE','CREATED','LINKED_EXISTING','UPDATED','BLOCKED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);
    }

    public function down()
    {
        $this->forge->dropTable('event_student_source_records', true);
    }
}
