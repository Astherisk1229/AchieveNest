# AchieveNest — Phase B: Detailed Table Attribute Inventory

> **Database:** `achievenest_local` (WAMP / MySQL)  
> **Phase:** Phase B — Table Attribute Inventory & Semantic Classification  
> **Audit Scope:** Attribute ownership, business meaning, source of truth, functional dependency, and 3NF classification across all 64 tables.  

---

### Table: `academic_programs`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `academic_programs.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `college_id` | `char(36)` | NO | MUL | Entity attribute | `academic_programs.college_id` | Directly dependent on `academic_programs` PK | **AUTHORITATIVE** | KEEP |
| 3 | `code` | `varchar(20)` | NO | UNI | Entity attribute | `academic_programs.code` | Directly dependent on `academic_programs` PK | **AUTHORITATIVE** | KEEP |
| 4 | `name` | `varchar(150)` | NO | - | Entity attribute | `academic_programs.name` | Directly dependent on `academic_programs` PK | **AUTHORITATIVE** | KEEP |
| 5 | `degree_level` | `varchar(30)` | NO | - | Entity attribute | `academic_programs.degree_level` | Directly dependent on `academic_programs` PK | **AUTHORITATIVE** | KEEP |
| 6 | `status` | `varchar(20)` | NO | - | Entity attribute | `academic_programs.status` | Directly dependent on `academic_programs` PK | **AUTHORITATIVE** | KEEP |
| 7 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `academic_programs.created_at` | Depends on `academic_programs` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 8 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `academic_programs.updated_at` | Depends on `academic_programs` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `account_lifecycle_events`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `account_lifecycle_events.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `profile_id` | `char(36)` | NO | MUL | Entity attribute | `account_lifecycle_events.profile_id` | Directly dependent on `account_lifecycle_events` PK | **AUTHORITATIVE** | KEEP |
| 3 | `actor_profile_id` | `char(36)` | YES | MUL | Entity attribute | `account_lifecycle_events.actor_profile_id` | Directly dependent on `account_lifecycle_events` PK | **AUTHORITATIVE** | KEEP |
| 4 | `event_type` | `varchar(50)` | NO | - | Entity attribute | `account_lifecycle_events.event_type` | Directly dependent on `account_lifecycle_events` PK | **AUTHORITATIVE** | KEEP |
| 5 | `previous_status` | `varchar(20)` | YES | - | Entity attribute | `account_lifecycle_events.previous_status` | Directly dependent on `account_lifecycle_events` PK | **AUTHORITATIVE** | KEEP |
| 6 | `new_status` | `varchar(20)` | NO | - | Entity attribute | `account_lifecycle_events.new_status` | Directly dependent on `account_lifecycle_events` PK | **AUTHORITATIVE** | KEEP |
| 7 | `reason` | `text` | YES | - | Entity attribute | `account_lifecycle_events.reason` | Directly dependent on `account_lifecycle_events` PK | **AUTHORITATIVE** | KEEP |
| 8 | `metadata` | `json` | YES | - | Entity attribute | `account_lifecycle_events.metadata` | Directly dependent on `account_lifecycle_events` PK | **AUTHORITATIVE** | KEEP |
| 9 | `occurred_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `account_lifecycle_events.occurred_at` | Depends on `account_lifecycle_events` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `administrative_units`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `administrative_units.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `code` | `varchar(20)` | NO | UNI | Entity attribute | `administrative_units.code` | Directly dependent on `administrative_units` PK | **AUTHORITATIVE** | KEEP |
| 3 | `name` | `varchar(150)` | NO | UNI | Entity attribute | `administrative_units.name` | Directly dependent on `administrative_units` PK | **AUTHORITATIVE** | KEEP |
| 4 | `unit_type` | `varchar(50)` | NO | - | Entity attribute | `administrative_units.unit_type` | Directly dependent on `administrative_units` PK | **AUTHORITATIVE** | KEEP |
| 5 | `college_id` | `char(36)` | YES | MUL | Entity attribute | `administrative_units.college_id` | Directly dependent on `administrative_units` PK | **AUTHORITATIVE** | KEEP |
| 6 | `description` | `text` | YES | - | Entity attribute | `administrative_units.description` | Directly dependent on `administrative_units` PK | **AUTHORITATIVE** | KEEP |
| 7 | `status` | `varchar(20)` | NO | - | Entity attribute | `administrative_units.status` | Directly dependent on `administrative_units` PK | **AUTHORITATIVE** | KEEP |
| 8 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `administrative_units.created_at` | Depends on `administrative_units` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 9 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `administrative_units.updated_at` | Depends on `administrative_units` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `attendance_records`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `attendance_records.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `session_id` | `char(36)` | NO | MUL | Entity attribute | `attendance_records.session_id` | Directly dependent on `attendance_records` PK | **AUTHORITATIVE** | KEEP |
| 3 | `attendee_profile_id` | `char(36)` | NO | MUL | Entity attribute | `attendance_records.attendee_profile_id` | Directly dependent on `attendance_records` PK | **AUTHORITATIVE** | KEEP |
| 4 | `scanned_by` | `char(36)` | YES | MUL | Audit / lifecycle timestamp or actor reference | `attendance_records.scanned_by` | Depends on `attendance_records` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 5 | `checked_in_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `attendance_records.checked_in_at` | Depends on `attendance_records` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 6 | `verification_method` | `varchar(30)` | NO | - | Entity attribute | `attendance_records.verification_method` | Directly dependent on `attendance_records` PK | **AUTHORITATIVE** | KEEP |

### Table: `attendance_sessions`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `attendance_sessions.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `event_id` | `char(36)` | NO | MUL | Entity attribute | `attendance_sessions.event_id` | Directly dependent on `attendance_sessions` PK | **AUTHORITATIVE** | KEEP |
| 3 | `session_name` | `varchar(150)` | NO | - | Entity attribute | `attendance_sessions.session_name` | Directly dependent on `attendance_sessions` PK | **AUTHORITATIVE** | KEEP |
| 4 | `session_type` | `varchar(30)` | NO | - | Entity attribute | `attendance_sessions.session_type` | Directly dependent on `attendance_sessions` PK | **AUTHORITATIVE** | KEEP |
| 5 | `check_in_start` | `datetime(6)` | NO | - | Entity attribute | `attendance_sessions.check_in_start` | Directly dependent on `attendance_sessions` PK | **AUTHORITATIVE** | KEEP |
| 6 | `check_in_end` | `datetime(6)` | NO | - | Entity attribute | `attendance_sessions.check_in_end` | Directly dependent on `attendance_sessions` PK | **AUTHORITATIVE** | KEEP |
| 7 | `status` | `varchar(20)` | NO | - | Entity attribute | `attendance_sessions.status` | Directly dependent on `attendance_sessions` PK | **AUTHORITATIVE** | KEEP |
| 8 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `attendance_sessions.created_at` | Depends on `attendance_sessions` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 9 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `attendance_sessions.updated_at` | Depends on `attendance_sessions` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `audit_logs`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `audit_logs.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `actor_profile_id` | `char(36)` | YES | MUL | Entity attribute | `audit_logs.actor_profile_id` | Directly dependent on `audit_logs` PK | **AUTHORITATIVE** | KEEP |
| 3 | `event_code` | `varchar(100)` | NO | MUL | Entity attribute | `audit_logs.event_code` | Directly dependent on `audit_logs` PK | **AUTHORITATIVE** | KEEP |
| 4 | `category` | `varchar(50)` | NO | - | Entity attribute | `audit_logs.category` | Directly dependent on `audit_logs` PK | **AUTHORITATIVE** | KEEP |
| 5 | `target_type` | `varchar(50)` | YES | - | Entity attribute | `audit_logs.target_type` | Directly dependent on `audit_logs` PK | **AUTHORITATIVE** | KEEP |
| 6 | `target_id` | `char(36)` | YES | - | Entity attribute | `audit_logs.target_id` | Directly dependent on `audit_logs` PK | **AUTHORITATIVE** | KEEP |
| 7 | `outcome` | `varchar(20)` | NO | - | Entity attribute | `audit_logs.outcome` | Directly dependent on `audit_logs` PK | **AUTHORITATIVE** | KEEP |
| 8 | `ip_address` | `varchar(45)` | YES | - | Entity attribute | `audit_logs.ip_address` | Directly dependent on `audit_logs` PK | **AUTHORITATIVE** | KEEP |
| 9 | `user_agent` | `text` | YES | - | Entity attribute | `audit_logs.user_agent` | Directly dependent on `audit_logs` PK | **AUTHORITATIVE** | KEEP |
| 10 | `details` | `text` | NO | - | Entity attribute | `audit_logs.details` | Directly dependent on `audit_logs` PK | **AUTHORITATIVE** | KEEP |
| 11 | `safe_context` | `json` | YES | - | Entity attribute | `audit_logs.safe_context` | Directly dependent on `audit_logs` PK | **AUTHORITATIVE** | KEEP |
| 12 | `created_at` | `datetime(6)` | NO | MUL | Audit / lifecycle timestamp or actor reference | `audit_logs.created_at` | Depends on `audit_logs` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `award_candidate_manual_decisions`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `award_candidate_manual_decisions.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `cycle_id` | `char(36)` | NO | MUL | Entity attribute | `award_candidate_manual_decisions.cycle_id` | Directly dependent on `award_candidate_manual_decisions` PK | **AUTHORITATIVE** | KEEP |
| 3 | `award_definition_id` | `char(36)` | NO | MUL | Entity attribute | `award_candidate_manual_decisions.award_definition_id` | Directly dependent on `award_candidate_manual_decisions` PK | **AUTHORITATIVE** | KEEP |
| 4 | `student_profile_id` | `char(36)` | NO | MUL | Entity attribute | `award_candidate_manual_decisions.student_profile_id` | Directly dependent on `award_candidate_manual_decisions` PK | **AUTHORITATIVE** | KEEP |
| 5 | `decision_type` | `varchar(50)` | NO | - | Entity attribute | `award_candidate_manual_decisions.decision_type` | Directly dependent on `award_candidate_manual_decisions` PK | **AUTHORITATIVE** | KEEP |
| 6 | `reason` | `text` | NO | - | Entity attribute | `award_candidate_manual_decisions.reason` | Directly dependent on `award_candidate_manual_decisions` PK | **AUTHORITATIVE** | KEEP |
| 7 | `decided_by` | `char(36)` | NO | MUL | Audit / lifecycle timestamp or actor reference | `award_candidate_manual_decisions.decided_by` | Depends on `award_candidate_manual_decisions` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 8 | `previous_status` | `varchar(50)` | YES | - | Entity attribute | `award_candidate_manual_decisions.previous_status` | Directly dependent on `award_candidate_manual_decisions` PK | **AUTHORITATIVE** | KEEP |
| 9 | `new_status` | `varchar(50)` | NO | - | Entity attribute | `award_candidate_manual_decisions.new_status` | Directly dependent on `award_candidate_manual_decisions` PK | **AUTHORITATIVE** | KEEP |
| 10 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `award_candidate_manual_decisions.created_at` | Depends on `award_candidate_manual_decisions` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 11 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `award_candidate_manual_decisions.updated_at` | Depends on `award_candidate_manual_decisions` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `award_criteria`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `award_criteria.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `award_definition_id` | `char(36)` | NO | MUL | Entity attribute | `award_criteria.award_definition_id` | Directly dependent on `award_criteria` PK | **AUTHORITATIVE** | KEEP |
| 3 | `scoring_model_version_id` | `char(36)` | YES | - | Entity attribute | `award_criteria.scoring_model_version_id` | Directly dependent on `award_criteria` PK | **AUTHORITATIVE** | KEEP |
| 4 | `code` | `varchar(50)` | NO | - | Entity attribute | `award_criteria.code` | Directly dependent on `award_criteria` PK | **AUTHORITATIVE** | KEEP |
| 5 | `name` | `varchar(200)` | NO | - | Entity attribute | `award_criteria.name` | Directly dependent on `award_criteria` PK | **AUTHORITATIVE** | KEEP |
| 6 | `weight` | `decimal(5,2)` | NO | - | Entity attribute | `award_criteria.weight` | Directly dependent on `award_criteria` PK | **AUTHORITATIVE** | KEEP |
| 7 | `max_points` | `decimal(10,2)` | NO | - | Entity attribute | `award_criteria.max_points` | Directly dependent on `award_criteria` PK | **AUTHORITATIVE** | KEEP |
| 8 | `sort_order` | `int` | NO | - | Entity attribute | `award_criteria.sort_order` | Directly dependent on `award_criteria` PK | **AUTHORITATIVE** | KEEP |
| 9 | `is_portfolio_computable` | `tinyint(1)` | NO | - | Entity attribute | `award_criteria.is_portfolio_computable` | Directly dependent on `award_criteria` PK | **AUTHORITATIVE** | KEEP |
| 10 | `authority_status` | `varchar(50)` | NO | - | Entity attribute | `award_criteria.authority_status` | Directly dependent on `award_criteria` PK | **AUTHORITATIVE** | KEEP |
| 11 | `source_rubric_reference` | `varchar(255)` | YES | - | Entity attribute | `award_criteria.source_rubric_reference` | Directly dependent on `award_criteria` PK | **AUTHORITATIVE** | KEEP |
| 12 | `is_published` | `tinyint(1)` | NO | - | Entity attribute | `award_criteria.is_published` | Directly dependent on `award_criteria` PK | **AUTHORITATIVE** | KEEP |
| 13 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `award_criteria.created_at` | Depends on `award_criteria` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 14 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `award_criteria.updated_at` | Depends on `award_criteria` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `award_criterion_components`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `award_criterion_components.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `criterion_id` | `char(36)` | NO | MUL | Entity attribute | `award_criterion_components.criterion_id` | Directly dependent on `award_criterion_components` PK | **AUTHORITATIVE** | KEEP |
| 3 | `code` | `varchar(50)` | NO | - | Entity attribute | `award_criterion_components.code` | Directly dependent on `award_criterion_components` PK | **AUTHORITATIVE** | KEEP |
| 4 | `name` | `varchar(200)` | NO | - | Entity attribute | `award_criterion_components.name` | Directly dependent on `award_criterion_components` PK | **AUTHORITATIVE** | KEEP |
| 5 | `description` | `text` | YES | - | Entity attribute | `award_criterion_components.description` | Directly dependent on `award_criterion_components` PK | **AUTHORITATIVE** | KEEP |
| 6 | `max_points` | `decimal(10,2)` | NO | - | Entity attribute | `award_criterion_components.max_points` | Directly dependent on `award_criterion_components` PK | **AUTHORITATIVE** | KEEP |
| 7 | `sort_order` | `int` | NO | - | Entity attribute | `award_criterion_components.sort_order` | Directly dependent on `award_criterion_components` PK | **AUTHORITATIVE** | KEEP |
| 8 | `is_computable` | `tinyint(1)` | NO | - | Entity attribute | `award_criterion_components.is_computable` | Directly dependent on `award_criterion_components` PK | **AUTHORITATIVE** | KEEP |
| 9 | `authority_status` | `varchar(50)` | NO | - | Entity attribute | `award_criterion_components.authority_status` | Directly dependent on `award_criterion_components` PK | **AUTHORITATIVE** | KEEP |
| 10 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `award_criterion_components.created_at` | Depends on `award_criterion_components` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 11 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `award_criterion_components.updated_at` | Depends on `award_criterion_components` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `award_cycles`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `award_cycles.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `code` | `varchar(50)` | NO | UNI | Entity attribute | `award_cycles.code` | Directly dependent on `award_cycles` PK | **AUTHORITATIVE** | KEEP |
| 3 | `academic_year` | `varchar(20)` | NO | - | Entity attribute | `award_cycles.academic_year` | Directly dependent on `award_cycles` PK | **AUTHORITATIVE** | KEEP |
| 4 | `name` | `varchar(150)` | NO | - | Entity attribute | `award_cycles.name` | Directly dependent on `award_cycles` PK | **AUTHORITATIVE** | KEEP |
| 5 | `semester` | `varchar(20)` | NO | - | Entity attribute | `award_cycles.semester` | Directly dependent on `award_cycles` PK | **AUTHORITATIVE** | KEEP |
| 6 | `start_date` | `date` | NO | - | Entity attribute | `award_cycles.start_date` | Directly dependent on `award_cycles` PK | **AUTHORITATIVE** | KEEP |
| 7 | `end_date` | `date` | NO | - | Entity attribute | `award_cycles.end_date` | Directly dependent on `award_cycles` PK | **AUTHORITATIVE** | KEEP |
| 8 | `candidate_threshold` | `decimal(5,2)` | NO | - | Entity attribute | `award_cycles.candidate_threshold` | Directly dependent on `award_cycles` PK | **AUTHORITATIVE** | KEEP |
| 9 | `status` | `varchar(20)` | NO | - | Entity attribute | `award_cycles.status` | Directly dependent on `award_cycles` PK | **AUTHORITATIVE** | KEEP |
| 10 | `opens_at` | `datetime(6)` | YES | - | Audit / lifecycle timestamp or actor reference | `award_cycles.opens_at` | Depends on `award_cycles` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 11 | `closes_at` | `datetime(6)` | YES | - | Audit / lifecycle timestamp or actor reference | `award_cycles.closes_at` | Depends on `award_cycles` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 12 | `created_by` | `char(36)` | NO | MUL | Audit / lifecycle timestamp or actor reference | `award_cycles.created_by` | Depends on `award_cycles` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 13 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `award_cycles.created_at` | Depends on `award_cycles` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `award_definitions`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `award_definitions.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `code` | `varchar(50)` | NO | UNI | Entity attribute | `award_definitions.code` | Directly dependent on `award_definitions` PK | **AUTHORITATIVE** | KEEP |
| 3 | `name` | `varchar(200)` | NO | UNI | Entity attribute | `award_definitions.name` | Directly dependent on `award_definitions` PK | **AUTHORITATIVE** | KEEP |
| 4 | `category` | `varchar(50)` | NO | - | Entity attribute | `award_definitions.category` | Directly dependent on `award_definitions` PK | **AUTHORITATIVE** | KEEP |
| 5 | `description` | `text` | YES | - | Entity attribute | `award_definitions.description` | Directly dependent on `award_definitions` PK | **AUTHORITATIVE** | KEEP |
| 6 | `candidate_threshold_percent` | `decimal(5,2)` | NO | - | Entity attribute | `award_definitions.candidate_threshold_percent` | Directly dependent on `award_definitions` PK | **AUTHORITATIVE** | KEEP |
| 7 | `gender_restriction` | `varchar(20)` | YES | - | Entity attribute | `award_definitions.gender_restriction` | Directly dependent on `award_definitions` PK | **AUTHORITATIVE** | KEEP |
| 8 | `graduating_only` | `tinyint(1)` | NO | - | Entity attribute | `award_definitions.graduating_only` | Directly dependent on `award_definitions` PK | **AUTHORITATIVE** | KEEP |
| 9 | `status` | `varchar(20)` | NO | - | Entity attribute | `award_definitions.status` | Directly dependent on `award_definitions` PK | **AUTHORITATIVE** | KEEP |
| 10 | `authority_status` | `varchar(50)` | NO | - | Entity attribute | `award_definitions.authority_status` | Directly dependent on `award_definitions` PK | **AUTHORITATIVE** | KEEP |
| 11 | `source_fidelity_status` | `varchar(50)` | NO | - | Entity attribute | `award_definitions.source_fidelity_status` | Directly dependent on `award_definitions` PK | **AUTHORITATIVE** | KEEP |
| 12 | `is_catalog_visible` | `tinyint(1)` | NO | - | Entity attribute | `award_definitions.is_catalog_visible` | Directly dependent on `award_definitions` PK | **AUTHORITATIVE** | KEEP |
| 13 | `active_scoring_version` | `varchar(20)` | NO | - | Entity attribute | `award_definitions.active_scoring_version` | Directly dependent on `award_definitions` PK | **AUTHORITATIVE** | KEEP |
| 14 | `metadata` | `json` | YES | - | Entity attribute | `award_definitions.metadata` | Directly dependent on `award_definitions` PK | **AUTHORITATIVE** | KEEP |
| 15 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `award_definitions.created_at` | Depends on `award_definitions` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 16 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `award_definitions.updated_at` | Depends on `award_definitions` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `award_evaluation_summary_reports`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `award_evaluation_summary_reports.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `cycle_id` | `char(36)` | NO | MUL | Entity attribute | `award_evaluation_summary_reports.cycle_id` | Directly dependent on `award_evaluation_summary_reports` PK | **AUTHORITATIVE** | KEEP |
| 3 | `award_definition_id` | `char(36)` | NO | MUL | Entity attribute | `award_evaluation_summary_reports.award_definition_id` | Directly dependent on `award_evaluation_summary_reports` PK | **AUTHORITATIVE** | KEEP |
| 4 | `college_id` | `char(36)` | YES | MUL | Entity attribute | `award_evaluation_summary_reports.college_id` | Directly dependent on `award_evaluation_summary_reports` PK | **AUTHORITATIVE** | KEEP |
| 5 | `generated_by` | `char(36)` | NO | MUL | Audit / lifecycle timestamp or actor reference | `award_evaluation_summary_reports.generated_by` | Depends on `award_evaluation_summary_reports` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 6 | `report_payload` | `json` | NO | - | Entity attribute | `award_evaluation_summary_reports.report_payload` | Directly dependent on `award_evaluation_summary_reports` PK | **AUTHORITATIVE** | KEEP |
| 7 | `total_evaluated` | `int` | NO | - | Entity attribute | `award_evaluation_summary_reports.total_evaluated` | Directly dependent on `award_evaluation_summary_reports` PK | **AUTHORITATIVE** | KEEP |
| 8 | `potential_candidates_count` | `int` | NO | - | Entity attribute | `award_evaluation_summary_reports.potential_candidates_count` | Directly dependent on `award_evaluation_summary_reports` PK | **AUTHORITATIVE** | KEEP |
| 9 | `generated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `award_evaluation_summary_reports.generated_at` | Depends on `award_evaluation_summary_reports` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `award_evidence_mapping_conditions`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `award_evidence_mapping_conditions.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `mapping_rule_id` | `char(36)` | NO | MUL | Entity attribute | `award_evidence_mapping_conditions.mapping_rule_id` | Directly dependent on `award_evidence_mapping_conditions` PK | **AUTHORITATIVE** | KEEP |
| 3 | `field_key` | `varchar(100)` | NO | MUL | Entity attribute | `award_evidence_mapping_conditions.field_key` | Directly dependent on `award_evidence_mapping_conditions` PK | **AUTHORITATIVE** | KEEP |
| 4 | `operator` | `varchar(20)` | NO | - | Entity attribute | `award_evidence_mapping_conditions.operator` | Directly dependent on `award_evidence_mapping_conditions` PK | **AUTHORITATIVE** | KEEP |
| 5 | `comparison_value` | `text` | YES | - | Entity attribute | `award_evidence_mapping_conditions.comparison_value` | Directly dependent on `award_evidence_mapping_conditions` PK | **AUTHORITATIVE** | KEEP |
| 6 | `group_number` | `int` | NO | - | Entity attribute | `award_evidence_mapping_conditions.group_number` | Directly dependent on `award_evidence_mapping_conditions` PK | **AUTHORITATIVE** | KEEP |
| 7 | `display_order` | `int` | NO | - | Entity attribute | `award_evidence_mapping_conditions.display_order` | Directly dependent on `award_evidence_mapping_conditions` PK | **AUTHORITATIVE** | KEEP |
| 8 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `award_evidence_mapping_conditions.created_at` | Depends on `award_evidence_mapping_conditions` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 9 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `award_evidence_mapping_conditions.updated_at` | Depends on `award_evidence_mapping_conditions` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `award_evidence_mapping_rules`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `award_evidence_mapping_rules.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `scoring_model_version_id` | `char(36)` | NO | MUL | Entity attribute | `award_evidence_mapping_rules.scoring_model_version_id` | Directly dependent on `award_evidence_mapping_rules` PK | **AUTHORITATIVE** | KEEP |
| 3 | `criterion_id` | `char(36)` | NO | MUL | Entity attribute | `award_evidence_mapping_rules.criterion_id` | Directly dependent on `award_evidence_mapping_rules` PK | **AUTHORITATIVE** | KEEP |
| 4 | `criterion_component_id` | `char(36)` | YES | MUL | Entity attribute | `award_evidence_mapping_rules.criterion_component_id` | Directly dependent on `award_evidence_mapping_rules` PK | **AUTHORITATIVE** | KEEP |
| 5 | `rule_code` | `varchar(100)` | NO | - | Entity attribute | `award_evidence_mapping_rules.rule_code` | Directly dependent on `award_evidence_mapping_rules` PK | **AUTHORITATIVE** | KEEP |
| 6 | `name` | `varchar(200)` | NO | - | Entity attribute | `award_evidence_mapping_rules.name` | Directly dependent on `award_evidence_mapping_rules` PK | **AUTHORITATIVE** | KEEP |
| 7 | `description` | `text` | YES | - | Entity attribute | `award_evidence_mapping_rules.description` | Directly dependent on `award_evidence_mapping_rules` PK | **AUTHORITATIVE** | KEEP |
| 8 | `portfolio_category_id` | `char(36)` | NO | MUL | Entity attribute | `award_evidence_mapping_rules.portfolio_category_id` | Directly dependent on `award_evidence_mapping_rules` PK | **AUTHORITATIVE** | KEEP |
| 9 | `portfolio_subcategory_id` | `char(36)` | YES | MUL | Entity attribute | `award_evidence_mapping_rules.portfolio_subcategory_id` | Directly dependent on `award_evidence_mapping_rules` PK | **AUTHORITATIVE** | KEEP |
| 10 | `authority_status` | `varchar(50)` | NO | - | Entity attribute | `award_evidence_mapping_rules.authority_status` | Directly dependent on `award_evidence_mapping_rules` PK | **AUTHORITATIVE** | KEEP |
| 11 | `priority` | `int` | NO | - | Entity attribute | `award_evidence_mapping_rules.priority` | Directly dependent on `award_evidence_mapping_rules` PK | **AUTHORITATIVE** | KEEP |
| 12 | `is_active` | `tinyint(1)` | NO | MUL | Entity attribute | `award_evidence_mapping_rules.is_active` | Directly dependent on `award_evidence_mapping_rules` PK | **AUTHORITATIVE** | KEEP |
| 13 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `award_evidence_mapping_rules.created_at` | Depends on `award_evidence_mapping_rules` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 14 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `award_evidence_mapping_rules.updated_at` | Depends on `award_evidence_mapping_rules` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `award_interview_eligibilities`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `award_interview_eligibilities.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `cycle_id` | `char(36)` | NO | MUL | Entity attribute | `award_interview_eligibilities.cycle_id` | Directly dependent on `award_interview_eligibilities` PK | **AUTHORITATIVE** | KEEP |
| 3 | `award_definition_id` | `char(36)` | NO | MUL | Entity attribute | `award_interview_eligibilities.award_definition_id` | Directly dependent on `award_interview_eligibilities` PK | **AUTHORITATIVE** | KEEP |
| 4 | `student_profile_id` | `char(36)` | NO | MUL | Entity attribute | `award_interview_eligibilities.student_profile_id` | Directly dependent on `award_interview_eligibilities` PK | **AUTHORITATIVE** | KEEP |
| 5 | `eligibility_source` | `varchar(30)` | NO | - | Entity attribute | `award_interview_eligibilities.eligibility_source` | Directly dependent on `award_interview_eligibilities` PK | **AUTHORITATIVE** | KEEP |
| 6 | `pathway` | `varchar(30)` | NO | - | Entity attribute | `award_interview_eligibilities.pathway` | Directly dependent on `award_interview_eligibilities` PK | **AUTHORITATIVE** | KEEP |
| 7 | `evaluation_id` | `char(36)` | YES | MUL | Entity attribute | `award_interview_eligibilities.evaluation_id` | Directly dependent on `award_interview_eligibilities` PK | **AUTHORITATIVE** | KEEP |
| 8 | `dean_nomination_id` | `char(36)` | YES | MUL | Entity attribute | `award_interview_eligibilities.dean_nomination_id` | Directly dependent on `award_interview_eligibilities` PK | **AUTHORITATIVE** | KEEP |
| 9 | `potential_score` | `decimal(5,2)` | YES | - | Entity attribute | `award_interview_eligibilities.potential_score` | Directly dependent on `award_interview_eligibilities` PK | **AUTHORITATIVE** | KEEP |
| 10 | `eligible_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `award_interview_eligibilities.eligible_at` | Depends on `award_interview_eligibilities` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 11 | `status` | `varchar(20)` | NO | - | Entity attribute | `award_interview_eligibilities.status` | Directly dependent on `award_interview_eligibilities` PK | **AUTHORITATIVE** | KEEP |
| 12 | `revoked_at` | `datetime(6)` | YES | - | Audit / lifecycle timestamp or actor reference | `award_interview_eligibilities.revoked_at` | Depends on `award_interview_eligibilities` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 13 | `revoked_by` | `char(36)` | YES | MUL | Audit / lifecycle timestamp or actor reference | `award_interview_eligibilities.revoked_by` | Depends on `award_interview_eligibilities` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 14 | `revocation_reason` | `text` | YES | - | Entity attribute | `award_interview_eligibilities.revocation_reason` | Directly dependent on `award_interview_eligibilities` PK | **AUTHORITATIVE** | KEEP |

