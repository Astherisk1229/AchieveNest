-- ============================================================================
-- Migration: 000008_personnel_ranking.sql
-- Domain: Personnel Accomplishments, Evidence, Qualification, and Ranking Evaluation (70/50/40/160/120)
-- Engine: MySQL 8.4.7 (InnoDB, utf8mb4_unicode_ci)
-- ============================================================================

-- 1. Personnel Accomplishments (Faculty accomplishment logging across the 3 ranking domains)
CREATE TABLE IF NOT EXISTS personnel_accomplishments (
    id CHAR(36) NOT NULL PRIMARY KEY,
    personnel_profile_id CHAR(36) NOT NULL,
    domain VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    organizer_or_publisher VARCHAR(255) NULL,
    occurrence_date DATE NULL,
    description TEXT NULL,
    claimed_points DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_personnel_accomplishments_personnel FOREIGN KEY (personnel_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT ck_personnel_accomplishments_domain CHECK (domain IN ('professional_development', 'productivity_creative_work', 'service_leadership')),
    CONSTRAINT ck_personnel_accomplishments_status CHECK (status IN ('draft', 'submitted', 'under_review', 'verified', 'rejected', 'returned'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Personnel Accomplishment Evidence (Physical proof metadata stored outside database)
CREATE TABLE IF NOT EXISTS personnel_accomplishment_evidence (
    id CHAR(36) NOT NULL PRIMARY KEY,
    accomplishment_id CHAR(36) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    detected_mime_type VARCHAR(100) NULL,
    byte_size BIGINT NOT NULL,
    checksum VARCHAR(64) NULL,
    sha256 VARCHAR(64) NULL,
    uploaded_by CHAR(36) NOT NULL,
    uploaded_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    security_status VARCHAR(30) NOT NULL DEFAULT 'clean',
    malware_scanner VARCHAR(100) NOT NULL DEFAULT 'backend_clamav_v1',
    security_validated_at DATETIME(6) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    CONSTRAINT fk_personnel_evidence_accomplishment FOREIGN KEY (accomplishment_id) REFERENCES personnel_accomplishments(id) ON DELETE CASCADE,
    CONSTRAINT fk_personnel_evidence_uploader FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE RESTRICT,
    CONSTRAINT ck_personnel_evidence_byte_size CHECK (byte_size > 0),
    CONSTRAINT ck_personnel_evidence_security_status CHECK (security_status IN ('pending', 'clean', 'rejected', 'quarantined')),
    CONSTRAINT ck_personnel_evidence_status CHECK (status IN ('active', 'archived', 'deleted'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Personnel Qualification Reviews (HR eligibility gate for ranking evaluation)
CREATE TABLE IF NOT EXISTS personnel_qualification_reviews (
    id CHAR(36) NOT NULL PRIMARY KEY,
    personnel_profile_id CHAR(36) NOT NULL,
    reviewer_profile_id CHAR(36) NOT NULL,
    qualification_status VARCHAR(30) NOT NULL,
    remarks TEXT NULL,
    reviewed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_qualification_reviews_personnel FOREIGN KEY (personnel_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_qualification_reviews_reviewer FOREIGN KEY (reviewer_profile_id) REFERENCES profiles(id) ON DELETE RESTRICT,
    CONSTRAINT ck_qualification_reviews_status CHECK (qualification_status IN ('qualified', 'not_qualified', 'conditional'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Personnel Evaluations (Administrator Ranking Scale: ProfDev <= 70, Prod <= 50, Serv <= 40, Total <= 160, Pass >= 120)
CREATE TABLE IF NOT EXISTS personnel_evaluations (
    id CHAR(36) NOT NULL PRIMARY KEY,
    personnel_profile_id CHAR(36) NOT NULL,
    evaluator_profile_id CHAR(36) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    score_professional_development DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    score_productivity_creative_work DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    score_service_leadership DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    total_score DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    passing_status VARCHAR(20) NOT NULL DEFAULT 'fail',
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    finalized_at DATETIME(6) NULL,
    finalized_by CHAR(36) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_personnel_evaluations_personnel FOREIGN KEY (personnel_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_personnel_evaluations_evaluator FOREIGN KEY (evaluator_profile_id) REFERENCES profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_personnel_evaluations_finalizer FOREIGN KEY (finalized_by) REFERENCES profiles(id) ON DELETE SET NULL,
    CONSTRAINT ck_evaluations_score_prof_dev CHECK (score_professional_development >= 0.00 AND score_professional_development <= 70.00),
    CONSTRAINT ck_evaluations_score_productivity CHECK (score_productivity_creative_work >= 0.00 AND score_productivity_creative_work <= 50.00),
    CONSTRAINT ck_evaluations_score_service CHECK (score_service_leadership >= 0.00 AND score_service_leadership <= 40.00),
    CONSTRAINT ck_evaluations_total_score CHECK (total_score >= 0.00 AND total_score <= 160.00),
    CONSTRAINT ck_evaluations_passing_status CHECK (passing_status IN ('pass', 'fail')),
    CONSTRAINT ck_evaluations_status CHECK (status IN ('draft', 'in_progress', 'under_review', 'revision_requested', 'ready_for_finalization', 'finalized'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Personnel Evaluation Items (Line-item evaluation per accomplishment)
CREATE TABLE IF NOT EXISTS personnel_evaluation_items (
    id CHAR(36) NOT NULL PRIMARY KEY,
    evaluation_id CHAR(36) NOT NULL,
    accomplishment_id CHAR(36) NULL,
    domain VARCHAR(50) NOT NULL,
    item_description TEXT NOT NULL,
    claimed_points DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    verified_points DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    remarks TEXT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_evaluation_items_evaluation FOREIGN KEY (evaluation_id) REFERENCES personnel_evaluations(id) ON DELETE CASCADE,
    CONSTRAINT fk_evaluation_items_accomplishment FOREIGN KEY (accomplishment_id) REFERENCES personnel_accomplishments(id) ON DELETE SET NULL,
    CONSTRAINT ck_evaluation_items_domain CHECK (domain IN ('professional_development', 'productivity_creative_work', 'service_leadership'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Personnel Evaluation Events (Workflow audit trail for ranking transitions)
CREATE TABLE IF NOT EXISTS personnel_evaluation_events (
    id CHAR(36) NOT NULL PRIMARY KEY,
    evaluation_id CHAR(36) NOT NULL,
    actor_profile_id CHAR(36) NOT NULL,
    action VARCHAR(50) NOT NULL,
    previous_status VARCHAR(30) NULL,
    new_status VARCHAR(30) NOT NULL,
    remarks TEXT NULL,
    occurred_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_evaluation_events_evaluation FOREIGN KEY (evaluation_id) REFERENCES personnel_evaluations(id) ON DELETE CASCADE,
    CONSTRAINT fk_evaluation_events_actor FOREIGN KEY (actor_profile_id) REFERENCES profiles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Personnel Evaluation Deficiency Requests (Deficiency communication loop)
CREATE TABLE IF NOT EXISTS personnel_evaluation_deficiency_requests (
    id CHAR(36) NOT NULL PRIMARY KEY,
    evaluation_id CHAR(36) NOT NULL,
    item_id CHAR(36) NULL,
    requested_by CHAR(36) NOT NULL,
    deficiency_description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    response_text TEXT NULL,
    responded_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_deficiency_requests_evaluation FOREIGN KEY (evaluation_id) REFERENCES personnel_evaluations(id) ON DELETE CASCADE,
    CONSTRAINT fk_deficiency_requests_item FOREIGN KEY (item_id) REFERENCES personnel_evaluation_items(id) ON DELETE SET NULL,
    CONSTRAINT fk_deficiency_requests_requester FOREIGN KEY (requested_by) REFERENCES profiles(id) ON DELETE RESTRICT,
    CONSTRAINT ck_deficiency_requests_status CHECK (status IN ('pending', 'responded', 'resolved', 'cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Personnel Evaluation Reports (Finalized ranking summary reports)
CREATE TABLE IF NOT EXISTS personnel_evaluation_reports (
    id CHAR(36) NOT NULL PRIMARY KEY,
    evaluation_id CHAR(36) NOT NULL,
    generated_by CHAR(36) NOT NULL,
    report_payload JSON NOT NULL,
    summary_score DECIMAL(6,2) NOT NULL,
    passing_status VARCHAR(20) NOT NULL,
    generated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_evaluation_reports_evaluation FOREIGN KEY (evaluation_id) REFERENCES personnel_evaluations(id) ON DELETE CASCADE,
    CONSTRAINT fk_evaluation_reports_generator FOREIGN KEY (generated_by) REFERENCES profiles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
