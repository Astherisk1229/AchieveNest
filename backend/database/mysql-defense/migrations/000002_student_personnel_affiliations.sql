-- AchieveNest WAMP/MySQL Defense Migration Package
-- Migration: 000002_student_personnel_affiliations.sql
-- Status: REVIEW ONLY — DO NOT EXECUTE YET
-- Target: MySQL 8.4.7 / achievenest_local

SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
SET time_zone = '+00:00';

-- -----------------------------------------------------------------------------
-- student_profiles
-- -----------------------------------------------------------------------------
CREATE TABLE student_profiles (
    profile_id CHAR(36) NOT NULL,
    student_status VARCHAR(16) NOT NULL DEFAULT 'active',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (profile_id),
    CONSTRAINT fk_student_profiles_profile
        FOREIGN KEY (profile_id) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT chk_student_profiles_status
        CHECK (student_status IN ('active', 'inactive', 'graduated', 'archived'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- student_program_enrollments
-- History-retaining placement. Student College is always derived through Program.
-- At most one active enrollment per Student.
-- -----------------------------------------------------------------------------
CREATE TABLE student_program_enrollments (
    id CHAR(36) NOT NULL,
    student_profile_id CHAR(36) NOT NULL,
    academic_program_id CHAR(36) NOT NULL,
    year_level VARCHAR(32) NULL,
    academic_year VARCHAR(32) NULL,
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    recorded_by CHAR(36) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    active_student_guard CHAR(36) GENERATED ALWAYS AS (
        CASE WHEN is_active = TRUE THEN student_profile_id ELSE NULL END
    ) STORED,

    PRIMARY KEY (id),
    CONSTRAINT uq_student_program_enrollments_active_student UNIQUE (active_student_guard),
    CONSTRAINT fk_student_program_enrollments_student
        FOREIGN KEY (student_profile_id) REFERENCES student_profiles(profile_id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_student_program_enrollments_program
        FOREIGN KEY (academic_program_id) REFERENCES academic_programs(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_program_enrollments_recorded_by
        FOREIGN KEY (recorded_by) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT chk_student_program_enrollments_dates
        CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT chk_student_program_enrollments_active_dates
        CHECK (
            (is_active = TRUE AND effective_to IS NULL)
            OR (is_active = FALSE)
        ),
    INDEX idx_student_program_enrollments_student (student_profile_id),
    INDEX idx_student_program_enrollments_program (academic_program_id),
    INDEX idx_student_program_enrollments_active_program (academic_program_id, is_active),
    INDEX idx_student_program_enrollments_recorded_by (recorded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- personnel_profiles
-- -----------------------------------------------------------------------------
CREATE TABLE personnel_profiles (
    profile_id CHAR(36) NOT NULL,
    personnel_classification VARCHAR(16) NOT NULL,
    employment_status VARCHAR(32) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (profile_id),
    CONSTRAINT fk_personnel_profiles_profile
        FOREIGN KEY (profile_id) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT chk_personnel_profiles_classification
        CHECK (personnel_classification IN ('academic', 'non_academic'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- personnel_college_affiliations
-- Academic Personnel only. At most one active College affiliation per Personnel.
-- Classification/eligibility is additionally enforced by service/trigger guards
-- in the final constraint migration because it is a cross-table invariant.
-- -----------------------------------------------------------------------------
CREATE TABLE personnel_college_affiliations (
    id CHAR(36) NOT NULL,
    personnel_profile_id CHAR(36) NOT NULL,
    college_id CHAR(36) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    recorded_by CHAR(36) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    active_personnel_guard CHAR(36) GENERATED ALWAYS AS (
        CASE WHEN is_active = TRUE THEN personnel_profile_id ELSE NULL END
    ) STORED,

    PRIMARY KEY (id),
    CONSTRAINT uq_personnel_college_affiliations_active_personnel UNIQUE (active_personnel_guard),
    CONSTRAINT fk_personnel_college_affiliations_personnel
        FOREIGN KEY (personnel_profile_id) REFERENCES personnel_profiles(profile_id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_personnel_college_affiliations_college
        FOREIGN KEY (college_id) REFERENCES colleges(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_personnel_college_affiliations_recorded_by
        FOREIGN KEY (recorded_by) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT chk_personnel_college_affiliations_dates
        CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT chk_personnel_college_affiliations_active_dates
        CHECK (
            (is_active = TRUE AND effective_to IS NULL)
            OR (is_active = FALSE)
        ),
    INDEX idx_personnel_college_affiliations_personnel (personnel_profile_id),
    INDEX idx_personnel_college_affiliations_college (college_id),
    INDEX idx_personnel_college_affiliations_college_active (college_id, is_active),
    INDEX idx_personnel_college_affiliations_recorded_by (recorded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- personnel_program_affiliations
-- Academic Personnel may serve one or more Programs within their active College.
-- Duplicate active Personnel+Program affiliation is prohibited.
-- Program->College consistency is enforced in the final guard migration/service.
-- -----------------------------------------------------------------------------
CREATE TABLE personnel_program_affiliations (
    id CHAR(36) NOT NULL,
    personnel_profile_id CHAR(36) NOT NULL,
    academic_program_id CHAR(36) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    recorded_by CHAR(36) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    active_personnel_guard CHAR(36) GENERATED ALWAYS AS (
        CASE WHEN is_active = TRUE THEN personnel_profile_id ELSE NULL END
    ) STORED,
    active_program_guard CHAR(36) GENERATED ALWAYS AS (
        CASE WHEN is_active = TRUE THEN academic_program_id ELSE NULL END
    ) STORED,

    PRIMARY KEY (id),
    CONSTRAINT uq_personnel_program_affiliations_active_pair
        UNIQUE (active_personnel_guard, active_program_guard),
    CONSTRAINT fk_personnel_program_affiliations_personnel
        FOREIGN KEY (personnel_profile_id) REFERENCES personnel_profiles(profile_id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_personnel_program_affiliations_program
        FOREIGN KEY (academic_program_id) REFERENCES academic_programs(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_personnel_program_affiliations_recorded_by
        FOREIGN KEY (recorded_by) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT chk_personnel_program_affiliations_dates
        CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT chk_personnel_program_affiliations_active_dates
        CHECK (
            (is_active = TRUE AND effective_to IS NULL)
            OR (is_active = FALSE)
        ),
    INDEX idx_personnel_program_affiliations_personnel (personnel_profile_id),
    INDEX idx_personnel_program_affiliations_program (academic_program_id),
    INDEX idx_personnel_program_affiliations_program_active (academic_program_id, is_active),
    INDEX idx_personnel_program_affiliations_recorded_by (recorded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- personnel_administrative_unit_affiliations
-- Non-Academic Personnel only. At most one active Administrative Unit per Personnel.
-- Classification eligibility is a cross-table invariant handled by the final
-- guard/service migration and regression tests.
-- -----------------------------------------------------------------------------
CREATE TABLE personnel_administrative_unit_affiliations (
    id CHAR(36) NOT NULL,
    personnel_profile_id CHAR(36) NOT NULL,
    administrative_unit_id CHAR(36) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    recorded_by CHAR(36) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    active_personnel_guard CHAR(36) GENERATED ALWAYS AS (
        CASE WHEN is_active = TRUE THEN personnel_profile_id ELSE NULL END
    ) STORED,

    PRIMARY KEY (id),
    CONSTRAINT uq_personnel_admin_unit_affiliations_active_personnel UNIQUE (active_personnel_guard),
    CONSTRAINT fk_personnel_admin_unit_affiliations_personnel
        FOREIGN KEY (personnel_profile_id) REFERENCES personnel_profiles(profile_id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_personnel_admin_unit_affiliations_unit
        FOREIGN KEY (administrative_unit_id) REFERENCES administrative_units(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_personnel_admin_unit_affiliations_recorded_by
        FOREIGN KEY (recorded_by) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT chk_personnel_admin_unit_affiliations_dates
        CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT chk_personnel_admin_unit_affiliations_active_dates
        CHECK (
            (is_active = TRUE AND effective_to IS NULL)
            OR (is_active = FALSE)
        ),
    INDEX idx_personnel_admin_unit_affiliations_personnel (personnel_profile_id),
    INDEX idx_personnel_admin_unit_affiliations_unit (administrative_unit_id),
    INDEX idx_personnel_admin_unit_affiliations_unit_active (administrative_unit_id, is_active),
    INDEX idx_personnel_admin_unit_affiliations_recorded_by (recorded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