### Table: `award_portfolio_mappings`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `award_portfolio_mappings.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `scoring_rule_id` | `char(36)` | NO | MUL | Entity attribute | `award_portfolio_mappings.scoring_rule_id` | Directly dependent on `award_portfolio_mappings` PK | **AUTHORITATIVE** | KEEP |
| 3 | `portfolio_category_id` | `char(36)` | NO | MUL | Entity attribute | `award_portfolio_mappings.portfolio_category_id` | Directly dependent on `award_portfolio_mappings` PK | **AUTHORITATIVE** | KEEP |
| 4 | `portfolio_subcategory_id` | `char(36)` | YES | MUL | Entity attribute | `award_portfolio_mappings.portfolio_subcategory_id` | Directly dependent on `award_portfolio_mappings` PK | **AUTHORITATIVE** | KEEP |
| 5 | `metadata_predicate` | `json` | YES | - | Entity attribute | `award_portfolio_mappings.metadata_predicate` | Directly dependent on `award_portfolio_mappings` PK | **AUTHORITATIVE** | KEEP |
| 6 | `is_active` | `tinyint(1)` | NO | - | Entity attribute | `award_portfolio_mappings.is_active` | Directly dependent on `award_portfolio_mappings` PK | **AUTHORITATIVE** | KEEP |
| 7 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `award_portfolio_mappings.created_at` | Depends on `award_portfolio_mappings` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `award_scoring_model_versions`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `award_scoring_model_versions.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `award_definition_id` | `char(36)` | NO | MUL | Entity attribute | `award_scoring_model_versions.award_definition_id` | Directly dependent on `award_scoring_model_versions` PK | **AUTHORITATIVE** | KEEP |
| 3 | `award_cycle_id` | `char(36)` | YES | MUL | Entity attribute | `award_scoring_model_versions.award_cycle_id` | Directly dependent on `award_scoring_model_versions` PK | **AUTHORITATIVE** | KEEP |
| 4 | `version_number` | `varchar(20)` | NO | - | Entity attribute | `award_scoring_model_versions.version_number` | Directly dependent on `award_scoring_model_versions` PK | **AUTHORITATIVE** | KEEP |
| 5 | `version_label` | `varchar(100)` | YES | - | Entity attribute | `award_scoring_model_versions.version_label` | Directly dependent on `award_scoring_model_versions` PK | **AUTHORITATIVE** | KEEP |
| 6 | `status` | `varchar(20)` | NO | MUL | Entity attribute | `award_scoring_model_versions.status` | Directly dependent on `award_scoring_model_versions` PK | **AUTHORITATIVE** | KEEP |
| 7 | `candidate_threshold_percent` | `decimal(5,2)` | NO | - | Entity attribute | `award_scoring_model_versions.candidate_threshold_percent` | Directly dependent on `award_scoring_model_versions` PK | **AUTHORITATIVE** | KEEP |
| 8 | `graduating_only` | `tinyint(1)` | NO | - | Entity attribute | `award_scoring_model_versions.graduating_only` | Directly dependent on `award_scoring_model_versions` PK | **AUTHORITATIVE** | KEEP |
| 9 | `gender_requirement` | `varchar(20)` | YES | - | Entity attribute | `award_scoring_model_versions.gender_requirement` | Directly dependent on `award_scoring_model_versions` PK | **AUTHORITATIVE** | KEEP |
| 10 | `authority_status` | `varchar(50)` | NO | - | Entity attribute | `award_scoring_model_versions.authority_status` | Directly dependent on `award_scoring_model_versions` PK | **AUTHORITATIVE** | KEEP |
| 11 | `published_at` | `datetime(6)` | YES | - | Audit / lifecycle timestamp or actor reference | `award_scoring_model_versions.published_at` | Depends on `award_scoring_model_versions` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 12 | `published_by` | `char(36)` | YES | - | Audit / lifecycle timestamp or actor reference | `award_scoring_model_versions.published_by` | Depends on `award_scoring_model_versions` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 13 | `retired_at` | `datetime(6)` | YES | - | Audit / lifecycle timestamp or actor reference | `award_scoring_model_versions.retired_at` | Depends on `award_scoring_model_versions` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 14 | `retired_by` | `char(36)` | YES | - | Audit / lifecycle timestamp or actor reference | `award_scoring_model_versions.retired_by` | Depends on `award_scoring_model_versions` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 15 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `award_scoring_model_versions.created_at` | Depends on `award_scoring_model_versions` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 16 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `award_scoring_model_versions.updated_at` | Depends on `award_scoring_model_versions` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `award_scoring_rules`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `award_scoring_rules.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `criterion_id` | `char(36)` | NO | MUL | Entity attribute | `award_scoring_rules.criterion_id` | Directly dependent on `award_scoring_rules` PK | **AUTHORITATIVE** | KEEP |
| 3 | `scoring_model_version_id` | `char(36)` | YES | MUL | Entity attribute | `award_scoring_rules.scoring_model_version_id` | Directly dependent on `award_scoring_rules` PK | **AUTHORITATIVE** | KEEP |
| 4 | `criterion_component_id` | `char(36)` | YES | MUL | Entity attribute | `award_scoring_rules.criterion_component_id` | Directly dependent on `award_scoring_rules` PK | **AUTHORITATIVE** | KEEP |
| 5 | `parent_rule_id` | `char(36)` | YES | MUL | Entity attribute | `award_scoring_rules.parent_rule_id` | Directly dependent on `award_scoring_rules` PK | **AUTHORITATIVE** | KEEP |
| 6 | `code` | `varchar(50)` | NO | - | Entity attribute | `award_scoring_rules.code` | Directly dependent on `award_scoring_rules` PK | **AUTHORITATIVE** | KEEP |
| 7 | `name` | `varchar(200)` | NO | - | Entity attribute | `award_scoring_rules.name` | Directly dependent on `award_scoring_rules` PK | **AUTHORITATIVE** | KEEP |
| 8 | `rule_type` | `varchar(50)` | NO | - | Entity attribute | `award_scoring_rules.rule_type` | Directly dependent on `award_scoring_rules` PK | **AUTHORITATIVE** | KEEP |
| 9 | `points` | `decimal(10,2)` | YES | - | Entity attribute | `award_scoring_rules.points` | Directly dependent on `award_scoring_rules` PK | **AUTHORITATIVE** | KEEP |
| 10 | `max_points` | `decimal(10,2)` | YES | - | Entity attribute | `award_scoring_rules.max_points` | Directly dependent on `award_scoring_rules` PK | **AUTHORITATIVE** | KEEP |
| 11 | `rule_config` | `json` | YES | - | Entity attribute | `award_scoring_rules.rule_config` | Directly dependent on `award_scoring_rules` PK | **AUTHORITATIVE** | KEEP |
| 12 | `authority_status` | `varchar(50)` | NO | - | Entity attribute | `award_scoring_rules.authority_status` | Directly dependent on `award_scoring_rules` PK | **AUTHORITATIVE** | KEEP |
| 13 | `is_active` | `tinyint(1)` | NO | MUL | Entity attribute | `award_scoring_rules.is_active` | Directly dependent on `award_scoring_rules` PK | **AUTHORITATIVE** | KEEP |
| 14 | `sort_order` | `int` | NO | - | Entity attribute | `award_scoring_rules.sort_order` | Directly dependent on `award_scoring_rules` PK | **AUTHORITATIVE** | KEEP |
| 15 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `award_scoring_rules.created_at` | Depends on `award_scoring_rules` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 16 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `award_scoring_rules.updated_at` | Depends on `award_scoring_rules` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `award_student_evaluation_summaries`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `award_student_evaluation_summaries.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `evaluation_id` | `char(36)` | NO | UNI | Entity attribute | `award_student_evaluation_summaries.evaluation_id` | Directly dependent on `award_student_evaluation_summaries` PK | **AUTHORITATIVE** | KEEP |
| 3 | `student_profile_id` | `char(36)` | NO | MUL | Entity attribute | `award_student_evaluation_summaries.student_profile_id` | Directly dependent on `award_student_evaluation_summaries` PK | **AUTHORITATIVE** | KEEP |
| 4 | `award_definition_id` | `char(36)` | NO | MUL | Entity attribute | `award_student_evaluation_summaries.award_definition_id` | Directly dependent on `award_student_evaluation_summaries` PK | **AUTHORITATIVE** | KEEP |
| 5 | `cycle_id` | `char(36)` | NO | MUL | Entity attribute | `award_student_evaluation_summaries.cycle_id` | Directly dependent on `award_student_evaluation_summaries` PK | **AUTHORITATIVE** | KEEP |
| 6 | `scoring_model_version_id` | `char(36)` | YES | MUL | Entity attribute | `award_student_evaluation_summaries.scoring_model_version_id` | Directly dependent on `award_student_evaluation_summaries` PK | **AUTHORITATIVE** | KEEP |
| 7 | `summary_payload` | `json` | NO | - | Entity attribute | `award_student_evaluation_summaries.summary_payload` | Directly dependent on `award_student_evaluation_summaries` PK | **AUTHORITATIVE** | KEEP |
| 8 | `raw_score` | `decimal(10,2)` | NO | - | Entity attribute | `award_student_evaluation_summaries.raw_score` | Directly dependent on `award_student_evaluation_summaries` PK | **AUTHORITATIVE** | KEEP |
| 9 | `max_computable_score` | `decimal(10,2)` | NO | - | Entity attribute | `award_student_evaluation_summaries.max_computable_score` | Directly dependent on `award_student_evaluation_summaries` PK | **AUTHORITATIVE** | KEEP |
| 10 | `potential_score` | `decimal(5,2)` | NO | - | Entity attribute | `award_student_evaluation_summaries.potential_score` | Directly dependent on `award_student_evaluation_summaries` PK | **AUTHORITATIVE** | KEEP |
| 11 | `candidate_threshold_percent` | `decimal(5,2)` | NO | - | Entity attribute | `award_student_evaluation_summaries.candidate_threshold_percent` | Directly dependent on `award_student_evaluation_summaries` PK | **AUTHORITATIVE** | KEEP |
| 12 | `qualifies_portfolio_based` | `tinyint(1)` | NO | - | Entity attribute | `award_student_evaluation_summaries.qualifies_portfolio_based` | Directly dependent on `award_student_evaluation_summaries` PK | **AUTHORITATIVE** | KEEP |
| 13 | `candidate_pathway` | `varchar(50)` | NO | - | Entity attribute | `award_student_evaluation_summaries.candidate_pathway` | Directly dependent on `award_student_evaluation_summaries` PK | **AUTHORITATIVE** | KEEP |
| 14 | `generated_by` | `char(36)` | YES | - | Audit / lifecycle timestamp or actor reference | `award_student_evaluation_summaries.generated_by` | Depends on `award_student_evaluation_summaries` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 15 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `award_student_evaluation_summaries.created_at` | Depends on `award_student_evaluation_summaries` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 16 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `award_student_evaluation_summaries.updated_at` | Depends on `award_student_evaluation_summaries` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `certificate_issuance_batches`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `certificate_issuance_batches.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `event_id` | `char(36)` | YES | MUL | Entity attribute | `certificate_issuance_batches.event_id` | Directly dependent on `certificate_issuance_batches` PK | **AUTHORITATIVE** | KEEP |
| 3 | `template_version_id` | `char(36)` | NO | MUL | Entity attribute | `certificate_issuance_batches.template_version_id` | Directly dependent on `certificate_issuance_batches` PK | **AUTHORITATIVE** | KEEP |
| 4 | `issuer_profile_id` | `char(36)` | NO | MUL | Entity attribute | `certificate_issuance_batches.issuer_profile_id` | Directly dependent on `certificate_issuance_batches` PK | **AUTHORITATIVE** | KEEP |
| 5 | `batch_name` | `varchar(150)` | NO | - | Entity attribute | `certificate_issuance_batches.batch_name` | Directly dependent on `certificate_issuance_batches` PK | **AUTHORITATIVE** | KEEP |
| 6 | `issued_count` | `int` | NO | - | Entity attribute | `certificate_issuance_batches.issued_count` | Directly dependent on `certificate_issuance_batches` PK | **AUTHORITATIVE** | KEEP |
| 7 | `status` | `varchar(20)` | NO | - | Entity attribute | `certificate_issuance_batches.status` | Directly dependent on `certificate_issuance_batches` PK | **AUTHORITATIVE** | KEEP |
| 8 | `issued_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `certificate_issuance_batches.issued_at` | Depends on `certificate_issuance_batches` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `certificate_template_families`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `certificate_template_families.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `code` | `varchar(50)` | NO | UNI | Entity attribute | `certificate_template_families.code` | Directly dependent on `certificate_template_families` PK | **AUTHORITATIVE** | KEEP |
| 3 | `name` | `varchar(150)` | NO | - | Entity attribute | `certificate_template_families.name` | Directly dependent on `certificate_template_families` PK | **AUTHORITATIVE** | KEEP |
| 4 | `description` | `text` | YES | - | Entity attribute | `certificate_template_families.description` | Directly dependent on `certificate_template_families` PK | **AUTHORITATIVE** | KEEP |
| 5 | `category` | `varchar(50)` | NO | - | Entity attribute | `certificate_template_families.category` | Directly dependent on `certificate_template_families` PK | **AUTHORITATIVE** | KEEP |
| 6 | `status` | `varchar(20)` | NO | - | Entity attribute | `certificate_template_families.status` | Directly dependent on `certificate_template_families` PK | **AUTHORITATIVE** | KEEP |
| 7 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `certificate_template_families.created_at` | Depends on `certificate_template_families` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 8 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `certificate_template_families.updated_at` | Depends on `certificate_template_families` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `certificate_template_versions`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `certificate_template_versions.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `family_id` | `char(36)` | NO | MUL | Entity attribute | `certificate_template_versions.family_id` | Directly dependent on `certificate_template_versions` PK | **AUTHORITATIVE** | KEEP |
| 3 | `version_number` | `int` | NO | - | Entity attribute | `certificate_template_versions.version_number` | Directly dependent on `certificate_template_versions` PK | **AUTHORITATIVE** | KEEP |
| 4 | `layout_config` | `json` | NO | - | Entity attribute | `certificate_template_versions.layout_config` | Directly dependent on `certificate_template_versions` PK | **AUTHORITATIVE** | KEEP |
| 5 | `signatories_config` | `json` | NO | - | Entity attribute | `certificate_template_versions.signatories_config` | Directly dependent on `certificate_template_versions` PK | **AUTHORITATIVE** | KEEP |
| 6 | `background_storage_path` | `varchar(500)` | YES | - | Entity attribute | `certificate_template_versions.background_storage_path` | Directly dependent on `certificate_template_versions` PK | **AUTHORITATIVE** | KEEP |
| 7 | `status` | `varchar(20)` | NO | - | Entity attribute | `certificate_template_versions.status` | Directly dependent on `certificate_template_versions` PK | **AUTHORITATIVE** | KEEP |
| 8 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `certificate_template_versions.created_at` | Depends on `certificate_template_versions` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `colleges`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `colleges.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `code` | `varchar(20)` | NO | UNI | Entity attribute | `colleges.code` | Directly dependent on `colleges` PK | **AUTHORITATIVE** | KEEP |
| 3 | `name` | `varchar(150)` | NO | - | Entity attribute | `colleges.name` | Directly dependent on `colleges` PK | **AUTHORITATIVE** | KEEP |
| 4 | `description` | `text` | YES | - | Entity attribute | `colleges.description` | Directly dependent on `colleges` PK | **AUTHORITATIVE** | KEEP |
| 5 | `status` | `varchar(20)` | NO | - | Entity attribute | `colleges.status` | Directly dependent on `colleges` PK | **AUTHORITATIVE** | KEEP |
| 6 | `logo_storage_key` | `varchar(500)` | YES | - | Entity attribute | `colleges.logo_storage_key` | Directly dependent on `colleges` PK | **AUTHORITATIVE** | KEEP |
| 7 | `logo_original_name` | `varchar(255)` | YES | - | Entity attribute | `colleges.logo_original_name` | Directly dependent on `colleges` PK | **AUTHORITATIVE** | KEEP |
| 8 | `logo_mime_type` | `varchar(100)` | YES | - | Entity attribute | `colleges.logo_mime_type` | Directly dependent on `colleges` PK | **AUTHORITATIVE** | KEEP |
| 9 | `logo_updated_at` | `datetime(6)` | YES | - | Audit / lifecycle timestamp or actor reference | `colleges.logo_updated_at` | Depends on `colleges` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 10 | `acronym_badge_color` | `varchar(7)` | YES | - | Entity attribute | `colleges.acronym_badge_color` | Directly dependent on `colleges` PK | **AUTHORITATIVE** | KEEP |
| 11 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `colleges.created_at` | Depends on `colleges` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 12 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `colleges.updated_at` | Depends on `colleges` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `dean_assignments`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `dean_assignments.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `personnel_profile_id` | `char(36)` | NO | MUL | Entity attribute | `dean_assignments.personnel_profile_id` | Directly dependent on `dean_assignments` PK | **AUTHORITATIVE** | KEEP |
| 3 | `college_id` | `char(36)` | NO | MUL | Entity attribute | `dean_assignments.college_id` | Directly dependent on `dean_assignments` PK | **AUTHORITATIVE** | KEEP |
| 4 | `effective_from` | `date` | NO | - | Entity attribute | `dean_assignments.effective_from` | Directly dependent on `dean_assignments` PK | **AUTHORITATIVE** | KEEP |
| 5 | `effective_until` | `date` | YES | - | Entity attribute | `dean_assignments.effective_until` | Directly dependent on `dean_assignments` PK | **AUTHORITATIVE** | KEEP |
| 6 | `is_active` | `tinyint(1)` | NO | - | Entity attribute | `dean_assignments.is_active` | Directly dependent on `dean_assignments` PK | **AUTHORITATIVE** | KEEP |
| 7 | `assigned_by` | `char(36)` | YES | MUL | Audit / lifecycle timestamp or actor reference | `dean_assignments.assigned_by` | Depends on `dean_assignments` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 8 | `assigned_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `dean_assignments.assigned_at` | Depends on `dean_assignments` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 9 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `dean_assignments.created_at` | Depends on `dean_assignments` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 10 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `dean_assignments.updated_at` | Depends on `dean_assignments` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 11 | `active_college_dean_guard` | `char(36)` | YES | UNI | Virtual generated column for single-active uniqueness | Generated expression | Depends on `is_active` / status | **DERIVED** | KEEP (Constraint guard mechanism) |
| 12 | `active_personnel_dean_guard` | `char(36)` | YES | UNI | Virtual generated column for single-active uniqueness | Generated expression | Depends on `is_active` / status | **DERIVED** | KEEP (Constraint guard mechanism) |

