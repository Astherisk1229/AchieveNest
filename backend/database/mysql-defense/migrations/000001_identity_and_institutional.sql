-- AchieveNest WAMP/MySQL Defense Migration Package
-- Migration: 000001_identity_and_institutional.sql
-- Status: REVIEW ONLY — DO NOT EXECUTE YET
-- Target: MySQL 8.4.7 / achievenest_local
-- Authority: Final Target Data Schema v1.0 + Finalized Structure and Relationship Model

SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
SET time_zone = '+00:00';

-- -----------------------------------------------------------------------------
-- roles
-- Permanent role rows are seeded later from the approved authoritative source.
-- -----------------------------------------------------------------------------
CREATE TABLE roles (
    id CHAR(36) NOT NULL,
    role_key VARCHAR(64) NOT NULL,
    display_name VARCHAR(128) NOT NULL,
    description TEXT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uq_roles_role_key UNIQUE (role_key),
    CONSTRAINT chk_roles_role_key_nonblank CHECK (TRIM(role_key) <> ''),
    CONSTRAINT chk_roles_role_key_lower CHECK (role_key = LOWER(role_key)),
    CONSTRAINT chk_roles_display_name_nonblank CHECK (TRIM(display_name) <> '')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- colleges
-- -----------------------------------------------------------------------------
CREATE TABLE colleges (
    id CHAR(36) NOT NULL,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'active',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uq_colleges_code UNIQUE (code),
    CONSTRAINT chk_colleges_code_nonblank CHECK (TRIM(code) <> ''),
    CONSTRAINT chk_colleges_name_nonblank CHECK (TRIM(name) <> ''),
    CONSTRAINT chk_colleges_status CHECK (status IN ('active', 'inactive', 'archived'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- academic_programs
-- Final target replacement for legacy degree_programs.
-- Department does not exist in the final hierarchy.
-- -----------------------------------------------------------------------------
CREATE TABLE academic_programs (
    id CHAR(36) NOT NULL,
    college_id CHAR(36) NOT NULL,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    degree_level VARCHAR(64) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'active',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uq_academic_programs_code UNIQUE (code),
    CONSTRAINT fk_academic_programs_college
        FOREIGN KEY (college_id) REFERENCES colleges(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT chk_academic_programs_code_nonblank CHECK (TRIM(code) <> ''),
    CONSTRAINT chk_academic_programs_name_nonblank CHECK (TRIM(name) <> ''),
    CONSTRAINT chk_academic_programs_degree_level_nonblank CHECK (TRIM(degree_level) <> ''),
    CONSTRAINT chk_academic_programs_status CHECK (status IN ('active', 'inactive', 'archived')),
    INDEX idx_academic_programs_college_id (college_id),
    INDEX idx_academic_programs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- administrative_units
-- Non-academic institutional structure, separate from College/Program.
-- -----------------------------------------------------------------------------
CREATE TABLE administrative_units (
    id CHAR(36) NOT NULL,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    unit_type VARCHAR(32) NOT NULL,
    college_id CHAR(36) NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'active',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uq_administrative_units_code UNIQUE (code),
    CONSTRAINT fk_administrative_units_college
        FOREIGN KEY (college_id) REFERENCES colleges(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT chk_administrative_units_code_nonblank CHECK (TRIM(code) <> ''),
    CONSTRAINT chk_administrative_units_name_nonblank CHECK (TRIM(name) <> ''),
    CONSTRAINT chk_administrative_units_unit_type
        CHECK (unit_type IN ('central_office', 'college_based_office', 'other')),
    CONSTRAINT chk_administrative_units_status
        CHECK (status IN ('active', 'inactive', 'archived')),
    CONSTRAINT chk_administrative_units_college_scope CHECK (
        (unit_type = 'college_based_office' AND college_id IS NOT NULL)
        OR (unit_type <> 'college_based_office' AND college_id IS NULL)
    ),
    INDEX idx_administrative_units_college_id (college_id),
    INDEX idx_administrative_units_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- profiles
-- Business identity source of truth.
-- Local authentication credentials are stored separately.
-- No Department/Program placement columns are stored here.
-- -----------------------------------------------------------------------------
CREATE TABLE profiles (
    id CHAR(36) NOT NULL,
    institutional_id VARCHAR(64) NOT NULL,
    institutional_email VARCHAR(255) NOT NULL,
    first_name VARCHAR(128) NOT NULL,
    middle_name VARCHAR(128) NULL,
    last_name VARCHAR(128) NOT NULL,
    suffix VARCHAR(32) NULL,
    full_name VARCHAR(384) NOT NULL,
    account_type VARCHAR(32) NOT NULL,
    designation VARCHAR(255) NULL,
    avatar_path VARCHAR(512) NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'provisioned',
    provisioning_method VARCHAR(32) NULL,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    created_by CHAR(36) NULL,
    provisioned_at DATETIME(6) NULL,
    activated_at DATETIME(6) NULL,
    last_login_at DATETIME(6) NULL,
    suspended_at DATETIME(6) NULL,
    suspended_by CHAR(36) NULL,
    suspension_reason TEXT NULL,
    archived_at DATETIME(6) NULL,
    archived_by CHAR(36) NULL,
    archive_reason TEXT NULL,
    restored_at DATETIME(6) NULL,
    restored_by CHAR(36) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    -- MySQL active-only uniqueness guards. NULL values do not collide in UNIQUE indexes.
    active_hr_admin_guard TINYINT GENERATED ALWAYS AS (
        CASE WHEN account_type = 'hr_admin' AND status = 'active' THEN 1 ELSE NULL END
    ) STORED,
    active_osad_admin_guard TINYINT GENERATED ALWAYS AS (
        CASE WHEN account_type = 'osad_admin' AND status = 'active' THEN 1 ELSE NULL END
    ) STORED,

    PRIMARY KEY (id),
    CONSTRAINT uq_profiles_institutional_id UNIQUE (institutional_id),
    CONSTRAINT uq_profiles_institutional_email UNIQUE (institutional_email),
    CONSTRAINT uq_profiles_active_hr_admin UNIQUE (active_hr_admin_guard),
    CONSTRAINT uq_profiles_active_osad_admin UNIQUE (active_osad_admin_guard),
    CONSTRAINT fk_profiles_created_by
        FOREIGN KEY (created_by) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_profiles_suspended_by
        FOREIGN KEY (suspended_by) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_profiles_archived_by
        FOREIGN KEY (archived_by) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_profiles_restored_by
        FOREIGN KEY (restored_by) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT chk_profiles_institutional_id_nonblank CHECK (TRIM(institutional_id) <> ''),
    CONSTRAINT chk_profiles_institutional_id_no_dash CHECK (LOCATE('-', institutional_id) = 0),
    CONSTRAINT chk_profiles_email_normalized CHECK (institutional_email = LOWER(TRIM(institutional_email))),
    CONSTRAINT chk_profiles_email_domain CHECK (institutional_email LIKE '%@ndmu.edu.ph'),
    CONSTRAINT chk_profiles_first_name_nonblank CHECK (TRIM(first_name) <> ''),
    CONSTRAINT chk_profiles_last_name_nonblank CHECK (TRIM(last_name) <> ''),
    CONSTRAINT chk_profiles_full_name_nonblank CHECK (TRIM(full_name) <> ''),
    CONSTRAINT chk_profiles_account_type
        CHECK (account_type IN ('student', 'personnel', 'hr_admin', 'osad_admin')),
    CONSTRAINT chk_profiles_status
        CHECK (status IN ('provisioned', 'active', 'suspended', 'archived')),
    CONSTRAINT chk_profiles_suspended_details CHECK (
        status <> 'suspended'
        OR (
            suspended_at IS NOT NULL
            AND suspended_by IS NOT NULL
            AND suspension_reason IS NOT NULL
            AND TRIM(suspension_reason) <> ''
        )
    ),
    CONSTRAINT chk_profiles_archived_details CHECK (
        status <> 'archived'
        OR (
            archived_at IS NOT NULL
            AND archived_by IS NOT NULL
            AND archive_reason IS NOT NULL
            AND TRIM(archive_reason) <> ''
        )
    ),
    INDEX idx_profiles_account_type_status (account_type, status),
    INDEX idx_profiles_created_by (created_by),
    INDEX idx_profiles_suspended_by (suspended_by),
    INDEX idx_profiles_archived_by (archived_by),
    INDEX idx_profiles_restored_by (restored_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- local_auth_credentials
-- Local-defense infrastructure only. It replaces Supabase Auth for defense login.
-- The table contains no roles or institutional scope.
-- -----------------------------------------------------------------------------
CREATE TABLE local_auth_credentials (
    profile_id CHAR(36) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    credential_status VARCHAR(16) NOT NULL DEFAULT 'active',
    password_changed_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (profile_id),
    CONSTRAINT fk_local_auth_credentials_profile
        FOREIGN KEY (profile_id) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT chk_local_auth_credentials_hash_nonblank CHECK (TRIM(password_hash) <> ''),
    CONSTRAINT chk_local_auth_credentials_status
        CHECK (credential_status IN ('active', 'disabled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- profile_roles
-- Coarse application authorization membership only.
-- Explicit business-scope assignment tables in later migrations remain the source
-- of truth for Dean, Program Coordinator, and Organization Moderator scope.
-- -----------------------------------------------------------------------------
CREATE TABLE profile_roles (
    id CHAR(36) NOT NULL,
    profile_id CHAR(36) NOT NULL,
    role_id CHAR(36) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_by CHAR(36) NULL,
    assigned_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    revoked_at DATETIME(6) NULL,

    active_assignment_profile_guard CHAR(36) GENERATED ALWAYS AS (
        CASE WHEN is_active = TRUE THEN profile_id ELSE NULL END
    ) STORED,
    active_assignment_role_guard CHAR(36) GENERATED ALWAYS AS (
        CASE WHEN is_active = TRUE THEN role_id ELSE NULL END
    ) STORED,

    PRIMARY KEY (id),
    CONSTRAINT fk_profile_roles_profile
        FOREIGN KEY (profile_id) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_profile_roles_role
        FOREIGN KEY (role_id) REFERENCES roles(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_profile_roles_assigned_by
        FOREIGN KEY (assigned_by) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT uq_profile_roles_active_membership
        UNIQUE (active_assignment_profile_guard, active_assignment_role_guard),
    CONSTRAINT chk_profile_roles_revocation CHECK (
        (is_active = TRUE AND revoked_at IS NULL)
        OR (is_active = FALSE AND revoked_at IS NOT NULL)
    ),
    INDEX idx_profile_roles_profile_id (profile_id),
    INDEX idx_profile_roles_role_id (role_id),
    INDEX idx_profile_roles_assigned_by (assigned_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- account_lifecycle_events
-- Append-only by application policy.
-- -----------------------------------------------------------------------------
CREATE TABLE account_lifecycle_events (
    id CHAR(36) NOT NULL,
    profile_id CHAR(36) NOT NULL,
    event_type VARCHAR(24) NOT NULL,
    performed_by CHAR(36) NULL,
    reason TEXT NULL,
    occurred_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_account_lifecycle_events_profile
        FOREIGN KEY (profile_id) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_account_lifecycle_events_performed_by
        FOREIGN KEY (performed_by) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT chk_account_lifecycle_events_type
        CHECK (event_type IN ('provisioned', 'activated', 'suspended', 'archived', 'restored')),
    INDEX idx_account_lifecycle_events_profile_time (profile_id, occurred_at),
    INDEX idx_account_lifecycle_events_performed_by (performed_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- password_reset_requests
-- Exact workflow ownership is Student -> OSAD, Personnel -> HR.
-- Never stores passwords or reset tokens.
-- -----------------------------------------------------------------------------
CREATE TABLE password_reset_requests (
    id CHAR(36) NOT NULL,
    profile_id CHAR(36) NOT NULL,
    assigned_office VARCHAR(16) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'pending',
    handled_by CHAR(36) NULL,
    rejection_reason TEXT NULL,
    requested_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    resolved_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_password_reset_requests_profile
        FOREIGN KEY (profile_id) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_password_reset_requests_handled_by
        FOREIGN KEY (handled_by) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT chk_password_reset_requests_office
        CHECK (assigned_office IN ('hr', 'osad')),
    CONSTRAINT chk_password_reset_requests_status
        CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'completed')),
    CONSTRAINT chk_password_reset_requests_rejection CHECK (
        status <> 'rejected'
        OR (rejection_reason IS NOT NULL AND TRIM(rejection_reason) <> '')
    ),
    INDEX idx_password_reset_requests_profile_status (profile_id, status),
    INDEX idx_password_reset_requests_office_status (assigned_office, status),
    INDEX idx_password_reset_requests_handled_by (handled_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- password_reset_events
-- Append-only safe action history. No secrets are stored.
-- -----------------------------------------------------------------------------
CREATE TABLE password_reset_events (
    id CHAR(36) NOT NULL,
    request_id CHAR(36) NOT NULL,
    actor_profile_id CHAR(36) NULL,
    target_profile_id CHAR(36) NOT NULL,
    action VARCHAR(32) NOT NULL,
    safe_context JSON NOT NULL,
    occurred_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_password_reset_events_request
        FOREIGN KEY (request_id) REFERENCES password_reset_requests(id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_password_reset_events_actor
        FOREIGN KEY (actor_profile_id) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_password_reset_events_target
        FOREIGN KEY (target_profile_id) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT chk_password_reset_events_action_nonblank CHECK (TRIM(action) <> ''),
    INDEX idx_password_reset_events_request_time (request_id, occurred_at),
    INDEX idx_password_reset_events_target_time (target_profile_id, occurred_at),
    INDEX idx_password_reset_events_actor (actor_profile_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- role_assignment_events
-- Retained only as coarse-role membership audit. Business assignment tables
-- preserve their own dedicated histories in later migrations.
-- -----------------------------------------------------------------------------
CREATE TABLE role_assignment_events (
    id CHAR(36) NOT NULL,
    profile_role_id CHAR(36) NULL,
    profile_id CHAR(36) NOT NULL,
    role_id CHAR(36) NOT NULL,
    event_type VARCHAR(16) NOT NULL,
    performed_by CHAR(36) NULL,
    reason TEXT NULL,
    occurred_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_role_assignment_events_profile_role
        FOREIGN KEY (profile_role_id) REFERENCES profile_roles(id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_role_assignment_events_profile
        FOREIGN KEY (profile_id) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_role_assignment_events_role
        FOREIGN KEY (role_id) REFERENCES roles(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_role_assignment_events_performed_by
        FOREIGN KEY (performed_by) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT chk_role_assignment_events_type
        CHECK (event_type IN ('assigned', 'revoked')),
    INDEX idx_role_assignment_events_profile_time (profile_id, occurred_at),
    INDEX idx_role_assignment_events_role_time (role_id, occurred_at),
    INDEX idx_role_assignment_events_performed_by (performed_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Explicit exclusions from this migration/package foundation:
--   * departments
--   * degree_programs
--   * profiles.department_id
--   * profiles.degree_program_id
--   * auth.users
--   * storage.buckets / storage.objects
--   * PostgreSQL RLS/database-role/security-definer infrastructure
-- -----------------------------------------------------------------------------
