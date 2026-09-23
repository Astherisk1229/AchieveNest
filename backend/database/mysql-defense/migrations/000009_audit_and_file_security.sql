-- ============================================================================
-- Migration: 000009_audit_and_file_security.sql
-- Domain: System Audit Logging, File Security Audits, Password Resets, Role Events
-- Engine: MySQL 8.4.7 (InnoDB, utf8mb4_unicode_ci)
-- ============================================================================

-- 1. Audit Logs (Central administrative and system security audit trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id CHAR(36) NOT NULL PRIMARY KEY,
    actor_profile_id CHAR(36) NULL,
    event_code VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NULL,
    target_id CHAR(36) NULL,
    outcome VARCHAR(20) NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    details TEXT NOT NULL,
    safe_context JSON NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_profile_id) REFERENCES profiles(id) ON DELETE SET NULL,
    CONSTRAINT ck_audit_logs_outcome CHECK (outcome IN ('success', 'failure', 'denied'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. File Security Audit Events (Malware scanning, hash verification, and upload safety audit)
CREATE TABLE IF NOT EXISTS file_security_audit_events (
    id CHAR(36) NOT NULL PRIMARY KEY,
    actor_profile_id CHAR(36) NULL,
    evidence_domain VARCHAR(50) NOT NULL,
    evidence_id CHAR(36) NOT NULL,
    storage_bucket VARCHAR(100) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    detected_mime_type VARCHAR(100) NOT NULL,
    byte_size BIGINT NOT NULL,
    sha256 VARCHAR(64) NOT NULL,
    scanner VARCHAR(100) NOT NULL,
    result VARCHAR(20) NOT NULL,
    details JSON NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_file_security_actor FOREIGN KEY (actor_profile_id) REFERENCES profiles(id) ON DELETE SET NULL,
    CONSTRAINT ck_file_security_domain CHECK (evidence_domain IN ('student_portfolio', 'personnel_accomplishment')),
    CONSTRAINT ck_file_security_byte_size CHECK (byte_size > 0),
    CONSTRAINT ck_file_security_result CHECK (result IN ('clean', 'rejected', 'scan_error'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Password Reset Requests (Self-service institutional password reset queue)
CREATE TABLE IF NOT EXISTS password_reset_requests (
    id CHAR(36) NOT NULL PRIMARY KEY,
    institutional_email VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    processed_by CHAR(36) NULL,
    processed_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_password_resets_processor FOREIGN KEY (processed_by) REFERENCES profiles(id) ON DELETE SET NULL,
    CONSTRAINT ck_password_resets_status CHECK (status IN ('pending', 'approved', 'rejected', 'completed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Role Assignment Events (Governance delegation and role modification audit trail)
CREATE TABLE IF NOT EXISTS role_assignment_events (
    id CHAR(36) NOT NULL PRIMARY KEY,
    actor_profile_id CHAR(36) NULL,
    target_profile_id CHAR(36) NOT NULL,
    assignment_type VARCHAR(50) NOT NULL,
    role_or_scope_id CHAR(36) NULL,
    action VARCHAR(30) NOT NULL,
    metadata JSON NULL,
    occurred_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_role_events_actor FOREIGN KEY (actor_profile_id) REFERENCES profiles(id) ON DELETE SET NULL,
    CONSTRAINT fk_role_events_target FOREIGN KEY (target_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT ck_role_events_action CHECK (action IN ('assigned', 'revoked', 'activated', 'deactivated'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
