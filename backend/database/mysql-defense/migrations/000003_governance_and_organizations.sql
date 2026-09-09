-- ============================================================================
-- Migration: 000003_governance_and_organizations.sql
-- Domain: Student Organizations, Governance Assignments (Dean, Coordinator, Moderator)
-- Engine: MySQL 8.4.7 (InnoDB, utf8mb4_unicode_ci)
-- ============================================================================

-- 1. Organizations (Recognized student councils, academic societies, and clubs)
CREATE TABLE IF NOT EXISTS organizations (
    id CHAR(36) NOT NULL PRIMARY KEY,
    college_id CHAR(36) NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    scope VARCHAR(30) NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_organizations_college FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
    CONSTRAINT ck_organizations_scope CHECK (scope IN ('university', 'college', 'program')),
    CONSTRAINT ck_organizations_category CHECK (category IN ('academic_college', 'co_curricular', 'special_interest', 'socio_cultural', 'religious', 'sports', 'student_council')),
    CONSTRAINT ck_organizations_status CHECK (status IN ('active', 'inactive', 'archived'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Organization Program Affiliations (Junction linking organizations to academic programs)
CREATE TABLE IF NOT EXISTS organization_program_affiliations (
    id CHAR(36) NOT NULL PRIMARY KEY,
    organization_id CHAR(36) NOT NULL,
    academic_program_id CHAR(36) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_org_prog_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_org_prog_program FOREIGN KEY (academic_program_id) REFERENCES academic_programs(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_org_program (organization_id, academic_program_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Dean Assignments (Specialized college-scoped dean appointments)
CREATE TABLE IF NOT EXISTS dean_assignments (
    id CHAR(36) NOT NULL PRIMARY KEY,
    personnel_profile_id CHAR(36) NOT NULL,
    college_id CHAR(36) NOT NULL,
    effective_from DATE NOT NULL,
    effective_until DATE NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    assigned_by CHAR(36) NULL,
    assigned_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_dean_assign_personnel FOREIGN KEY (personnel_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_dean_assign_college FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
    CONSTRAINT fk_dean_assign_assigner FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Program Coordinator Assignments (Specialized program-scoped coordinator appointments)
CREATE TABLE IF NOT EXISTS program_coordinator_assignments (
    id CHAR(36) NOT NULL PRIMARY KEY,
    personnel_profile_id CHAR(36) NOT NULL,
    academic_program_id CHAR(36) NOT NULL,
    effective_from DATE NOT NULL,
    effective_until DATE NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    assigned_by CHAR(36) NULL,
    assigned_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_prog_coord_personnel FOREIGN KEY (personnel_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_prog_coord_program FOREIGN KEY (academic_program_id) REFERENCES academic_programs(id) ON DELETE RESTRICT,
    CONSTRAINT fk_prog_coord_assigner FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Organization Moderator Assignments (Faculty adviser assignments for student organizations)
CREATE TABLE IF NOT EXISTS organization_moderator_assignments (
    id CHAR(36) NOT NULL PRIMARY KEY,
    organization_id CHAR(36) NOT NULL,
    personnel_profile_id CHAR(36) NOT NULL,
    effective_from DATE NOT NULL,
    effective_until DATE NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    assigned_by CHAR(36) NULL,
    assigned_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_org_mod_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_org_mod_personnel FOREIGN KEY (personnel_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_org_mod_assigner FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
