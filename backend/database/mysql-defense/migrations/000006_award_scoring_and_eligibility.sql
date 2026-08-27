-- ============================================================================
-- Migration: 000006_award_scoring_and_eligibility.sql
-- Domain: Award Scoring Rules, Portfolio Mappings, OSAD Evaluation, and Dean Nominations
-- Engine: MySQL 8.4.7 (InnoDB, utf8mb4_unicode_ci)
-- ============================================================================

-- 1. Award Definitions (15 official potential student award standards)
CREATE TABLE IF NOT EXISTS award_definitions (
    id CHAR(36) NOT NULL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL DEFAULT 'leadership',
    description TEXT NULL,
    candidate_threshold_percent DECIMAL(5,2) NOT NULL DEFAULT 80.00,
    gender_restriction VARCHAR(20) NULL,
    graduating_only BOOLEAN NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    metadata JSON NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT ck_award_definitions_threshold CHECK (candidate_threshold_percent >= 0.00 AND candidate_threshold_percent <= 100.00),
    CONSTRAINT ck_award_definitions_gender CHECK (gender_restriction IS NULL OR gender_restriction IN ('male', 'female')),
    CONSTRAINT ck_award_definitions_status CHECK (status IN ('draft', 'active', 'archived'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Award Criteria (Multi-criteria rubrics per award definition)
CREATE TABLE IF NOT EXISTS award_criteria (
    id CHAR(36) NOT NULL PRIMARY KEY,
    award_definition_id CHAR(36) NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    weight DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    max_points DECIMAL(10,2) NOT NULL,
    sort_order INT NOT NULL DEFAULT 1,
    is_portfolio_computable BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_award_criteria_award FOREIGN KEY (award_definition_id) REFERENCES award_definitions(id) ON DELETE CASCADE,
    CONSTRAINT ck_award_criteria_max_points CHECK (max_points >= 0.00),
    UNIQUE KEY uq_award_criterion_code (award_definition_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Award Scoring Rules (Granular evaluation rules and point caps)
CREATE TABLE IF NOT EXISTS award_scoring_rules (
    id CHAR(36) NOT NULL PRIMARY KEY,
    criterion_id CHAR(36) NOT NULL,
    parent_rule_id CHAR(36) NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    points DECIMAL(10,2) NULL,
    max_points DECIMAL(10,2) NULL,
    rule_config JSON NULL,
    sort_order INT NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_scoring_rules_criterion FOREIGN KEY (criterion_id) REFERENCES award_criteria(id) ON DELETE CASCADE,
    CONSTRAINT fk_scoring_rules_parent FOREIGN KEY (parent_rule_id) REFERENCES award_scoring_rules(id) ON DELETE CASCADE,
    CONSTRAINT ck_scoring_rules_type CHECK (rule_type IN ('highest_only', 'sum_capped', 'count_mapping', 'fixed_presence', 'matrix_mapping', 'formula', 'other_configured')),
    CONSTRAINT ck_scoring_rules_max_points CHECK (max_points IS NULL OR max_points >= 0.00),
    UNIQUE KEY uq_criterion_rule_code (criterion_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Award Portfolio Mappings (Links taxonomy categories/subcategories to scoring rules)
CREATE TABLE IF NOT EXISTS award_portfolio_mappings (
    id CHAR(36) NOT NULL PRIMARY KEY,
    scoring_rule_id CHAR(36) NOT NULL,
    portfolio_category_id CHAR(36) NOT NULL,
    portfolio_subcategory_id CHAR(36) NULL,
    metadata_predicate JSON NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_award_mappings_rule FOREIGN KEY (scoring_rule_id) REFERENCES award_scoring_rules(id) ON DELETE CASCADE,
    CONSTRAINT fk_award_mappings_category FOREIGN KEY (portfolio_category_id) REFERENCES portfolio_categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_award_mappings_subcategory FOREIGN KEY (portfolio_subcategory_id) REFERENCES portfolio_subcategories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Award Cycles (Academic period/cycle for student award processing)
CREATE TABLE IF NOT EXISTS award_cycles (
    id CHAR(36) NOT NULL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    academic_year VARCHAR(20) NOT NULL,
    name VARCHAR(150) NOT NULL,
    semester VARCHAR(20) NOT NULL DEFAULT '2nd Semester',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    candidate_threshold DECIMAL(5,2) NOT NULL DEFAULT 80.00,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    opens_at DATETIME(6) NULL,
    closes_at DATETIME(6) NULL,
    created_by CHAR(36) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_award_cycles_creator FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT,
    CONSTRAINT ck_award_cycles_status CHECK (status IN ('draft', 'evaluating', 'active', 'evaluation_closed', 'finalized', 'archived'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Student Award Evaluations (Automated scoring evaluation for Student + Award + Cycle)
CREATE TABLE IF NOT EXISTS student_award_evaluations (
    id CHAR(36) NOT NULL PRIMARY KEY,
    cycle_id CHAR(36) NOT NULL,
    award_definition_id CHAR(36) NOT NULL,
    student_profile_id CHAR(36) NOT NULL,
    evaluator_profile_id CHAR(36) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    raw_score DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    max_computable_score DECIMAL(10,2) NOT NULL DEFAULT 100.00,
    potential_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    qualifies_portfolio_based BOOLEAN NOT NULL DEFAULT 0,
    evaluated_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_student_evaluations_cycle FOREIGN KEY (cycle_id) REFERENCES award_cycles(id) ON DELETE CASCADE,
    CONSTRAINT fk_student_evaluations_award FOREIGN KEY (award_definition_id) REFERENCES award_definitions(id) ON DELETE RESTRICT,
    CONSTRAINT fk_student_evaluations_student FOREIGN KEY (student_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_student_evaluations_evaluator FOREIGN KEY (evaluator_profile_id) REFERENCES profiles(id) ON DELETE SET NULL,
    CONSTRAINT ck_student_evaluations_status CHECK (status IN ('pending', 'calculated', 'in_review', 'completed', 'verified', 'finalized', 'superseded')),
    CONSTRAINT ck_student_evaluations_raw_score CHECK (raw_score >= 0.00),
    CONSTRAINT ck_student_evaluations_max_score CHECK (max_computable_score > 0.00),
    CONSTRAINT ck_student_evaluations_potential_score CHECK (potential_score >= 0.00 AND potential_score <= 100.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Student Award Criterion Scores (Calculated points per rubric criterion)
CREATE TABLE IF NOT EXISTS student_award_criterion_scores (
    id CHAR(36) NOT NULL PRIMARY KEY,
    evaluation_id CHAR(36) NOT NULL,
    criterion_id CHAR(36) NOT NULL,
    awarded_points DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    max_points DECIMAL(10,2) NOT NULL,
    scoring_snapshot JSON NULL,
    evaluator_remarks TEXT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_criterion_scores_evaluation FOREIGN KEY (evaluation_id) REFERENCES student_award_evaluations(id) ON DELETE CASCADE,
    CONSTRAINT fk_criterion_scores_criterion FOREIGN KEY (criterion_id) REFERENCES award_criteria(id) ON DELETE RESTRICT,
    CONSTRAINT ck_criterion_scores_awarded CHECK (awarded_points >= 0.00),
    CONSTRAINT ck_criterion_scores_max CHECK (max_points >= 0.00),
    UNIQUE KEY uq_eval_criterion (evaluation_id, criterion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Student Award Score Evidence (Verified portfolio record contribution mapping)
CREATE TABLE IF NOT EXISTS student_award_score_evidence (
    id CHAR(36) NOT NULL PRIMARY KEY,
    criterion_score_id CHAR(36) NOT NULL,
    portfolio_record_id CHAR(36) NOT NULL,
    scoring_rule_id CHAR(36) NULL,
    points_effect DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    basis_snapshot JSON NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_score_evidence_criterion_score FOREIGN KEY (criterion_score_id) REFERENCES student_award_criterion_scores(id) ON DELETE CASCADE,
    CONSTRAINT fk_score_evidence_portfolio_record FOREIGN KEY (portfolio_record_id) REFERENCES student_portfolio_records(id) ON DELETE RESTRICT,
    CONSTRAINT fk_score_evidence_scoring_rule FOREIGN KEY (scoring_rule_id) REFERENCES award_scoring_rules(id) ON DELETE SET NULL,
    UNIQUE KEY uq_critscore_portrec (criterion_score_id, portfolio_record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Award Evaluation Summary Reports (Official report snapshots generated by OSAD)
CREATE TABLE IF NOT EXISTS award_evaluation_summary_reports (
    id CHAR(36) NOT NULL PRIMARY KEY,
    cycle_id CHAR(36) NOT NULL,
    award_definition_id CHAR(36) NOT NULL,
    college_id CHAR(36) NULL,
    generated_by CHAR(36) NOT NULL,
    report_payload JSON NOT NULL,
    total_evaluated INT NOT NULL DEFAULT 0,
    potential_candidates_count INT NOT NULL DEFAULT 0,
    generated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_summary_reports_cycle FOREIGN KEY (cycle_id) REFERENCES award_cycles(id) ON DELETE CASCADE,
    CONSTRAINT fk_summary_reports_award FOREIGN KEY (award_definition_id) REFERENCES award_definitions(id) ON DELETE RESTRICT,
    CONSTRAINT fk_summary_reports_college FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
    CONSTRAINT fk_summary_reports_generator FOREIGN KEY (generated_by) REFERENCES profiles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Dean Student Nominations (Independent dean endorsement pathway)
CREATE TABLE IF NOT EXISTS dean_student_nominations (
    id CHAR(36) NOT NULL PRIMARY KEY,
    cycle_id CHAR(36) NOT NULL,
    award_definition_id CHAR(36) NOT NULL,
    student_profile_id CHAR(36) NOT NULL,
    dean_assignment_id CHAR(36) NULL,
    dean_profile_id CHAR(36) NULL,
    college_id CHAR(36) NULL,
    justification TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    nominated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    withdrawn_at DATETIME(6) NULL,
    withdrawal_reason TEXT NULL,
    CONSTRAINT fk_dean_nominations_cycle FOREIGN KEY (cycle_id) REFERENCES award_cycles(id) ON DELETE CASCADE,
    CONSTRAINT fk_dean_nominations_award FOREIGN KEY (award_definition_id) REFERENCES award_definitions(id) ON DELETE RESTRICT,
    CONSTRAINT fk_dean_nominations_student FOREIGN KEY (student_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_dean_nominations_dean_assignment FOREIGN KEY (dean_assignment_id) REFERENCES dean_assignments(id) ON DELETE RESTRICT,
    CONSTRAINT fk_dean_nominations_dean_profile FOREIGN KEY (dean_profile_id) REFERENCES profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_dean_nominations_college FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
    CONSTRAINT ck_dean_nominations_status CHECK (status IN ('active', 'endorsed', 'withdrawn', 'revoked'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Award Interview Eligibilities (Final eligibility gate: automated threshold or dean nomination)
CREATE TABLE IF NOT EXISTS award_interview_eligibilities (
    id CHAR(36) NOT NULL PRIMARY KEY,
    cycle_id CHAR(36) NOT NULL,
    award_definition_id CHAR(36) NOT NULL,
    student_profile_id CHAR(36) NOT NULL,
    eligibility_source VARCHAR(30) NOT NULL,
    pathway VARCHAR(30) NOT NULL DEFAULT 'automated_threshold',
    evaluation_id CHAR(36) NULL,
    dean_nomination_id CHAR(36) NULL,
    potential_score DECIMAL(5,2) NULL,
    eligible_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    status VARCHAR(20) NOT NULL DEFAULT 'eligible',
    revoked_at DATETIME(6) NULL,
    revoked_by CHAR(36) NULL,
    revocation_reason TEXT NULL,
    CONSTRAINT fk_interview_eligibility_cycle FOREIGN KEY (cycle_id) REFERENCES award_cycles(id) ON DELETE CASCADE,
    CONSTRAINT fk_interview_eligibility_award FOREIGN KEY (award_definition_id) REFERENCES award_definitions(id) ON DELETE RESTRICT,
    CONSTRAINT fk_interview_eligibility_student FOREIGN KEY (student_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_interview_eligibility_evaluation FOREIGN KEY (evaluation_id) REFERENCES student_award_evaluations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_interview_eligibility_nomination FOREIGN KEY (dean_nomination_id) REFERENCES dean_student_nominations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_interview_eligibility_revoker FOREIGN KEY (revoked_by) REFERENCES profiles(id) ON DELETE SET NULL,
    CONSTRAINT ck_interview_eligibility_source CHECK (eligibility_source IN ('portfolio_based', 'dean_nomination')),
    CONSTRAINT ck_interview_eligibility_pathway CHECK (pathway IN ('automated_threshold', 'dean_nomination', 'both')),
    CONSTRAINT ck_interview_eligibility_score CHECK (potential_score IS NULL OR (potential_score >= 0.00 AND potential_score <= 100.00)),
    CONSTRAINT ck_interview_eligibility_status CHECK (status IN ('eligible', 'scheduled', 'completed', 'withdrawn', 'revoked')),
    CONSTRAINT ck_award_eligibility_source_reference CHECK (
        (eligibility_source = 'portfolio_based' AND evaluation_id IS NOT NULL AND dean_nomination_id IS NULL) OR
        (eligibility_source = 'dean_nomination' AND dean_nomination_id IS NOT NULL AND evaluation_id IS NULL)
    ),
    UNIQUE KEY uq_cycle_award_student_source (cycle_id, award_definition_id, student_profile_id, eligibility_source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