### Table: `dean_student_nominations`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `dean_student_nominations.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `cycle_id` | `char(36)` | NO | MUL | Entity attribute | `dean_student_nominations.cycle_id` | Directly dependent on `dean_student_nominations` PK | **AUTHORITATIVE** | KEEP |
| 3 | `award_definition_id` | `char(36)` | NO | MUL | Entity attribute | `dean_student_nominations.award_definition_id` | Directly dependent on `dean_student_nominations` PK | **AUTHORITATIVE** | KEEP |
| 4 | `student_profile_id` | `char(36)` | NO | MUL | Entity attribute | `dean_student_nominations.student_profile_id` | Directly dependent on `dean_student_nominations` PK | **AUTHORITATIVE** | KEEP |
| 5 | `dean_assignment_id` | `char(36)` | YES | MUL | Entity attribute | `dean_student_nominations.dean_assignment_id` | Directly dependent on `dean_student_nominations` PK | **AUTHORITATIVE** | KEEP |
| 6 | `dean_profile_id` | `char(36)` | YES | MUL | Entity attribute | `dean_student_nominations.dean_profile_id` | Directly dependent on `dean_student_nominations` PK | **AUTHORITATIVE** | KEEP |
| 7 | `college_id` | `char(36)` | YES | MUL | Entity attribute | `dean_student_nominations.college_id` | Directly dependent on `dean_student_nominations` PK | **AUTHORITATIVE** | KEEP |
| 8 | `justification` | `text` | NO | - | Entity attribute | `dean_student_nominations.justification` | Directly dependent on `dean_student_nominations` PK | **AUTHORITATIVE** | KEEP |
| 9 | `status` | `varchar(20)` | NO | - | Entity attribute | `dean_student_nominations.status` | Directly dependent on `dean_student_nominations` PK | **AUTHORITATIVE** | KEEP |
| 10 | `nominated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `dean_student_nominations.nominated_at` | Depends on `dean_student_nominations` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 11 | `withdrawn_at` | `datetime(6)` | YES | - | Audit / lifecycle timestamp or actor reference | `dean_student_nominations.withdrawn_at` | Depends on `dean_student_nominations` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 12 | `withdrawal_reason` | `text` | YES | - | Entity attribute | `dean_student_nominations.withdrawal_reason` | Directly dependent on `dean_student_nominations` PK | **AUTHORITATIVE** | KEEP |

### Table: `events`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `events.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `organizer_profile_id` | `char(36)` | YES | MUL | Entity attribute | `events.organizer_profile_id` | Directly dependent on `events` PK | **AUTHORITATIVE** | KEEP |
| 3 | `organization_id` | `char(36)` | YES | MUL | Entity attribute | `events.organization_id` | Directly dependent on `events` PK | **AUTHORITATIVE** | KEEP |
| 4 | `college_id` | `char(36)` | YES | MUL | Entity attribute | `events.college_id` | Directly dependent on `events` PK | **AUTHORITATIVE** | KEEP |
| 5 | `administrative_unit_id` | `char(36)` | YES | MUL | Entity attribute | `events.administrative_unit_id` | Directly dependent on `events` PK | **AUTHORITATIVE** | KEEP |
| 6 | `title` | `varchar(255)` | NO | - | Entity attribute | `events.title` | Directly dependent on `events` PK | **AUTHORITATIVE** | KEEP |
| 7 | `description` | `text` | YES | - | Entity attribute | `events.description` | Directly dependent on `events` PK | **AUTHORITATIVE** | KEEP |
| 8 | `event_type` | `varchar(50)` | NO | - | Entity attribute | `events.event_type` | Directly dependent on `events` PK | **AUTHORITATIVE** | KEEP |
| 9 | `start_time` | `datetime(6)` | NO | MUL | Entity attribute | `events.start_time` | Directly dependent on `events` PK | **AUTHORITATIVE** | KEEP |
| 10 | `end_time` | `datetime(6)` | NO | - | Entity attribute | `events.end_time` | Directly dependent on `events` PK | **AUTHORITATIVE** | KEEP |
| 11 | `venue` | `varchar(255)` | YES | - | Entity attribute | `events.venue` | Directly dependent on `events` PK | **AUTHORITATIVE** | KEEP |
| 12 | `status` | `varchar(30)` | NO | MUL | Entity attribute | `events.status` | Directly dependent on `events` PK | **AUTHORITATIVE** | KEEP |
| 13 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `events.created_at` | Depends on `events` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 14 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `events.updated_at` | Depends on `events` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `file_security_audit_events`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `file_security_audit_events.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `actor_profile_id` | `char(36)` | YES | MUL | Entity attribute | `file_security_audit_events.actor_profile_id` | Directly dependent on `file_security_audit_events` PK | **AUTHORITATIVE** | KEEP |
| 3 | `evidence_domain` | `varchar(50)` | NO | MUL | Entity attribute | `file_security_audit_events.evidence_domain` | Directly dependent on `file_security_audit_events` PK | **AUTHORITATIVE** | KEEP |
| 4 | `evidence_id` | `char(36)` | NO | - | Entity attribute | `file_security_audit_events.evidence_id` | Directly dependent on `file_security_audit_events` PK | **AUTHORITATIVE** | KEEP |
| 5 | `storage_bucket` | `varchar(100)` | NO | - | Entity attribute | `file_security_audit_events.storage_bucket` | Directly dependent on `file_security_audit_events` PK | **AUTHORITATIVE** | KEEP |
| 6 | `storage_path` | `varchar(500)` | NO | - | Entity attribute | `file_security_audit_events.storage_path` | Directly dependent on `file_security_audit_events` PK | **AUTHORITATIVE** | KEEP |
| 7 | `detected_mime_type` | `varchar(100)` | NO | - | Entity attribute | `file_security_audit_events.detected_mime_type` | Directly dependent on `file_security_audit_events` PK | **AUTHORITATIVE** | KEEP |
| 8 | `byte_size` | `bigint` | NO | - | Entity attribute | `file_security_audit_events.byte_size` | Directly dependent on `file_security_audit_events` PK | **AUTHORITATIVE** | KEEP |
| 9 | `sha256` | `varchar(64)` | NO | - | Entity attribute | `file_security_audit_events.sha256` | Directly dependent on `file_security_audit_events` PK | **AUTHORITATIVE** | KEEP |
| 10 | `scanner` | `varchar(100)` | NO | - | Entity attribute | `file_security_audit_events.scanner` | Directly dependent on `file_security_audit_events` PK | **AUTHORITATIVE** | KEEP |
| 11 | `result` | `varchar(20)` | NO | - | Entity attribute | `file_security_audit_events.result` | Directly dependent on `file_security_audit_events` PK | **AUTHORITATIVE** | KEEP |
| 12 | `details` | `json` | YES | - | Entity attribute | `file_security_audit_events.details` | Directly dependent on `file_security_audit_events` PK | **AUTHORITATIVE** | KEEP |
| 13 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `file_security_audit_events.created_at` | Depends on `file_security_audit_events` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `issued_certificates`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `issued_certificates.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `batch_id` | `char(36)` | NO | MUL | Entity attribute | `issued_certificates.batch_id` | Directly dependent on `issued_certificates` PK | **AUTHORITATIVE** | KEEP |
| 3 | `recipient_profile_id` | `char(36)` | NO | MUL | Entity attribute | `issued_certificates.recipient_profile_id` | Directly dependent on `issued_certificates` PK | **AUTHORITATIVE** | KEEP |
| 4 | `certificate_code` | `varchar(100)` | NO | UNI | Entity attribute | `issued_certificates.certificate_code` | Directly dependent on `issued_certificates` PK | **AUTHORITATIVE** | KEEP |
| 5 | `render_payload` | `json` | NO | - | Entity attribute | `issued_certificates.render_payload` | Directly dependent on `issued_certificates` PK | **AUTHORITATIVE** | KEEP |
| 6 | `storage_path` | `varchar(500)` | YES | - | Entity attribute | `issued_certificates.storage_path` | Directly dependent on `issued_certificates` PK | **AUTHORITATIVE** | KEEP |
| 7 | `status` | `varchar(20)` | NO | - | Entity attribute | `issued_certificates.status` | Directly dependent on `issued_certificates` PK | **AUTHORITATIVE** | KEEP |
| 8 | `issued_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `issued_certificates.issued_at` | Depends on `issued_certificates` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 9 | `revoked_at` | `datetime(6)` | YES | - | Audit / lifecycle timestamp or actor reference | `issued_certificates.revoked_at` | Depends on `issued_certificates` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 10 | `revocation_reason` | `text` | YES | - | Entity attribute | `issued_certificates.revocation_reason` | Directly dependent on `issued_certificates` PK | **AUTHORITATIVE** | KEEP |

### Table: `local_auth_credentials`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `profile_id` | `char(36)` | NO | PRI | Primary Key | `local_auth_credentials.profile_id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `password_hash` | `varchar(255)` | NO | - | Entity attribute | `local_auth_credentials.password_hash` | Directly dependent on `local_auth_credentials` PK | **AUTHORITATIVE** | KEEP |
| 3 | `password_changed_at` | `datetime(6)` | YES | - | Audit / lifecycle timestamp or actor reference | `local_auth_credentials.password_changed_at` | Depends on `local_auth_credentials` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 4 | `status` | `varchar(20)` | NO | - | Entity attribute | `local_auth_credentials.status` | Directly dependent on `local_auth_credentials` PK | **AUTHORITATIVE** | KEEP |
| 5 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `local_auth_credentials.created_at` | Depends on `local_auth_credentials` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 6 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `local_auth_credentials.updated_at` | Depends on `local_auth_credentials` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `local_auth_sessions`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `local_auth_sessions.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `profile_id` | `char(36)` | NO | MUL | Entity attribute | `local_auth_sessions.profile_id` | Directly dependent on `local_auth_sessions` PK | **AUTHORITATIVE** | KEEP |
| 3 | `token_hash` | `char(64)` | NO | UNI | Entity attribute | `local_auth_sessions.token_hash` | Directly dependent on `local_auth_sessions` PK | **AUTHORITATIVE** | KEEP |
| 4 | `issued_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `local_auth_sessions.issued_at` | Depends on `local_auth_sessions` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 5 | `expires_at` | `datetime(6)` | NO | MUL | Audit / lifecycle timestamp or actor reference | `local_auth_sessions.expires_at` | Depends on `local_auth_sessions` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 6 | `last_seen_at` | `datetime(6)` | YES | - | Audit / lifecycle timestamp or actor reference | `local_auth_sessions.last_seen_at` | Depends on `local_auth_sessions` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 7 | `revoked_at` | `datetime(6)` | YES | MUL | Audit / lifecycle timestamp or actor reference | `local_auth_sessions.revoked_at` | Depends on `local_auth_sessions` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 8 | `revocation_reason` | `varchar(64)` | YES | - | Entity attribute | `local_auth_sessions.revocation_reason` | Directly dependent on `local_auth_sessions` PK | **AUTHORITATIVE** | KEEP |
| 9 | `created_ip` | `varchar(45)` | YES | - | Entity attribute | `local_auth_sessions.created_ip` | Directly dependent on `local_auth_sessions` PK | **AUTHORITATIVE** | KEEP |
| 10 | `user_agent_hash` | `char(64)` | YES | - | Entity attribute | `local_auth_sessions.user_agent_hash` | Directly dependent on `local_auth_sessions` PK | **AUTHORITATIVE** | KEEP |

