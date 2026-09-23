<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Migration: 2026-08-30-000034_AddAwardCandidateManualDecisions.php
 * Domain: OSAD Awards & Scoring Criteria — Attributable Manual Candidate Decisions & Audit History
 * Engine: MySQL 8.4.7 (InnoDB, utf8mb4_unicode_ci)
 */
class AddAwardCandidateManualDecisions extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS award_candidate_manual_decisions (
    id CHAR(36) NOT NULL,
    cycle_id CHAR(36) NOT NULL,
    award_definition_id CHAR(36) NOT NULL,
    student_profile_id CHAR(36) NOT NULL,
    decision_type VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    decided_by CHAR(36) NOT NULL,
    previous_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_acmd_cycle (cycle_id),
    KEY idx_acmd_award (award_definition_id),
    KEY idx_acmd_student (student_profile_id),
    KEY idx_acmd_decided_by (decided_by),
    CONSTRAINT fk_acmd_cycle FOREIGN KEY (cycle_id) REFERENCES award_cycles (id) ON DELETE CASCADE,
    CONSTRAINT fk_acmd_award FOREIGN KEY (award_definition_id) REFERENCES award_definitions (id) ON DELETE CASCADE,
    CONSTRAINT fk_acmd_student FOREIGN KEY (student_profile_id) REFERENCES profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_acmd_decided_by FOREIGN KEY (decided_by) REFERENCES profiles (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL);
    }

    public function down()
    {
        $this->db->query(<<<'SQL'
DROP TABLE IF EXISTS award_candidate_manual_decisions;
SQL);
    }
}
