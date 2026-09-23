-- ============================================================================
-- Migration: 000002_student_personnel_affiliations.sql
-- Domain: Student Academic Enrollments and Personnel Institutional Affiliations
-- Engine: MySQL 8.4.7 (InnoDB, utf8mb4_unicode_ci)
-- ============================================================================

-- 1. Student Program Enrollments (Student degree placement history)
CREATE TABLE IF NOT EXISTS student_program_enrollments (
    id CHAR(36) NOT NULL PRIMARY KEY,
    student_profile_id CHAR(36) NOT NULL,
    academic_program_id CHAR(36) NOT NULL,
    year_level VARCHAR(20) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    effective_from DATE NOT NULL,
    effective_until DATE NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_student_enrollment_student FOREIGN KEY (student_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_student_enrollment_program FOREIGN KEY (academic_program_id) REFERENCES academic_programs(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Personnel College Affiliations (Faculty primary college attachment)
CREATE TABLE IF NOT EXISTS personnel_college_affiliations (
    id CHAR(36) NOT NULL PRIMARY KEY,
    personnel_profile_id CHAR(36) NOT NULL,
    college_id CHAR(36) NOT NULL,
    effective_from DATE NOT NULL,
    effective_until DATE NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_personnel_college_personnel FOREIGN KEY (personnel_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_personnel_college_college FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Personnel Program Affiliations (Faculty teaching/program assignments)
CREATE TABLE IF NOT EXISTS personnel_program_affiliations (
    id CHAR(36) NOT NULL PRIMARY KEY,
    personnel_profile_id CHAR(36) NOT NULL,
    academic_program_id CHAR(36) NOT NULL,
    effective_from DATE NOT NULL,
    effective_until DATE NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_personnel_program_personnel FOREIGN KEY (personnel_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_personnel_program_program FOREIGN KEY (academic_program_id) REFERENCES academic_programs(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Personnel Administrative Unit Affiliations (Non-academic personnel office assignments)
CREATE TABLE IF NOT EXISTS personnel_administrative_unit_affiliations (
    id CHAR(36) NOT NULL PRIMARY KEY,
    personnel_profile_id CHAR(36) NOT NULL,
    administrative_unit_id CHAR(36) NOT NULL,
    effective_from DATE NOT NULL,
    effective_until DATE NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_personnel_unit_personnel FOREIGN KEY (personnel_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_personnel_unit_unit FOREIGN KEY (administrative_unit_id) REFERENCES administrative_units(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
