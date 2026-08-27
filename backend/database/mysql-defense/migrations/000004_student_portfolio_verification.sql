-- ============================================================================
-- Migration: 000004_student_portfolio_verification.sql
-- Domain: Student Portfolio, Taxonomy Categories/Subcategories, Evidence, and Verification
-- Engine: MySQL 8.4.7 (InnoDB, utf8mb4_unicode_ci)
-- ============================================================================

-- 1. Portfolio Categories (9 standard taxonomy categories)
CREATE TABLE IF NOT EXISTS portfolio_categories (
    id CHAR(36) NOT NULL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT ck_portfolio_categories_status CHECK (status IN ('active', 'inactive', 'archived'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Portfolio Subcategories (57 granular achievement subcategories)
CREATE TABLE IF NOT EXISTS portfolio_subcategories (
    id CHAR(36) NOT NULL PRIMARY KEY,
    category_id CHAR(36) NOT NULL,
    code VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    metadata_requirements JSON NULL,
    sort_order INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_portfolio_subcategories_category FOREIGN KEY (category_id) REFERENCES portfolio_categories(id) ON DELETE RESTRICT,
    CONSTRAINT ck_portfolio_subcategories_status CHECK (status IN ('active', 'inactive', 'archived')),
    UNIQUE KEY uq_cat_subcat_code (category_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Student Portfolio Records (Individual student achievement submissions)
CREATE TABLE IF NOT EXISTS student_portfolio_records (
    id CHAR(36) NOT NULL PRIMARY KEY,
    student_profile_id CHAR(36) NOT NULL,
    category_id CHAR(36) NOT NULL,
    subcategory_id CHAR(36) NULL,
    title VARCHAR(255) NOT NULL,
    organizer_or_body VARCHAR(255) NULL,
    occurrence_date DATE NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    description TEXT NULL,
    structured_metadata JSON NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    submitted_at DATETIME(6) NULL,
    verified_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_portfolio_records_student FOREIGN KEY (student_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_portfolio_records_category FOREIGN KEY (category_id) REFERENCES portfolio_categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_portfolio_records_subcategory FOREIGN KEY (subcategory_id) REFERENCES portfolio_subcategories(id) ON DELETE RESTRICT,
    CONSTRAINT ck_portfolio_records_status CHECK (status IN ('draft', 'submitted', 'revision_requested', 'verified', 'rejected', 'archived'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Student Portfolio Evidence (Physical proof metadata stored outside database)
CREATE TABLE IF NOT EXISTS student_portfolio_evidence (
    id CHAR(36) NOT NULL PRIMARY KEY,
    portfolio_record_id CHAR(36) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    detected_mime_type VARCHAR(100) NULL,
    byte_size BIGINT NOT NULL,
    checksum VARCHAR(64) NULL,
    sha256 VARCHAR(64) NULL,
    evidence_type VARCHAR(50) NOT NULL DEFAULT 'certificate',
    uploaded_by CHAR(36) NOT NULL,
    uploaded_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    security_status VARCHAR(30) NOT NULL DEFAULT 'clean',
    malware_scanner VARCHAR(100) NOT NULL DEFAULT 'backend_clamav_v1',
    security_validated_at DATETIME(6) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    CONSTRAINT fk_portfolio_evidence_record FOREIGN KEY (portfolio_record_id) REFERENCES student_portfolio_records(id) ON DELETE CASCADE,
    CONSTRAINT fk_portfolio_evidence_uploader FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE RESTRICT,
    CONSTRAINT ck_student_evidence_byte_size CHECK (byte_size > 0),
    CONSTRAINT ck_student_evidence_security_status CHECK (security_status IN ('pending', 'clean', 'rejected', 'quarantined')),
    CONSTRAINT ck_student_evidence_status CHECK (status IN ('active', 'archived', 'deleted'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Student Portfolio Verification Events (Lifecycle decisions and remarks audit trail)
CREATE TABLE IF NOT EXISTS student_portfolio_verification_events (
    id CHAR(36) NOT NULL PRIMARY KEY,
    portfolio_record_id CHAR(36) NOT NULL,
    actor_profile_id CHAR(36) NULL,
    action VARCHAR(30) NOT NULL,
    previous_status VARCHAR(30) NULL,
    new_status VARCHAR(30) NOT NULL,
    remarks TEXT NULL,
    occurred_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_verification_events_record FOREIGN KEY (portfolio_record_id) REFERENCES student_portfolio_records(id) ON DELETE CASCADE,
    CONSTRAINT fk_verification_events_actor FOREIGN KEY (actor_profile_id) REFERENCES profiles(id) ON DELETE SET NULL,
    CONSTRAINT ck_verification_events_action CHECK (action IN ('submitted', 'revision_requested', 'resubmitted', 'verified', 'rejected'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
