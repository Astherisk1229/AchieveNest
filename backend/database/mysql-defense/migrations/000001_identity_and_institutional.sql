-- ============================================================================
-- Migration: 000001_identity_and_institutional.sql
-- Domain: Identity Foundation, Institutional Structure, and Core Profiles
-- Engine: MySQL 8.4.7 (InnoDB, utf8mb4_unicode_ci)
-- ============================================================================

-- 1. Roles Catalog (Authoritative system and governance roles)
CREATE TABLE IF NOT EXISTS roles (
    id CHAR(36) NOT NULL PRIMARY KEY,
    role_key VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    is_system_role BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Colleges (Academic Colleges)
CREATE TABLE IF NOT EXISTS colleges (
    id CHAR(36) NOT NULL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT ck_colleges_status CHECK (status IN ('active', 'inactive'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Academic Programs (Undergraduate and other accredited degree programs)
CREATE TABLE IF NOT EXISTS academic_programs (
    id CHAR(36) NOT NULL PRIMARY KEY,
    college_id CHAR(36) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    degree_level VARCHAR(30) NOT NULL DEFAULT 'undergraduate',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_academic_programs_college FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
    CONSTRAINT ck_academic_programs_degree_level CHECK (degree_level IN ('undergraduate', 'graduate', 'certificate', 'diploma')),
    CONSTRAINT ck_academic_programs_status CHECK (status IN ('active', 'inactive', 'archived'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Administrative Units (Central offices and support departments)
CREATE TABLE IF NOT EXISTS administrative_units (
    id CHAR(36) NOT NULL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL UNIQUE,
    unit_type VARCHAR(50) NOT NULL DEFAULT 'central_office',
    college_id CHAR(36) NULL,
    description TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_administrative_units_college FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
    CONSTRAINT ck_administrative_units_unit_type CHECK (unit_type IN ('central_office', 'college_based_office', 'other')),
    CONSTRAINT ck_administrative_units_status CHECK (status IN ('active', 'inactive', 'archived')),
    CONSTRAINT ck_administrative_units_college_scope CHECK (
        (unit_type = 'college_based_office' AND college_id IS NOT NULL) OR
        (unit_type <> 'college_based_office' AND college_id IS NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Profiles (Central identity table for all university stakeholders)
CREATE TABLE IF NOT EXISTS profiles (
    id CHAR(36) NOT NULL PRIMARY KEY,
    institutional_id VARCHAR(50) NOT NULL UNIQUE,
    account_type VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NULL,
    middle_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NULL,
    designation_title VARCHAR(150) NULL,
    avatar_url TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    must_change_password BOOLEAN NOT NULL DEFAULT 1,
    password_hash VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT ck_profiles_account_type CHECK (account_type IN ('student', 'personnel', 'hr_admin', 'osad_admin')),
    CONSTRAINT ck_profiles_status CHECK (status IN ('active', 'suspended', 'inactive', 'archived'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Profile Roles (Generic/global role assignments)
CREATE TABLE IF NOT EXISTS profile_roles (
    id CHAR(36) NOT NULL PRIMARY KEY,
    profile_id CHAR(36) NOT NULL,
    role_id CHAR(36) NOT NULL,
    scope_type VARCHAR(30) NOT NULL DEFAULT 'university',
    scope_id CHAR(36) NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    assigned_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    assigned_by CHAR(36) NULL,
    CONSTRAINT fk_profile_roles_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_profile_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_profile_roles_assigner FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE SET NULL,
    CONSTRAINT ck_profile_roles_scope_type CHECK (scope_type IN ('university', 'college', 'academic_program', 'administrative_unit', 'organization'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Student Profiles (Domain extension for students)
CREATE TABLE IF NOT EXISTS student_profiles (
    profile_id CHAR(36) NOT NULL PRIMARY KEY,
    year_level VARCHAR(20) NULL,
    enrollment_status VARCHAR(30) NOT NULL DEFAULT 'enrolled',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_student_profiles_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT ck_student_profiles_enrollment_status CHECK (enrollment_status IN ('enrolled', 'graduated', 'leave_of_absence', 'withdrawn', 'dropped'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Personnel Profiles (Domain extension for faculty and staff)
CREATE TABLE IF NOT EXISTS personnel_profiles (
    profile_id CHAR(36) NOT NULL PRIMARY KEY,
    personnel_classification VARCHAR(30) NOT NULL DEFAULT 'academic',
    employment_status VARCHAR(30) NOT NULL DEFAULT 'full_time',
    rank_level VARCHAR(50) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_personnel_profiles_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT ck_personnel_profiles_classification CHECK (personnel_classification IN ('academic', 'non_academic')),
    CONSTRAINT ck_personnel_profiles_employment_status CHECK (employment_status IN ('full_time', 'part_time', 'contractual', 'visiting'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Account Lifecycle Events (Audit history for account lifecycle transitions)
CREATE TABLE IF NOT EXISTS account_lifecycle_events (
    id CHAR(36) NOT NULL PRIMARY KEY,
    profile_id CHAR(36) NOT NULL,
    actor_profile_id CHAR(36) NULL,
    event_type VARCHAR(50) NOT NULL,
    previous_status VARCHAR(20) NULL,
    new_status VARCHAR(20) NOT NULL,
    reason TEXT NULL,
    metadata JSON NULL,
    occurred_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_account_lifecycle_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_account_lifecycle_actor FOREIGN KEY (actor_profile_id) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
