-- AchieveNest WAMP/MySQL Defense Migration Package
-- Migration: 000003_governance_and_organizations.sql
-- Status: REVIEW ONLY — DO NOT EXECUTE YET
-- Target: MySQL 8.4.7 / achievenest_local

SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
SET time_zone = '+00:00';

-- -----------------------------------------------------------------------------
-- dean_assignments
-- HR-owned business assignment with history retained.
-- Eligibility against active College affiliation is enforced by a later
-- MySQL trigger/service guard because it spans multiple tables.
-- -----------------------------------------------------------------------------
CREATE TABLE dean_assignments (
    id CHAR(36) NOT NULL,
    personnel_profile_id CHAR(36) NOT NULL,
    college_id CHAR(36) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_by CHAR(36) NOT NULL,
    assigned_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ended_by CHAR(36) NULL,
    ended_at DATETIME(6) NULL,
    end_reason TEXT NULL,

    active_college_guard CHAR(36) GENERATED ALWAYS AS (
        CASE WHEN is_active = TRUE THEN college_id ELSE NULL END
    ) STORED,
    active_personnel_guard CHAR(36) GENERATED ALWAYS AS (
        CASE WHEN is_active = TRUE THEN personnel_profile_id ELSE NULL END
    ) STORED,

    PRIMARY KEY (id),
    CONSTRAINT uq_dean_assignments_active_college UNIQUE (active_college_guard),
    CONSTRAINT uq_dean_assignments_active_personnel UNIQUE (active_personnel_guard),
    CONSTRAINT fk_dean_assignments_personnel
        FOREIGN KEY (personnel_profile_id) REFERENCES personnel_profiles(profile_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_dean_assignments_college
        FOREIGN KEY (college_id) REFERENCES colleges(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_dean_assignments_assigned_by
        FOREIGN KEY (assigned_by) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_dean_assignments_ended_by
        FOREIGN KEY (ended_by) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT chk_dean_assignments_dates
        CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT chk_dean_assignments_active_state CHECK (
        (is_active = TRUE AND effective_to IS NULL AND ended_at IS NULL)
        OR (is_active = FALSE)
    ),
    CONSTRAINT chk_dean_assignments_ended_details CHECK (
        is_active = TRUE
        OR (
            ended_at IS NOT NULL
            AND end_reason IS NOT NULL
            AND TRIM(end_reason) <> ''
        )
    ),
    INDEX idx_dean_assignments_personnel (personnel_profile_id),
    INDEX idx_dean_assignments_college (college_id),
    INDEX idx_dean_assignments_assigned_by (assigned_by),
    INDEX idx_dean_assignments_ended_by (ended_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- program_coordinator_assignments
-- OSAD-owned. One active Coordinator per Program; one Personnel may coordinate
-- multiple Programs. Exact Program affiliation eligibility is cross-table.
-- -----------------------------------------------------------------------------
CREATE TABLE program_coordinator_assignments (
    id CHAR(36) NOT NULL,
    personnel_profile_id CHAR(36) NOT NULL,
    academic_program_id CHAR(36) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_by CHAR(36) NOT NULL,
    assigned_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ended_by CHAR(36) NULL,
    ended_at DATETIME(6) NULL,
    end_reason TEXT NULL,

    active_program_guard CHAR(36) GENERATED ALWAYS AS (
        CASE WHEN is_active = TRUE THEN academic_program_id ELSE NULL END
    ) STORED,

    PRIMARY KEY (id),
    CONSTRAINT uq_program_coordinator_assignments_active_program UNIQUE (active_program_guard),
    CONSTRAINT fk_program_coordinator_assignments_personnel
        FOREIGN KEY (personnel_profile_id) REFERENCES personnel_profiles(profile_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_program_coordinator_assignments_program
        FOREIGN KEY (academic_program_id) REFERENCES academic_programs(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_program_coordinator_assignments_assigned_by
        FOREIGN KEY (assigned_by) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_program_coordinator_assignments_ended_by
        FOREIGN KEY (ended_by) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT chk_program_coordinator_assignments_dates
        CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT chk_program_coordinator_assignments_active_state CHECK (
        (is_active = TRUE AND effective_to IS NULL AND ended_at IS NULL)
        OR (is_active = FALSE)
    ),
    CONSTRAINT chk_program_coordinator_assignments_ended_details CHECK (
        is_active = TRUE
        OR (
            ended_at IS NOT NULL
            AND end_reason IS NOT NULL
            AND TRIM(end_reason) <> ''
        )
    ),
    INDEX idx_program_coordinator_assignments_personnel (personnel_profile_id),
    INDEX idx_program_coordinator_assignments_program (academic_program_id),
    INDEX idx_program_coordinator_assignments_assigned_by (assigned_by),
    INDEX idx_program_coordinator_assignments_ended_by (ended_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- organizations
-- Scope and category are separate concepts.
-- -----------------------------------------------------------------------------
CREATE TABLE organizations (
    id CHAR(36) NOT NULL,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    scope VARCHAR(16) NOT NULL,
    category VARCHAR(48) NOT NULL,
    college_id CHAR(36) NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'active',
    created_by CHAR(36) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uq_organizations_code UNIQUE (code),
    CONSTRAINT fk_organizations_college
        FOREIGN KEY (college_id) REFERENCES colleges(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_organizations_created_by
        FOREIGN KEY (created_by) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT chk_organizations_code_nonblank CHECK (TRIM(code) <> ''),
    CONSTRAINT chk_organizations_name_nonblank CHECK (TRIM(name) <> ''),
    CONSTRAINT chk_organizations_scope CHECK (scope IN ('university', 'college')),
    CONSTRAINT chk_organizations_category CHECK (
        category IN (
            'academic_college',
            'ministry_religious',
            'institutional',
            'socio_cultural_performing',
            'other_non_academic'
        )
    ),
    CONSTRAINT chk_organizations_status CHECK (status IN ('active', 'inactive', 'archived')),
    CONSTRAINT chk_organizations_scope_college CHECK (
        (scope = 'university' AND college_id IS NULL)
        OR (scope = 'college' AND college_id IS NOT NULL)
    ),
    INDEX idx_organizations_college_id (college_id),
    INDEX idx_organizations_scope_category (scope, category),
    INDEX idx_organizations_status (status),
    INDEX idx_organizations_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- organization_programs
-- Optional many-to-many Program coverage. Cross-table Program->College equality
-- is enforced by a later guard.
-- -----------------------------------------------------------------------------
CREATE TABLE organization_programs (
    organization_id CHAR(36) NOT NULL,
    academic_program_id CHAR(36) NOT NULL,
    PRIMARY KEY (organization_id, academic_program_id),
    CONSTRAINT fk_organization_programs_organization
        FOREIGN KEY (organization_id) REFERENCES organizations(id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_organization_programs_program
        FOREIGN KEY (academic_program_id) REFERENCES academic_programs(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    INDEX idx_organization_programs_program (academic_program_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- organization_moderator_assignments
-- OSAD-owned. History retained. No unconfirmed maximum number of Organizations
-- per Moderator is invented. College-affiliation eligibility is cross-table.
-- -----------------------------------------------------------------------------
CREATE TABLE organization_moderator_assignments (
    id CHAR(36) NOT NULL,
    organization_id CHAR(36) NOT NULL,
    personnel_profile_id CHAR(36) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_by CHAR(36) NOT NULL,
    assigned_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ended_by CHAR(36) NULL,
    ended_at DATETIME(6) NULL,
    end_reason TEXT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_organization_moderator_assignments_organization
        FOREIGN KEY (organization_id) REFERENCES organizations(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_organization_moderator_assignments_personnel
        FOREIGN KEY (personnel_profile_id) REFERENCES personnel_profiles(profile_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_organization_moderator_assignments_assigned_by
        FOREIGN KEY (assigned_by) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_organization_moderator_assignments_ended_by
        FOREIGN KEY (ended_by) REFERENCES profiles(id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT chk_organization_moderator_assignments_dates
        CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT chk_organization_moderator_assignments_active_state CHECK (
        (is_active = TRUE AND effective_to IS NULL AND ended_at IS NULL)
        OR (is_active = FALSE)
    ),
    CONSTRAINT chk_organization_moderator_assignments_ended_details CHECK (
        is_active = TRUE
        OR (
            ended_at IS NOT NULL
            AND end_reason IS NOT NULL
            AND TRIM(end_reason) <> ''
        )
    ),
    INDEX idx_organization_moderator_assignments_organization_active (organization_id, is_active),
    INDEX idx_organization_moderator_assignments_personnel_active (personnel_profile_id, is_active),
    INDEX idx_organization_moderator_assignments_assigned_by (assigned_by),
    INDEX idx_organization_moderator_assignments_ended_by (ended_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