### Table: `migrations`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `bigint unsigned` | NO | PRI | Primary Key | `migrations.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `version` | `varchar(255)` | NO | - | Entity attribute | `migrations.version` | Directly dependent on `migrations` PK | **AUTHORITATIVE** | KEEP |
| 3 | `class` | `varchar(255)` | NO | - | Entity attribute | `migrations.class` | Directly dependent on `migrations` PK | **AUTHORITATIVE** | KEEP |
| 4 | `group` | `varchar(255)` | NO | - | Entity attribute | `migrations.group` | Directly dependent on `migrations` PK | **AUTHORITATIVE** | KEEP |
| 5 | `namespace` | `varchar(255)` | NO | - | Entity attribute | `migrations.namespace` | Directly dependent on `migrations` PK | **AUTHORITATIVE** | KEEP |
| 6 | `time` | `int` | NO | - | Entity attribute | `migrations.time` | Directly dependent on `migrations` PK | **AUTHORITATIVE** | KEEP |
| 7 | `batch` | `int unsigned` | NO | - | Entity attribute | `migrations.batch` | Directly dependent on `migrations` PK | **AUTHORITATIVE** | KEEP |

### Table: `notification_preferences`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `notification_preferences.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `profile_id` | `char(36)` | NO | MUL | Entity attribute | `notification_preferences.profile_id` | Directly dependent on `notification_preferences` PK | **AUTHORITATIVE** | KEEP |
| 3 | `category` | `varchar(50)` | NO | - | Entity attribute | `notification_preferences.category` | Directly dependent on `notification_preferences` PK | **AUTHORITATIVE** | KEEP |
| 4 | `email_enabled` | `tinyint(1)` | NO | - | Entity attribute | `notification_preferences.email_enabled` | Directly dependent on `notification_preferences` PK | **AUTHORITATIVE** | KEEP |
| 5 | `in_app_enabled` | `tinyint(1)` | NO | - | Entity attribute | `notification_preferences.in_app_enabled` | Directly dependent on `notification_preferences` PK | **AUTHORITATIVE** | KEEP |
| 6 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `notification_preferences.created_at` | Depends on `notification_preferences` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 7 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `notification_preferences.updated_at` | Depends on `notification_preferences` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `notifications`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `notifications.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `recipient_profile_id` | `char(36)` | NO | MUL | Entity attribute | `notifications.recipient_profile_id` | Directly dependent on `notifications` PK | **AUTHORITATIVE** | KEEP |
| 3 | `actor_profile_id` | `char(36)` | YES | MUL | Entity attribute | `notifications.actor_profile_id` | Directly dependent on `notifications` PK | **AUTHORITATIVE** | KEEP |
| 4 | `notification_type` | `varchar(50)` | NO | - | Entity attribute | `notifications.notification_type` | Directly dependent on `notifications` PK | **AUTHORITATIVE** | KEEP |
| 5 | `title` | `varchar(200)` | NO | - | Entity attribute | `notifications.title` | Directly dependent on `notifications` PK | **AUTHORITATIVE** | KEEP |
| 6 | `message` | `text` | NO | - | Entity attribute | `notifications.message` | Directly dependent on `notifications` PK | **AUTHORITATIVE** | KEEP |
| 7 | `reference_type` | `varchar(50)` | YES | - | Entity attribute | `notifications.reference_type` | Directly dependent on `notifications` PK | **AUTHORITATIVE** | KEEP |
| 8 | `reference_id` | `char(36)` | YES | - | Entity attribute | `notifications.reference_id` | Directly dependent on `notifications` PK | **AUTHORITATIVE** | KEEP |
| 9 | `is_mandatory` | `tinyint(1)` | NO | - | Entity attribute | `notifications.is_mandatory` | Directly dependent on `notifications` PK | **AUTHORITATIVE** | KEEP |
| 10 | `read_at` | `datetime(6)` | YES | - | Audit / lifecycle timestamp or actor reference | `notifications.read_at` | Depends on `notifications` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 11 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `notifications.created_at` | Depends on `notifications` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `organization_moderator_assignments`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `organization_moderator_assignments.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `organization_id` | `char(36)` | NO | MUL | Entity attribute | `organization_moderator_assignments.organization_id` | Directly dependent on `organization_moderator_assignments` PK | **AUTHORITATIVE** | KEEP |
| 3 | `personnel_profile_id` | `char(36)` | NO | MUL | Entity attribute | `organization_moderator_assignments.personnel_profile_id` | Directly dependent on `organization_moderator_assignments` PK | **AUTHORITATIVE** | KEEP |
| 4 | `effective_from` | `date` | NO | - | Entity attribute | `organization_moderator_assignments.effective_from` | Directly dependent on `organization_moderator_assignments` PK | **AUTHORITATIVE** | KEEP |
| 5 | `effective_until` | `date` | YES | - | Entity attribute | `organization_moderator_assignments.effective_until` | Directly dependent on `organization_moderator_assignments` PK | **AUTHORITATIVE** | KEEP |
| 6 | `is_active` | `tinyint(1)` | NO | - | Entity attribute | `organization_moderator_assignments.is_active` | Directly dependent on `organization_moderator_assignments` PK | **AUTHORITATIVE** | KEEP |
| 7 | `assigned_by` | `char(36)` | YES | MUL | Audit / lifecycle timestamp or actor reference | `organization_moderator_assignments.assigned_by` | Depends on `organization_moderator_assignments` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 8 | `assigned_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `organization_moderator_assignments.assigned_at` | Depends on `organization_moderator_assignments` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 9 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `organization_moderator_assignments.created_at` | Depends on `organization_moderator_assignments` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 10 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `organization_moderator_assignments.updated_at` | Depends on `organization_moderator_assignments` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 11 | `active_org_moderator_guard` | `char(36)` | YES | UNI | Virtual generated column for single-active uniqueness | Generated expression | Depends on `is_active` / status | **DERIVED** | KEEP (Constraint guard mechanism) |

### Table: `organization_program_affiliations`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `organization_program_affiliations.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `organization_id` | `char(36)` | NO | MUL | Entity attribute | `organization_program_affiliations.organization_id` | Directly dependent on `organization_program_affiliations` PK | **AUTHORITATIVE** | KEEP |
| 3 | `academic_program_id` | `char(36)` | NO | MUL | Entity attribute | `organization_program_affiliations.academic_program_id` | Directly dependent on `organization_program_affiliations` PK | **AUTHORITATIVE** | KEEP |
| 4 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `organization_program_affiliations.created_at` | Depends on `organization_program_affiliations` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `organizations`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `organizations.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `college_id` | `char(36)` | YES | MUL | Entity attribute | `organizations.college_id` | Directly dependent on `organizations` PK | **AUTHORITATIVE** | KEEP |
| 3 | `code` | `varchar(30)` | NO | UNI | Entity attribute | `organizations.code` | Directly dependent on `organizations` PK | **AUTHORITATIVE** | KEEP |
| 4 | `name` | `varchar(150)` | NO | - | Entity attribute | `organizations.name` | Directly dependent on `organizations` PK | **AUTHORITATIVE** | KEEP |
| 5 | `scope` | `varchar(30)` | NO | - | Entity attribute | `organizations.scope` | Directly dependent on `organizations` PK | **AUTHORITATIVE** | KEEP |
| 6 | `category` | `varchar(50)` | NO | - | Entity attribute | `organizations.category` | Directly dependent on `organizations` PK | **AUTHORITATIVE** | KEEP |
| 7 | `status` | `varchar(20)` | NO | - | Entity attribute | `organizations.status` | Directly dependent on `organizations` PK | **AUTHORITATIVE** | KEEP |
| 8 | `logo_storage_key` | `varchar(500)` | YES | - | Entity attribute | `organizations.logo_storage_key` | Directly dependent on `organizations` PK | **AUTHORITATIVE** | KEEP |
| 9 | `logo_original_name` | `varchar(255)` | YES | - | Entity attribute | `organizations.logo_original_name` | Directly dependent on `organizations` PK | **AUTHORITATIVE** | KEEP |
| 10 | `logo_mime_type` | `varchar(100)` | YES | - | Entity attribute | `organizations.logo_mime_type` | Directly dependent on `organizations` PK | **AUTHORITATIVE** | KEEP |
| 11 | `logo_updated_at` | `datetime(6)` | YES | - | Audit / lifecycle timestamp or actor reference | `organizations.logo_updated_at` | Depends on `organizations` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 12 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `organizations.created_at` | Depends on `organizations` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 13 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `organizations.updated_at` | Depends on `organizations` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `password_reset_requests`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `password_reset_requests.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `institutional_email` | `varchar(255)` | NO | - | Entity attribute | `password_reset_requests.institutional_email` | Directly dependent on `password_reset_requests` PK | **AUTHORITATIVE** | KEEP |
| 3 | `reason` | `text` | NO | - | Entity attribute | `password_reset_requests.reason` | Directly dependent on `password_reset_requests` PK | **AUTHORITATIVE** | KEEP |
| 4 | `status` | `varchar(20)` | NO | - | Entity attribute | `password_reset_requests.status` | Directly dependent on `password_reset_requests` PK | **AUTHORITATIVE** | KEEP |
| 5 | `ip_address` | `varchar(45)` | YES | - | Entity attribute | `password_reset_requests.ip_address` | Directly dependent on `password_reset_requests` PK | **AUTHORITATIVE** | KEEP |
| 6 | `user_agent` | `text` | YES | - | Entity attribute | `password_reset_requests.user_agent` | Directly dependent on `password_reset_requests` PK | **AUTHORITATIVE** | KEEP |
| 7 | `processed_by` | `char(36)` | YES | MUL | Audit / lifecycle timestamp or actor reference | `password_reset_requests.processed_by` | Depends on `password_reset_requests` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 8 | `processed_at` | `datetime(6)` | YES | - | Audit / lifecycle timestamp or actor reference | `password_reset_requests.processed_at` | Depends on `password_reset_requests` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 9 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `password_reset_requests.created_at` | Depends on `password_reset_requests` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 10 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `password_reset_requests.updated_at` | Depends on `password_reset_requests` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `personnel_accomplishment_evidence`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `personnel_accomplishment_evidence.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `accomplishment_id` | `char(36)` | NO | MUL | Entity attribute | `personnel_accomplishment_evidence.accomplishment_id` | Directly dependent on `personnel_accomplishment_evidence` PK | **AUTHORITATIVE** | KEEP |
| 3 | `storage_path` | `varchar(500)` | NO | - | Entity attribute | `personnel_accomplishment_evidence.storage_path` | Directly dependent on `personnel_accomplishment_evidence` PK | **AUTHORITATIVE** | KEEP |
| 4 | `original_filename` | `varchar(255)` | NO | - | Entity attribute | `personnel_accomplishment_evidence.original_filename` | Directly dependent on `personnel_accomplishment_evidence` PK | **AUTHORITATIVE** | KEEP |
| 5 | `mime_type` | `varchar(100)` | NO | - | Entity attribute | `personnel_accomplishment_evidence.mime_type` | Directly dependent on `personnel_accomplishment_evidence` PK | **AUTHORITATIVE** | KEEP |
| 6 | `detected_mime_type` | `varchar(100)` | YES | - | Entity attribute | `personnel_accomplishment_evidence.detected_mime_type` | Directly dependent on `personnel_accomplishment_evidence` PK | **AUTHORITATIVE** | KEEP |
| 7 | `byte_size` | `bigint` | NO | - | Entity attribute | `personnel_accomplishment_evidence.byte_size` | Directly dependent on `personnel_accomplishment_evidence` PK | **AUTHORITATIVE** | KEEP |
| 8 | `checksum` | `varchar(64)` | YES | - | Entity attribute | `personnel_accomplishment_evidence.checksum` | Directly dependent on `personnel_accomplishment_evidence` PK | **AUTHORITATIVE** | KEEP |
| 9 | `sha256` | `varchar(64)` | YES | - | Entity attribute | `personnel_accomplishment_evidence.sha256` | Directly dependent on `personnel_accomplishment_evidence` PK | **AUTHORITATIVE** | KEEP |
| 10 | `uploaded_by` | `char(36)` | NO | MUL | Audit / lifecycle timestamp or actor reference | `personnel_accomplishment_evidence.uploaded_by` | Depends on `personnel_accomplishment_evidence` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 11 | `uploaded_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `personnel_accomplishment_evidence.uploaded_at` | Depends on `personnel_accomplishment_evidence` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 12 | `security_status` | `varchar(30)` | NO | - | Entity attribute | `personnel_accomplishment_evidence.security_status` | Directly dependent on `personnel_accomplishment_evidence` PK | **AUTHORITATIVE** | KEEP |
| 13 | `malware_scanner` | `varchar(100)` | NO | - | Entity attribute | `personnel_accomplishment_evidence.malware_scanner` | Directly dependent on `personnel_accomplishment_evidence` PK | **AUTHORITATIVE** | KEEP |
| 14 | `security_validated_at` | `datetime(6)` | YES | - | Audit / lifecycle timestamp or actor reference | `personnel_accomplishment_evidence.security_validated_at` | Depends on `personnel_accomplishment_evidence` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 15 | `status` | `varchar(20)` | NO | - | Entity attribute | `personnel_accomplishment_evidence.status` | Directly dependent on `personnel_accomplishment_evidence` PK | **AUTHORITATIVE** | KEEP |

