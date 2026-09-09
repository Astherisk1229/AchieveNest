-- ============================================================================
-- Migration: 000005_events_and_certificates.sql
-- Domain: Official Events, Attendance Tracking, Certificate Templates, and Issuance
-- Engine: MySQL 8.4.7 (InnoDB, utf8mb4_unicode_ci)
-- ============================================================================

-- 1. Events (Institutional activities organized by university entities)
CREATE TABLE IF NOT EXISTS events (
    id CHAR(36) NOT NULL PRIMARY KEY,
    organizer_profile_id CHAR(36) NULL,
    organization_id CHAR(36) NULL,
    college_id CHAR(36) NULL,
    administrative_unit_id CHAR(36) NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    event_type VARCHAR(50) NOT NULL,
    start_time DATETIME(6) NOT NULL,
    end_time DATETIME(6) NOT NULL,
    venue VARCHAR(255) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'published',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_events_organizer FOREIGN KEY (organizer_profile_id) REFERENCES profiles(id) ON DELETE SET NULL,
    CONSTRAINT fk_events_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    CONSTRAINT fk_events_college FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
    CONSTRAINT fk_events_admin_unit FOREIGN KEY (administrative_unit_id) REFERENCES administrative_units(id) ON DELETE SET NULL,
    CONSTRAINT ck_events_status CHECK (status IN ('draft', 'published', 'ongoing', 'completed', 'cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Attendance Sessions (Check-in time slots per event)
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id CHAR(36) NOT NULL PRIMARY KEY,
    event_id CHAR(36) NOT NULL,
    session_name VARCHAR(150) NOT NULL,
    session_type VARCHAR(30) NOT NULL DEFAULT 'general',
    check_in_start DATETIME(6) NOT NULL,
    check_in_end DATETIME(6) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_attendance_sessions_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT ck_attendance_sessions_type CHECK (session_type IN ('general', 'morning', 'afternoon', 'breakout')),
    CONSTRAINT ck_attendance_sessions_status CHECK (status IN ('scheduled', 'open', 'closed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Attendance Records (Individual verified event attendance)
CREATE TABLE IF NOT EXISTS attendance_records (
    id CHAR(36) NOT NULL PRIMARY KEY,
    session_id CHAR(36) NOT NULL,
    attendee_profile_id CHAR(36) NOT NULL,
    scanned_by CHAR(36) NULL,
    checked_in_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    verification_method VARCHAR(30) NOT NULL DEFAULT 'qr_scan',
    CONSTRAINT fk_attendance_records_session FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_records_attendee FOREIGN KEY (attendee_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_records_scanner FOREIGN KEY (scanned_by) REFERENCES profiles(id) ON DELETE SET NULL,
    CONSTRAINT ck_attendance_records_method CHECK (verification_method IN ('qr_scan', 'manual', 'self_checkin')),
    UNIQUE KEY uq_session_attendee (session_id, attendee_profile_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Certificate Template Families (Template series metadata)
CREATE TABLE IF NOT EXISTS certificate_template_families (
    id CHAR(36) NOT NULL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT ck_template_families_status CHECK (status IN ('active', 'inactive'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Certificate Template Versions (Versioned layout, signatories, and canvas configurations)
CREATE TABLE IF NOT EXISTS certificate_template_versions (
    id CHAR(36) NOT NULL PRIMARY KEY,
    family_id CHAR(36) NOT NULL,
    version_number INT NOT NULL,
    layout_config JSON NOT NULL,
    signatories_config JSON NOT NULL,
    background_storage_path VARCHAR(500) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_template_versions_family FOREIGN KEY (family_id) REFERENCES certificate_template_families(id) ON DELETE CASCADE,
    CONSTRAINT ck_template_versions_status CHECK (status IN ('draft', 'active', 'deprecated')),
    UNIQUE KEY uq_family_version (family_id, version_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Certificate Issuance Batches (Batch tracking for generated certificates)
CREATE TABLE IF NOT EXISTS certificate_issuance_batches (
    id CHAR(36) NOT NULL PRIMARY KEY,
    event_id CHAR(36) NULL,
    template_version_id CHAR(36) NOT NULL,
    issuer_profile_id CHAR(36) NOT NULL,
    batch_name VARCHAR(150) NOT NULL,
    issued_count INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    issued_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_issuance_batches_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
    CONSTRAINT fk_issuance_batches_template FOREIGN KEY (template_version_id) REFERENCES certificate_template_versions(id) ON DELETE RESTRICT,
    CONSTRAINT fk_issuance_batches_issuer FOREIGN KEY (issuer_profile_id) REFERENCES profiles(id) ON DELETE RESTRICT,
    CONSTRAINT ck_issuance_batches_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Issued Certificates (Official verifiable digital credentials)
CREATE TABLE IF NOT EXISTS issued_certificates (
    id CHAR(36) NOT NULL PRIMARY KEY,
    batch_id CHAR(36) NOT NULL,
    recipient_profile_id CHAR(36) NOT NULL,
    certificate_code VARCHAR(100) NOT NULL UNIQUE,
    render_payload JSON NOT NULL,
    storage_path VARCHAR(500) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'valid',
    issued_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    revoked_at DATETIME(6) NULL,
    revocation_reason TEXT NULL,
    CONSTRAINT fk_issued_certificates_batch FOREIGN KEY (batch_id) REFERENCES certificate_issuance_batches(id) ON DELETE CASCADE,
    CONSTRAINT fk_issued_certificates_recipient FOREIGN KEY (recipient_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT ck_issued_certificates_status CHECK (status IN ('valid', 'revoked', 'expired'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