### Table: `personnel_accomplishments`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `personnel_accomplishments.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `personnel_profile_id` | `char(36)` | NO | MUL | Entity attribute | `personnel_accomplishments.personnel_profile_id` | Directly dependent on `personnel_accomplishments` PK | **AUTHORITATIVE** | KEEP |
| 3 | `domain` | `varchar(50)` | NO | - | Entity attribute | `personnel_accomplishments.domain` | Directly dependent on `personnel_accomplishments` PK | **AUTHORITATIVE** | KEEP |
| 4 | `title` | `varchar(255)` | NO | - | Entity attribute | `personnel_accomplishments.title` | Directly dependent on `personnel_accomplishments` PK | **AUTHORITATIVE** | KEEP |
| 5 | `organizer_or_publisher` | `varchar(255)` | YES | - | Entity attribute | `personnel_accomplishments.organizer_or_publisher` | Directly dependent on `personnel_accomplishments` PK | **AUTHORITATIVE** | KEEP |
| 6 | `occurrence_date` | `date` | YES | - | Entity attribute | `personnel_accomplishments.occurrence_date` | Directly dependent on `personnel_accomplishments` PK | **AUTHORITATIVE** | KEEP |
| 7 | `description` | `text` | YES | - | Entity attribute | `personnel_accomplishments.description` | Directly dependent on `personnel_accomplishments` PK | **AUTHORITATIVE** | KEEP |
| 8 | `claimed_points` | `decimal(6,2)` | NO | - | Entity attribute | `personnel_accomplishments.claimed_points` | Directly dependent on `personnel_accomplishments` PK | **AUTHORITATIVE** | KEEP |
| 9 | `status` | `varchar(30)` | NO | - | Entity attribute | `personnel_accomplishments.status` | Directly dependent on `personnel_accomplishments` PK | **AUTHORITATIVE** | KEEP |
| 10 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `personnel_accomplishments.created_at` | Depends on `personnel_accomplishments` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 11 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `personnel_accomplishments.updated_at` | Depends on `personnel_accomplishments` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `personnel_administrative_unit_affiliations`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `personnel_administrative_unit_affiliations.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `personnel_profile_id` | `char(36)` | NO | MUL | Entity attribute | `personnel_administrative_unit_affiliations.personnel_profile_id` | Directly dependent on `personnel_administrative_unit_affiliations` PK | **AUTHORITATIVE** | KEEP |
| 3 | `administrative_unit_id` | `char(36)` | NO | MUL | Entity attribute | `personnel_administrative_unit_affiliations.administrative_unit_id` | Directly dependent on `personnel_administrative_unit_affiliations` PK | **AUTHORITATIVE** | KEEP |
| 4 | `effective_from` | `date` | NO | - | Entity attribute | `personnel_administrative_unit_affiliations.effective_from` | Directly dependent on `personnel_administrative_unit_affiliations` PK | **AUTHORITATIVE** | KEEP |
| 5 | `effective_until` | `date` | YES | - | Entity attribute | `personnel_administrative_unit_affiliations.effective_until` | Directly dependent on `personnel_administrative_unit_affiliations` PK | **AUTHORITATIVE** | KEEP |
| 6 | `is_active` | `tinyint(1)` | NO | - | Entity attribute | `personnel_administrative_unit_affiliations.is_active` | Directly dependent on `personnel_administrative_unit_affiliations` PK | **AUTHORITATIVE** | KEEP |
| 7 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `personnel_administrative_unit_affiliations.created_at` | Depends on `personnel_administrative_unit_affiliations` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 8 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `personnel_administrative_unit_affiliations.updated_at` | Depends on `personnel_administrative_unit_affiliations` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 9 | `active_personnel_unit_guard` | `char(36)` | YES | UNI | Virtual generated column for single-active uniqueness | Generated expression | Depends on `is_active` / status | **DERIVED** | KEEP (Constraint guard mechanism) |

### Table: `personnel_college_affiliations`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `personnel_college_affiliations.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `personnel_profile_id` | `char(36)` | NO | MUL | Entity attribute | `personnel_college_affiliations.personnel_profile_id` | Directly dependent on `personnel_college_affiliations` PK | **AUTHORITATIVE** | KEEP |
| 3 | `college_id` | `char(36)` | NO | MUL | Entity attribute | `personnel_college_affiliations.college_id` | Directly dependent on `personnel_college_affiliations` PK | **AUTHORITATIVE** | KEEP |
| 4 | `effective_from` | `date` | NO | - | Entity attribute | `personnel_college_affiliations.effective_from` | Directly dependent on `personnel_college_affiliations` PK | **AUTHORITATIVE** | KEEP |
| 5 | `effective_until` | `date` | YES | - | Entity attribute | `personnel_college_affiliations.effective_until` | Directly dependent on `personnel_college_affiliations` PK | **AUTHORITATIVE** | KEEP |
| 6 | `is_active` | `tinyint(1)` | NO | - | Entity attribute | `personnel_college_affiliations.is_active` | Directly dependent on `personnel_college_affiliations` PK | **AUTHORITATIVE** | KEEP |
| 7 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `personnel_college_affiliations.created_at` | Depends on `personnel_college_affiliations` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 8 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `personnel_college_affiliations.updated_at` | Depends on `personnel_college_affiliations` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 9 | `active_personnel_guard` | `char(36)` | YES | UNI | Virtual generated column for single-active uniqueness | Generated expression | Depends on `is_active` / status | **DERIVED** | KEEP (Constraint guard mechanism) |

### Table: `personnel_evaluation_deficiency_requests`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `personnel_evaluation_deficiency_requests.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `evaluation_id` | `char(36)` | NO | MUL | Entity attribute | `personnel_evaluation_deficiency_requests.evaluation_id` | Directly dependent on `personnel_evaluation_deficiency_requests` PK | **AUTHORITATIVE** | KEEP |
| 3 | `item_id` | `char(36)` | YES | MUL | Entity attribute | `personnel_evaluation_deficiency_requests.item_id` | Directly dependent on `personnel_evaluation_deficiency_requests` PK | **AUTHORITATIVE** | KEEP |
| 4 | `requested_by` | `char(36)` | NO | MUL | Audit / lifecycle timestamp or actor reference | `personnel_evaluation_deficiency_requests.requested_by` | Depends on `personnel_evaluation_deficiency_requests` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 5 | `deficiency_description` | `text` | NO | - | Entity attribute | `personnel_evaluation_deficiency_requests.deficiency_description` | Directly dependent on `personnel_evaluation_deficiency_requests` PK | **AUTHORITATIVE** | KEEP |
| 6 | `status` | `varchar(20)` | NO | - | Entity attribute | `personnel_evaluation_deficiency_requests.status` | Directly dependent on `personnel_evaluation_deficiency_requests` PK | **AUTHORITATIVE** | KEEP |
| 7 | `response_text` | `text` | YES | - | Entity attribute | `personnel_evaluation_deficiency_requests.response_text` | Directly dependent on `personnel_evaluation_deficiency_requests` PK | **AUTHORITATIVE** | KEEP |
| 8 | `responded_at` | `datetime(6)` | YES | - | Audit / lifecycle timestamp or actor reference | `personnel_evaluation_deficiency_requests.responded_at` | Depends on `personnel_evaluation_deficiency_requests` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 9 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `personnel_evaluation_deficiency_requests.created_at` | Depends on `personnel_evaluation_deficiency_requests` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 10 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `personnel_evaluation_deficiency_requests.updated_at` | Depends on `personnel_evaluation_deficiency_requests` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `personnel_evaluation_events`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `personnel_evaluation_events.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `evaluation_id` | `char(36)` | NO | MUL | Entity attribute | `personnel_evaluation_events.evaluation_id` | Directly dependent on `personnel_evaluation_events` PK | **AUTHORITATIVE** | KEEP |
| 3 | `actor_profile_id` | `char(36)` | NO | MUL | Entity attribute | `personnel_evaluation_events.actor_profile_id` | Directly dependent on `personnel_evaluation_events` PK | **AUTHORITATIVE** | KEEP |
| 4 | `action` | `varchar(50)` | NO | - | Entity attribute | `personnel_evaluation_events.action` | Directly dependent on `personnel_evaluation_events` PK | **AUTHORITATIVE** | KEEP |
| 5 | `previous_status` | `varchar(30)` | YES | - | Entity attribute | `personnel_evaluation_events.previous_status` | Directly dependent on `personnel_evaluation_events` PK | **AUTHORITATIVE** | KEEP |
| 6 | `new_status` | `varchar(30)` | NO | - | Entity attribute | `personnel_evaluation_events.new_status` | Directly dependent on `personnel_evaluation_events` PK | **AUTHORITATIVE** | KEEP |
| 7 | `remarks` | `text` | YES | - | Entity attribute | `personnel_evaluation_events.remarks` | Directly dependent on `personnel_evaluation_events` PK | **AUTHORITATIVE** | KEEP |
| 8 | `occurred_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `personnel_evaluation_events.occurred_at` | Depends on `personnel_evaluation_events` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `personnel_evaluation_items`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `personnel_evaluation_items.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `evaluation_id` | `char(36)` | NO | MUL | Entity attribute | `personnel_evaluation_items.evaluation_id` | Directly dependent on `personnel_evaluation_items` PK | **AUTHORITATIVE** | KEEP |
| 3 | `accomplishment_id` | `char(36)` | YES | MUL | Entity attribute | `personnel_evaluation_items.accomplishment_id` | Directly dependent on `personnel_evaluation_items` PK | **AUTHORITATIVE** | KEEP |
| 4 | `domain` | `varchar(50)` | NO | - | Entity attribute | `personnel_evaluation_items.domain` | Directly dependent on `personnel_evaluation_items` PK | **AUTHORITATIVE** | KEEP |
| 5 | `item_description` | `text` | NO | - | Entity attribute | `personnel_evaluation_items.item_description` | Directly dependent on `personnel_evaluation_items` PK | **AUTHORITATIVE** | KEEP |
| 6 | `claimed_points` | `decimal(5,2)` | NO | - | Entity attribute | `personnel_evaluation_items.claimed_points` | Directly dependent on `personnel_evaluation_items` PK | **AUTHORITATIVE** | KEEP |
| 7 | `verified_points` | `decimal(5,2)` | NO | - | Entity attribute | `personnel_evaluation_items.verified_points` | Directly dependent on `personnel_evaluation_items` PK | **AUTHORITATIVE** | KEEP |
| 8 | `remarks` | `text` | YES | - | Entity attribute | `personnel_evaluation_items.remarks` | Directly dependent on `personnel_evaluation_items` PK | **AUTHORITATIVE** | KEEP |
| 9 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `personnel_evaluation_items.created_at` | Depends on `personnel_evaluation_items` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `personnel_evaluation_reports`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `personnel_evaluation_reports.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `evaluation_id` | `char(36)` | NO | MUL | Entity attribute | `personnel_evaluation_reports.evaluation_id` | Directly dependent on `personnel_evaluation_reports` PK | **AUTHORITATIVE** | KEEP |
| 3 | `generated_by` | `char(36)` | NO | MUL | Audit / lifecycle timestamp or actor reference | `personnel_evaluation_reports.generated_by` | Depends on `personnel_evaluation_reports` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 4 | `report_payload` | `json` | NO | - | Entity attribute | `personnel_evaluation_reports.report_payload` | Directly dependent on `personnel_evaluation_reports` PK | **AUTHORITATIVE** | KEEP |
| 5 | `summary_score` | `decimal(6,2)` | NO | - | Entity attribute | `personnel_evaluation_reports.summary_score` | Directly dependent on `personnel_evaluation_reports` PK | **AUTHORITATIVE** | KEEP |
| 6 | `passing_status` | `varchar(20)` | NO | - | Entity attribute | `personnel_evaluation_reports.passing_status` | Directly dependent on `personnel_evaluation_reports` PK | **AUTHORITATIVE** | KEEP |
| 7 | `generated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `personnel_evaluation_reports.generated_at` | Depends on `personnel_evaluation_reports` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `personnel_evaluations`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `personnel_evaluations.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `personnel_profile_id` | `char(36)` | NO | MUL | Entity attribute | `personnel_evaluations.personnel_profile_id` | Directly dependent on `personnel_evaluations` PK | **AUTHORITATIVE** | KEEP |
| 3 | `evaluator_profile_id` | `char(36)` | NO | MUL | Entity attribute | `personnel_evaluations.evaluator_profile_id` | Directly dependent on `personnel_evaluations` PK | **AUTHORITATIVE** | KEEP |
| 4 | `academic_year` | `varchar(20)` | NO | - | Entity attribute | `personnel_evaluations.academic_year` | Directly dependent on `personnel_evaluations` PK | **AUTHORITATIVE** | KEEP |
| 5 | `semester` | `varchar(20)` | NO | - | Entity attribute | `personnel_evaluations.semester` | Directly dependent on `personnel_evaluations` PK | **AUTHORITATIVE** | KEEP |
| 6 | `score_professional_development` | `decimal(5,2)` | NO | - | Entity attribute | `personnel_evaluations.score_professional_development` | Directly dependent on `personnel_evaluations` PK | **AUTHORITATIVE** | KEEP |
| 7 | `score_productivity_creative_work` | `decimal(5,2)` | NO | - | Entity attribute | `personnel_evaluations.score_productivity_creative_work` | Directly dependent on `personnel_evaluations` PK | **AUTHORITATIVE** | KEEP |
| 8 | `score_service_leadership` | `decimal(5,2)` | NO | - | Entity attribute | `personnel_evaluations.score_service_leadership` | Directly dependent on `personnel_evaluations` PK | **AUTHORITATIVE** | KEEP |
| 9 | `total_score` | `decimal(6,2)` | NO | - | Entity attribute | `personnel_evaluations.total_score` | Directly dependent on `personnel_evaluations` PK | **AUTHORITATIVE** | KEEP |
| 10 | `passing_status` | `varchar(20)` | NO | - | Entity attribute | `personnel_evaluations.passing_status` | Directly dependent on `personnel_evaluations` PK | **AUTHORITATIVE** | KEEP |
| 11 | `status` | `varchar(30)` | NO | - | Entity attribute | `personnel_evaluations.status` | Directly dependent on `personnel_evaluations` PK | **AUTHORITATIVE** | KEEP |
| 12 | `finalized_at` | `datetime(6)` | YES | - | Audit / lifecycle timestamp or actor reference | `personnel_evaluations.finalized_at` | Depends on `personnel_evaluations` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 13 | `finalized_by` | `char(36)` | YES | MUL | Audit / lifecycle timestamp or actor reference | `personnel_evaluations.finalized_by` | Depends on `personnel_evaluations` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 14 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `personnel_evaluations.created_at` | Depends on `personnel_evaluations` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 15 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `personnel_evaluations.updated_at` | Depends on `personnel_evaluations` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `personnel_profiles`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `profile_id` | `char(36)` | NO | PRI | Primary Key | `personnel_profiles.profile_id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `personnel_classification` | `varchar(30)` | NO | - | Entity attribute | `personnel_profiles.personnel_classification` | Directly dependent on `personnel_profiles` PK | **AUTHORITATIVE** | KEEP |
| 3 | `employment_status` | `varchar(30)` | NO | - | Entity attribute | `personnel_profiles.employment_status` | Directly dependent on `personnel_profiles` PK | **AUTHORITATIVE** | KEEP |
| 4 | `rank_level` | `varchar(50)` | YES | - | Entity attribute | `personnel_profiles.rank_level` | Directly dependent on `personnel_profiles` PK | **AUTHORITATIVE** | KEEP |
| 5 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `personnel_profiles.created_at` | Depends on `personnel_profiles` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 6 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `personnel_profiles.updated_at` | Depends on `personnel_profiles` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `personnel_program_affiliations`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `personnel_program_affiliations.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `personnel_profile_id` | `char(36)` | NO | MUL | Entity attribute | `personnel_program_affiliations.personnel_profile_id` | Directly dependent on `personnel_program_affiliations` PK | **AUTHORITATIVE** | KEEP |
| 3 | `academic_program_id` | `char(36)` | NO | MUL | Entity attribute | `personnel_program_affiliations.academic_program_id` | Directly dependent on `personnel_program_affiliations` PK | **AUTHORITATIVE** | KEEP |
| 4 | `effective_from` | `date` | NO | - | Entity attribute | `personnel_program_affiliations.effective_from` | Directly dependent on `personnel_program_affiliations` PK | **AUTHORITATIVE** | KEEP |
| 5 | `effective_until` | `date` | YES | - | Entity attribute | `personnel_program_affiliations.effective_until` | Directly dependent on `personnel_program_affiliations` PK | **AUTHORITATIVE** | KEEP |
| 6 | `is_active` | `tinyint(1)` | NO | - | Entity attribute | `personnel_program_affiliations.is_active` | Directly dependent on `personnel_program_affiliations` PK | **AUTHORITATIVE** | KEEP |
| 7 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `personnel_program_affiliations.created_at` | Depends on `personnel_program_affiliations` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 8 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `personnel_program_affiliations.updated_at` | Depends on `personnel_program_affiliations` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `personnel_qualification_reviews`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `personnel_qualification_reviews.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `personnel_profile_id` | `char(36)` | NO | MUL | Entity attribute | `personnel_qualification_reviews.personnel_profile_id` | Directly dependent on `personnel_qualification_reviews` PK | **AUTHORITATIVE** | KEEP |
| 3 | `reviewer_profile_id` | `char(36)` | NO | MUL | Entity attribute | `personnel_qualification_reviews.reviewer_profile_id` | Directly dependent on `personnel_qualification_reviews` PK | **AUTHORITATIVE** | KEEP |
| 4 | `qualification_status` | `varchar(30)` | NO | - | Entity attribute | `personnel_qualification_reviews.qualification_status` | Directly dependent on `personnel_qualification_reviews` PK | **AUTHORITATIVE** | KEEP |
| 5 | `remarks` | `text` | YES | - | Entity attribute | `personnel_qualification_reviews.remarks` | Directly dependent on `personnel_qualification_reviews` PK | **AUTHORITATIVE** | KEEP |
| 6 | `reviewed_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `personnel_qualification_reviews.reviewed_at` | Depends on `personnel_qualification_reviews` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `portfolio_categories`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `portfolio_categories.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `code` | `varchar(50)` | NO | UNI | Entity attribute | `portfolio_categories.code` | Directly dependent on `portfolio_categories` PK | **AUTHORITATIVE** | KEEP |
| 3 | `name` | `varchar(150)` | NO | - | Entity attribute | `portfolio_categories.name` | Directly dependent on `portfolio_categories` PK | **AUTHORITATIVE** | KEEP |
| 4 | `description` | `text` | YES | - | Entity attribute | `portfolio_categories.description` | Directly dependent on `portfolio_categories` PK | **AUTHORITATIVE** | KEEP |
| 5 | `sort_order` | `int` | NO | - | Entity attribute | `portfolio_categories.sort_order` | Directly dependent on `portfolio_categories` PK | **AUTHORITATIVE** | KEEP |
| 6 | `status` | `varchar(20)` | NO | - | Entity attribute | `portfolio_categories.status` | Directly dependent on `portfolio_categories` PK | **AUTHORITATIVE** | KEEP |
| 7 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `portfolio_categories.created_at` | Depends on `portfolio_categories` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 8 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `portfolio_categories.updated_at` | Depends on `portfolio_categories` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `portfolio_subcategories`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `portfolio_subcategories.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `category_id` | `char(36)` | NO | MUL | Entity attribute | `portfolio_subcategories.category_id` | Directly dependent on `portfolio_subcategories` PK | **AUTHORITATIVE** | KEEP |
| 3 | `code` | `varchar(100)` | NO | - | Entity attribute | `portfolio_subcategories.code` | Directly dependent on `portfolio_subcategories` PK | **AUTHORITATIVE** | KEEP |
| 4 | `name` | `varchar(200)` | NO | - | Entity attribute | `portfolio_subcategories.name` | Directly dependent on `portfolio_subcategories` PK | **AUTHORITATIVE** | KEEP |
| 5 | `description` | `text` | YES | - | Entity attribute | `portfolio_subcategories.description` | Directly dependent on `portfolio_subcategories` PK | **AUTHORITATIVE** | KEEP |
| 6 | `metadata_requirements` | `json` | YES | - | Entity attribute | `portfolio_subcategories.metadata_requirements` | Directly dependent on `portfolio_subcategories` PK | **AUTHORITATIVE** | KEEP |
| 7 | `sort_order` | `int` | NO | - | Entity attribute | `portfolio_subcategories.sort_order` | Directly dependent on `portfolio_subcategories` PK | **AUTHORITATIVE** | KEEP |
| 8 | `status` | `varchar(20)` | NO | - | Entity attribute | `portfolio_subcategories.status` | Directly dependent on `portfolio_subcategories` PK | **AUTHORITATIVE** | KEEP |
| 9 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `portfolio_subcategories.created_at` | Depends on `portfolio_subcategories` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 10 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `portfolio_subcategories.updated_at` | Depends on `portfolio_subcategories` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `profile_roles`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `profile_roles.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `profile_id` | `char(36)` | NO | MUL | Entity attribute | `profile_roles.profile_id` | Directly dependent on `profile_roles` PK | **AUTHORITATIVE** | KEEP |
| 3 | `role_id` | `char(36)` | NO | MUL | Entity attribute | `profile_roles.role_id` | Directly dependent on `profile_roles` PK | **AUTHORITATIVE** | KEEP |
| 4 | `scope_type` | `varchar(30)` | NO | MUL | Entity attribute | `profile_roles.scope_type` | Directly dependent on `profile_roles` PK | **AUTHORITATIVE** | KEEP |
| 5 | `scope_id` | `char(36)` | YES | - | Entity attribute | `profile_roles.scope_id` | Directly dependent on `profile_roles` PK | **AUTHORITATIVE** | KEEP |
| 6 | `is_active` | `tinyint(1)` | NO | - | Entity attribute | `profile_roles.is_active` | Directly dependent on `profile_roles` PK | **AUTHORITATIVE** | KEEP |
| 7 | `assigned_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `profile_roles.assigned_at` | Depends on `profile_roles` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 8 | `assigned_by` | `char(36)` | YES | MUL | Audit / lifecycle timestamp or actor reference | `profile_roles.assigned_by` | Depends on `profile_roles` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `profiles`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `profiles.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `institutional_id` | `varchar(50)` | NO | UNI | Entity attribute | `profiles.institutional_id` | Directly dependent on `profiles` PK | **AUTHORITATIVE** | KEEP |
| 3 | `account_type` | `varchar(30)` | NO | MUL | Primary profile classification (student, faculty, staff, osad_admin, hr_admin) | `profiles.account_type` | Depends on `profiles.id` (Identity subtyping discriminator) | **AUTHORITATIVE** | KEEP (Login routing & subtype discriminator) |
| 4 | `email` | `varchar(255)` | NO | UNI | Entity attribute | `profiles.email` | Directly dependent on `profiles` PK | **AUTHORITATIVE** | KEEP |
| 5 | `full_name` | `varchar(255)` | NO | - | Concatenated formatted full name | `profiles.first_name`, `profiles.middle_name`, `profiles.last_name` | Deterministically derivable from name components | **DERIVED** | KEEP (Maintained for fast indexing, search & UI rendering) |
| 6 | `first_name` | `varchar(100)` | YES | - | Entity attribute | `profiles.first_name` | Directly dependent on `profiles` PK | **AUTHORITATIVE** | KEEP |
| 7 | `middle_name` | `varchar(100)` | YES | - | Entity attribute | `profiles.middle_name` | Directly dependent on `profiles` PK | **AUTHORITATIVE** | KEEP |
| 8 | `last_name` | `varchar(100)` | YES | - | Entity attribute | `profiles.last_name` | Directly dependent on `profiles` PK | **AUTHORITATIVE** | KEEP |
| 9 | `designation_title` | `varchar(150)` | YES | - | Personnel administrative designation / faculty title | `profiles.designation_title` | Currently in profiles supertype for unified header rendering | **AUTHORITATIVE** | KEEP (Unified display field across OSAD & HR UI) |
| 10 | `avatar_url` | `text` | YES | - | Entity attribute | `profiles.avatar_url` | Directly dependent on `profiles` PK | **AUTHORITATIVE** | KEEP |
| 11 | `status` | `varchar(20)` | NO | - | Entity attribute | `profiles.status` | Directly dependent on `profiles` PK | **AUTHORITATIVE** | KEEP |
| 12 | `must_change_password` | `tinyint(1)` | NO | - | Entity attribute | `profiles.must_change_password` | Directly dependent on `profiles` PK | **AUTHORITATIVE** | KEEP |
| 13 | `password_hash` | `varchar(255)` | YES | - | Entity attribute | `profiles.password_hash` | Directly dependent on `profiles` PK | **AUTHORITATIVE** | KEEP |
| 14 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `profiles.created_at` | Depends on `profiles` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 15 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `profiles.updated_at` | Depends on `profiles` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 16 | `active_hr_guard` | `char(36)` | YES | UNI | Virtual generated column for single-active uniqueness | Generated expression | Depends on `is_active` / status | **DERIVED** | KEEP (Constraint guard mechanism) |

### Table: `program_coordinator_assignments`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `program_coordinator_assignments.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `personnel_profile_id` | `char(36)` | NO | MUL | Entity attribute | `program_coordinator_assignments.personnel_profile_id` | Directly dependent on `program_coordinator_assignments` PK | **AUTHORITATIVE** | KEEP |
| 3 | `academic_program_id` | `char(36)` | NO | MUL | Entity attribute | `program_coordinator_assignments.academic_program_id` | Directly dependent on `program_coordinator_assignments` PK | **AUTHORITATIVE** | KEEP |
| 4 | `effective_from` | `date` | NO | - | Entity attribute | `program_coordinator_assignments.effective_from` | Directly dependent on `program_coordinator_assignments` PK | **AUTHORITATIVE** | KEEP |
| 5 | `effective_until` | `date` | YES | - | Entity attribute | `program_coordinator_assignments.effective_until` | Directly dependent on `program_coordinator_assignments` PK | **AUTHORITATIVE** | KEEP |
| 6 | `is_active` | `tinyint(1)` | NO | - | Entity attribute | `program_coordinator_assignments.is_active` | Directly dependent on `program_coordinator_assignments` PK | **AUTHORITATIVE** | KEEP |
| 7 | `assigned_by` | `char(36)` | YES | MUL | Audit / lifecycle timestamp or actor reference | `program_coordinator_assignments.assigned_by` | Depends on `program_coordinator_assignments` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 8 | `assigned_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `program_coordinator_assignments.assigned_at` | Depends on `program_coordinator_assignments` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 9 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `program_coordinator_assignments.created_at` | Depends on `program_coordinator_assignments` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 10 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `program_coordinator_assignments.updated_at` | Depends on `program_coordinator_assignments` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 11 | `active_program_coord_guard` | `char(36)` | YES | UNI | Virtual generated column for single-active uniqueness | Generated expression | Depends on `is_active` / status | **DERIVED** | KEEP (Constraint guard mechanism) |

### Table: `role_assignment_events`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `role_assignment_events.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `actor_profile_id` | `char(36)` | YES | MUL | Entity attribute | `role_assignment_events.actor_profile_id` | Directly dependent on `role_assignment_events` PK | **AUTHORITATIVE** | KEEP |
| 3 | `target_profile_id` | `char(36)` | NO | MUL | Entity attribute | `role_assignment_events.target_profile_id` | Directly dependent on `role_assignment_events` PK | **AUTHORITATIVE** | KEEP |
| 4 | `assignment_type` | `varchar(50)` | NO | - | Entity attribute | `role_assignment_events.assignment_type` | Directly dependent on `role_assignment_events` PK | **AUTHORITATIVE** | KEEP |
| 5 | `role_or_scope_id` | `char(36)` | YES | - | Entity attribute | `role_assignment_events.role_or_scope_id` | Directly dependent on `role_assignment_events` PK | **AUTHORITATIVE** | KEEP |
| 6 | `action` | `varchar(30)` | NO | - | Entity attribute | `role_assignment_events.action` | Directly dependent on `role_assignment_events` PK | **AUTHORITATIVE** | KEEP |
| 7 | `metadata` | `json` | YES | - | Entity attribute | `role_assignment_events.metadata` | Directly dependent on `role_assignment_events` PK | **AUTHORITATIVE** | KEEP |
| 8 | `occurred_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `role_assignment_events.occurred_at` | Depends on `role_assignment_events` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `roles`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `roles.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `role_key` | `varchar(50)` | NO | UNI | Entity attribute | `roles.role_key` | Directly dependent on `roles` PK | **AUTHORITATIVE** | KEEP |
| 3 | `display_name` | `varchar(100)` | NO | - | Entity attribute | `roles.display_name` | Directly dependent on `roles` PK | **AUTHORITATIVE** | KEEP |
| 4 | `description` | `text` | YES | - | Entity attribute | `roles.description` | Directly dependent on `roles` PK | **AUTHORITATIVE** | KEEP |
| 5 | `is_system_role` | `tinyint(1)` | NO | - | Entity attribute | `roles.is_system_role` | Directly dependent on `roles` PK | **AUTHORITATIVE** | KEEP |
| 6 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `roles.created_at` | Depends on `roles` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 7 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `roles.updated_at` | Depends on `roles` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `student_award_criterion_scores`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `student_award_criterion_scores.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `evaluation_id` | `char(36)` | NO | MUL | Entity attribute | `student_award_criterion_scores.evaluation_id` | Directly dependent on `student_award_criterion_scores` PK | **AUTHORITATIVE** | KEEP |
| 3 | `criterion_id` | `char(36)` | NO | MUL | Entity attribute | `student_award_criterion_scores.criterion_id` | Directly dependent on `student_award_criterion_scores` PK | **AUTHORITATIVE** | KEEP |
| 4 | `awarded_points` | `decimal(10,2)` | NO | - | Entity attribute | `student_award_criterion_scores.awarded_points` | Directly dependent on `student_award_criterion_scores` PK | **AUTHORITATIVE** | KEEP |
| 5 | `max_points` | `decimal(10,2)` | NO | - | Entity attribute | `student_award_criterion_scores.max_points` | Directly dependent on `student_award_criterion_scores` PK | **AUTHORITATIVE** | KEEP |
| 6 | `scoring_snapshot` | `json` | YES | - | Entity attribute | `student_award_criterion_scores.scoring_snapshot` | Directly dependent on `student_award_criterion_scores` PK | **AUTHORITATIVE** | KEEP |
| 7 | `evaluator_remarks` | `text` | YES | - | Entity attribute | `student_award_criterion_scores.evaluator_remarks` | Directly dependent on `student_award_criterion_scores` PK | **AUTHORITATIVE** | KEEP |
| 8 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `student_award_criterion_scores.created_at` | Depends on `student_award_criterion_scores` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 9 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `student_award_criterion_scores.updated_at` | Depends on `student_award_criterion_scores` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `student_award_evaluations`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `student_award_evaluations.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `cycle_id` | `char(36)` | NO | MUL | Entity attribute | `student_award_evaluations.cycle_id` | Directly dependent on `student_award_evaluations` PK | **AUTHORITATIVE** | KEEP |
| 3 | `award_definition_id` | `char(36)` | NO | MUL | Entity attribute | `student_award_evaluations.award_definition_id` | Directly dependent on `student_award_evaluations` PK | **AUTHORITATIVE** | KEEP |
| 4 | `student_profile_id` | `char(36)` | NO | MUL | Entity attribute | `student_award_evaluations.student_profile_id` | Directly dependent on `student_award_evaluations` PK | **AUTHORITATIVE** | KEEP |
| 5 | `evaluator_profile_id` | `char(36)` | YES | MUL | Entity attribute | `student_award_evaluations.evaluator_profile_id` | Directly dependent on `student_award_evaluations` PK | **AUTHORITATIVE** | KEEP |
| 6 | `status` | `varchar(20)` | NO | - | Entity attribute | `student_award_evaluations.status` | Directly dependent on `student_award_evaluations` PK | **AUTHORITATIVE** | KEEP |
| 7 | `raw_score` | `decimal(10,2)` | NO | - | Entity attribute | `student_award_evaluations.raw_score` | Directly dependent on `student_award_evaluations` PK | **AUTHORITATIVE** | KEEP |
| 8 | `max_computable_score` | `decimal(10,2)` | NO | - | Entity attribute | `student_award_evaluations.max_computable_score` | Directly dependent on `student_award_evaluations` PK | **AUTHORITATIVE** | KEEP |
| 9 | `potential_score` | `decimal(5,2)` | NO | - | Entity attribute | `student_award_evaluations.potential_score` | Directly dependent on `student_award_evaluations` PK | **AUTHORITATIVE** | KEEP |
| 10 | `qualifies_portfolio_based` | `tinyint(1)` | NO | - | Entity attribute | `student_award_evaluations.qualifies_portfolio_based` | Directly dependent on `student_award_evaluations` PK | **AUTHORITATIVE** | KEEP |
| 11 | `candidate_status` | `varchar(30)` | YES | - | Entity attribute | `student_award_evaluations.candidate_status` | Directly dependent on `student_award_evaluations` PK | **AUTHORITATIVE** | KEEP |
| 12 | `candidate_classified_at` | `datetime(6)` | YES | - | Audit / lifecycle timestamp or actor reference | `student_award_evaluations.candidate_classified_at` | Depends on `student_award_evaluations` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 13 | `evaluated_at` | `datetime(6)` | YES | - | Audit / lifecycle timestamp or actor reference | `student_award_evaluations.evaluated_at` | Depends on `student_award_evaluations` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 14 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `student_award_evaluations.created_at` | Depends on `student_award_evaluations` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 15 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `student_award_evaluations.updated_at` | Depends on `student_award_evaluations` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `student_award_score_evidence`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `student_award_score_evidence.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `criterion_score_id` | `char(36)` | NO | MUL | Entity attribute | `student_award_score_evidence.criterion_score_id` | Directly dependent on `student_award_score_evidence` PK | **AUTHORITATIVE** | KEEP |
| 3 | `portfolio_record_id` | `char(36)` | NO | MUL | Entity attribute | `student_award_score_evidence.portfolio_record_id` | Directly dependent on `student_award_score_evidence` PK | **AUTHORITATIVE** | KEEP |
| 4 | `scoring_rule_id` | `char(36)` | YES | MUL | Entity attribute | `student_award_score_evidence.scoring_rule_id` | Directly dependent on `student_award_score_evidence` PK | **AUTHORITATIVE** | KEEP |
| 5 | `points_effect` | `decimal(10,2)` | NO | - | Entity attribute | `student_award_score_evidence.points_effect` | Directly dependent on `student_award_score_evidence` PK | **AUTHORITATIVE** | KEEP |
| 6 | `basis_snapshot` | `json` | YES | - | Entity attribute | `student_award_score_evidence.basis_snapshot` | Directly dependent on `student_award_score_evidence` PK | **AUTHORITATIVE** | KEEP |
| 7 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `student_award_score_evidence.created_at` | Depends on `student_award_score_evidence` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `student_portfolio_evidence`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `student_portfolio_evidence.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `portfolio_record_id` | `char(36)` | NO | MUL | Entity attribute | `student_portfolio_evidence.portfolio_record_id` | Directly dependent on `student_portfolio_evidence` PK | **AUTHORITATIVE** | KEEP |
| 3 | `storage_path` | `varchar(500)` | NO | - | Entity attribute | `student_portfolio_evidence.storage_path` | Directly dependent on `student_portfolio_evidence` PK | **AUTHORITATIVE** | KEEP |
| 4 | `original_filename` | `varchar(255)` | NO | - | Entity attribute | `student_portfolio_evidence.original_filename` | Directly dependent on `student_portfolio_evidence` PK | **AUTHORITATIVE** | KEEP |
| 5 | `mime_type` | `varchar(100)` | NO | - | Entity attribute | `student_portfolio_evidence.mime_type` | Directly dependent on `student_portfolio_evidence` PK | **AUTHORITATIVE** | KEEP |
| 6 | `detected_mime_type` | `varchar(100)` | YES | - | Entity attribute | `student_portfolio_evidence.detected_mime_type` | Directly dependent on `student_portfolio_evidence` PK | **AUTHORITATIVE** | KEEP |
| 7 | `byte_size` | `bigint` | NO | - | Entity attribute | `student_portfolio_evidence.byte_size` | Directly dependent on `student_portfolio_evidence` PK | **AUTHORITATIVE** | KEEP |
| 8 | `checksum` | `varchar(64)` | YES | - | Entity attribute | `student_portfolio_evidence.checksum` | Directly dependent on `student_portfolio_evidence` PK | **AUTHORITATIVE** | KEEP |
| 9 | `sha256` | `varchar(64)` | YES | - | Entity attribute | `student_portfolio_evidence.sha256` | Directly dependent on `student_portfolio_evidence` PK | **AUTHORITATIVE** | KEEP |
| 10 | `evidence_type` | `varchar(50)` | NO | - | Entity attribute | `student_portfolio_evidence.evidence_type` | Directly dependent on `student_portfolio_evidence` PK | **AUTHORITATIVE** | KEEP |
| 11 | `uploaded_by` | `char(36)` | NO | MUL | Audit / lifecycle timestamp or actor reference | `student_portfolio_evidence.uploaded_by` | Depends on `student_portfolio_evidence` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 12 | `uploaded_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `student_portfolio_evidence.uploaded_at` | Depends on `student_portfolio_evidence` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 13 | `security_status` | `varchar(30)` | NO | - | Entity attribute | `student_portfolio_evidence.security_status` | Directly dependent on `student_portfolio_evidence` PK | **AUTHORITATIVE** | KEEP |
| 14 | `malware_scanner` | `varchar(100)` | NO | - | Entity attribute | `student_portfolio_evidence.malware_scanner` | Directly dependent on `student_portfolio_evidence` PK | **AUTHORITATIVE** | KEEP |
| 15 | `security_validated_at` | `datetime(6)` | YES | - | Audit / lifecycle timestamp or actor reference | `student_portfolio_evidence.security_validated_at` | Depends on `student_portfolio_evidence` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 16 | `status` | `varchar(20)` | NO | - | Entity attribute | `student_portfolio_evidence.status` | Directly dependent on `student_portfolio_evidence` PK | **AUTHORITATIVE** | KEEP |

### Table: `student_portfolio_records`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `student_portfolio_records.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `student_profile_id` | `char(36)` | NO | MUL | Entity attribute | `student_portfolio_records.student_profile_id` | Directly dependent on `student_portfolio_records` PK | **AUTHORITATIVE** | KEEP |
| 3 | `category_id` | `char(36)` | NO | MUL | Entity attribute | `student_portfolio_records.category_id` | Directly dependent on `student_portfolio_records` PK | **AUTHORITATIVE** | KEEP |
| 4 | `subcategory_id` | `char(36)` | YES | MUL | Entity attribute | `student_portfolio_records.subcategory_id` | Directly dependent on `student_portfolio_records` PK | **AUTHORITATIVE** | KEEP |
| 5 | `title` | `varchar(255)` | NO | - | Entity attribute | `student_portfolio_records.title` | Directly dependent on `student_portfolio_records` PK | **AUTHORITATIVE** | KEEP |
| 6 | `organizer_or_body` | `varchar(255)` | YES | - | Entity attribute | `student_portfolio_records.organizer_or_body` | Directly dependent on `student_portfolio_records` PK | **AUTHORITATIVE** | KEEP |
| 7 | `occurrence_date` | `date` | YES | - | Entity attribute | `student_portfolio_records.occurrence_date` | Directly dependent on `student_portfolio_records` PK | **AUTHORITATIVE** | KEEP |
| 8 | `start_date` | `date` | YES | - | Entity attribute | `student_portfolio_records.start_date` | Directly dependent on `student_portfolio_records` PK | **AUTHORITATIVE** | KEEP |
| 9 | `end_date` | `date` | YES | - | Entity attribute | `student_portfolio_records.end_date` | Directly dependent on `student_portfolio_records` PK | **AUTHORITATIVE** | KEEP |
| 10 | `description` | `text` | YES | - | Entity attribute | `student_portfolio_records.description` | Directly dependent on `student_portfolio_records` PK | **AUTHORITATIVE** | KEEP |
| 11 | `structured_metadata` | `json` | YES | - | Entity attribute | `student_portfolio_records.structured_metadata` | Directly dependent on `student_portfolio_records` PK | **AUTHORITATIVE** | KEEP |
| 12 | `status` | `varchar(30)` | NO | MUL | Entity attribute | `student_portfolio_records.status` | Directly dependent on `student_portfolio_records` PK | **AUTHORITATIVE** | KEEP |
| 13 | `submitted_at` | `datetime(6)` | YES | MUL | Audit / lifecycle timestamp or actor reference | `student_portfolio_records.submitted_at` | Depends on `student_portfolio_records` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 14 | `verified_at` | `datetime(6)` | YES | - | Audit / lifecycle timestamp or actor reference | `student_portfolio_records.verified_at` | Depends on `student_portfolio_records` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 15 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `student_portfolio_records.created_at` | Depends on `student_portfolio_records` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 16 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `student_portfolio_records.updated_at` | Depends on `student_portfolio_records` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `student_portfolio_verification_events`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `student_portfolio_verification_events.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `portfolio_record_id` | `char(36)` | NO | MUL | Entity attribute | `student_portfolio_verification_events.portfolio_record_id` | Directly dependent on `student_portfolio_verification_events` PK | **AUTHORITATIVE** | KEEP |
| 3 | `actor_profile_id` | `char(36)` | YES | MUL | Entity attribute | `student_portfolio_verification_events.actor_profile_id` | Directly dependent on `student_portfolio_verification_events` PK | **AUTHORITATIVE** | KEEP |
| 4 | `action` | `varchar(30)` | NO | - | Entity attribute | `student_portfolio_verification_events.action` | Directly dependent on `student_portfolio_verification_events` PK | **AUTHORITATIVE** | KEEP |
| 5 | `previous_status` | `varchar(30)` | YES | - | Entity attribute | `student_portfolio_verification_events.previous_status` | Directly dependent on `student_portfolio_verification_events` PK | **AUTHORITATIVE** | KEEP |
| 6 | `new_status` | `varchar(30)` | NO | - | Entity attribute | `student_portfolio_verification_events.new_status` | Directly dependent on `student_portfolio_verification_events` PK | **AUTHORITATIVE** | KEEP |
| 7 | `remarks` | `text` | YES | - | Entity attribute | `student_portfolio_verification_events.remarks` | Directly dependent on `student_portfolio_verification_events` PK | **AUTHORITATIVE** | KEEP |
| 8 | `occurred_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `student_portfolio_verification_events.occurred_at` | Depends on `student_portfolio_verification_events` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `student_profiles`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `profile_id` | `char(36)` | NO | PRI | Primary Key | `student_profiles.profile_id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `year_level` | `varchar(20)` | YES | - | Current cached/profile-level student year level | `student_program_enrollments.year_level` | Transitive to active enrollment | **CACHED** | KEEP (Document as derived cache of active enrollment) |
| 3 | `enrollment_status` | `varchar(30)` | NO | - | Entity attribute | `student_profiles.enrollment_status` | Directly dependent on `student_profiles` PK | **AUTHORITATIVE** | KEEP |
| 4 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `student_profiles.created_at` | Depends on `student_profiles` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 5 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `student_profiles.updated_at` | Depends on `student_profiles` PK | **HISTORICAL_SNAPSHOT** | KEEP |

### Table: `student_program_enrollments`

| Col # | Column Name | Type | Nullable | Key | Business Meaning | Source of Truth | Functional Dependency | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | Primary Key | `student_program_enrollments.id` | Primary Key determinant | **AUTHORITATIVE** | KEEP |
| 2 | `student_profile_id` | `char(36)` | NO | MUL | Entity attribute | `student_program_enrollments.student_profile_id` | Directly dependent on `student_program_enrollments` PK | **AUTHORITATIVE** | KEEP |
| 3 | `academic_program_id` | `char(36)` | NO | MUL | Entity attribute | `student_program_enrollments.academic_program_id` | Directly dependent on `student_program_enrollments` PK | **AUTHORITATIVE** | KEEP |
| 4 | `year_level` | `varchar(20)` | NO | - | Historical & authoritative year level for this program enrollment term | `student_program_enrollments.year_level` | Depends on enrollment instance PK (`id`) | **AUTHORITATIVE** | KEEP (Primary Source of Truth) |
| 5 | `academic_year` | `varchar(20)` | NO | - | Entity attribute | `student_program_enrollments.academic_year` | Directly dependent on `student_program_enrollments` PK | **AUTHORITATIVE** | KEEP |
| 6 | `effective_from` | `date` | NO | - | Entity attribute | `student_program_enrollments.effective_from` | Directly dependent on `student_program_enrollments` PK | **AUTHORITATIVE** | KEEP |
| 7 | `effective_until` | `date` | YES | - | Entity attribute | `student_program_enrollments.effective_until` | Directly dependent on `student_program_enrollments` PK | **AUTHORITATIVE** | KEEP |
| 8 | `is_active` | `tinyint(1)` | NO | - | Entity attribute | `student_program_enrollments.is_active` | Directly dependent on `student_program_enrollments` PK | **AUTHORITATIVE** | KEEP |
| 9 | `created_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `student_program_enrollments.created_at` | Depends on `student_program_enrollments` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 10 | `updated_at` | `datetime(6)` | NO | - | Audit / lifecycle timestamp or actor reference | `student_program_enrollments.updated_at` | Depends on `student_program_enrollments` PK | **HISTORICAL_SNAPSHOT** | KEEP |
| 11 | `active_student_guard` | `char(36)` | YES | UNI | Virtual generated column for single-active uniqueness | Generated expression | Depends on `is_active` / status | **DERIVED** | KEEP (Constraint guard mechanism) |

