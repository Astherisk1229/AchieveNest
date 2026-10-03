# AchieveNest — Phase 1: Attribute Inventory

> **Database:** `achievenest_local`  
> **Total Tables Audited:** 64  

---

### Table: `academic_programs`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `college_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `code` | `varchar(20)` | NO | UNI | NULL | - | Unique constraint |
| 4 | `name` | `varchar(150)` | NO | - | NULL | - | Standard attribute |
| 5 | `degree_level` | `varchar(30)` | NO | - | undergraduate | - | Standard attribute |
| 6 | `status` | `varchar(20)` | NO | - | active | - | Standard attribute |
| 7 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 8 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `account_lifecycle_events`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `actor_profile_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 4 | `event_type` | `varchar(50)` | NO | - | NULL | - | Standard attribute |
| 5 | `previous_status` | `varchar(20)` | YES | - | NULL | - | Standard attribute |
| 6 | `new_status` | `varchar(20)` | NO | - | NULL | - | Standard attribute |
| 7 | `reason` | `text` | YES | - | NULL | - | Standard attribute |
| 8 | `metadata` | `json` | YES | - | NULL | - | Standard attribute |
| 9 | `occurred_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |

### Table: `administrative_units`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `code` | `varchar(20)` | NO | UNI | NULL | - | Unique constraint |
| 3 | `name` | `varchar(150)` | NO | UNI | NULL | - | Unique constraint |
| 4 | `unit_type` | `varchar(50)` | NO | - | central_office | - | Standard attribute |
| 5 | `college_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 6 | `description` | `text` | YES | - | NULL | - | Standard attribute |
| 7 | `status` | `varchar(20)` | NO | - | active | - | Standard attribute |
| 8 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 9 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `attendance_records`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `session_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `attendee_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `scanned_by` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 5 | `checked_in_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 6 | `verification_method` | `varchar(30)` | NO | - | qr_scan | - | Standard attribute |

### Table: `attendance_sessions`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `event_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `session_name` | `varchar(150)` | NO | - | NULL | - | Standard attribute |
| 4 | `session_type` | `varchar(30)` | NO | - | general | - | Standard attribute |
| 5 | `check_in_start` | `datetime(6)` | NO | - | NULL | - | Standard attribute |
| 6 | `check_in_end` | `datetime(6)` | NO | - | NULL | - | Standard attribute |
| 7 | `status` | `varchar(20)` | NO | - | scheduled | - | Standard attribute |
| 8 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 9 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `audit_logs`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `actor_profile_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 3 | `event_code` | `varchar(100)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `category` | `varchar(50)` | NO | - | NULL | - | Standard attribute |
| 5 | `target_type` | `varchar(50)` | YES | - | NULL | - | Standard attribute |
| 6 | `target_id` | `char(36)` | YES | - | NULL | - | Standard attribute |
| 7 | `outcome` | `varchar(20)` | NO | - | NULL | - | Standard attribute |
| 8 | `ip_address` | `varchar(45)` | YES | - | NULL | - | Standard attribute |
| 9 | `user_agent` | `text` | YES | - | NULL | - | Standard attribute |
| 10 | `details` | `text` | NO | - | NULL | - | Standard attribute |
| 11 | `safe_context` | `json` | YES | - | NULL | - | Standard attribute |
| 12 | `created_at` | `datetime(6)` | NO | MUL | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Indexed / Foreign key |

### Table: `award_candidate_manual_decisions`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `cycle_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `award_definition_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `student_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 5 | `decision_type` | `varchar(50)` | NO | - | NULL | - | Standard attribute |
| 6 | `reason` | `text` | NO | - | NULL | - | Standard attribute |
| 7 | `decided_by` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 8 | `previous_status` | `varchar(50)` | YES | - | NULL | - | Standard attribute |
| 9 | `new_status` | `varchar(50)` | NO | - | NULL | - | Standard attribute |
| 10 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 11 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `award_criteria`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `award_definition_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `scoring_model_version_id` | `char(36)` | YES | - | NULL | - | Standard attribute |
| 4 | `code` | `varchar(50)` | NO | - | NULL | - | Standard attribute |
| 5 | `name` | `varchar(200)` | NO | - | NULL | - | Standard attribute |
| 6 | `weight` | `decimal(5,2)` | NO | - | 100.00 | - | Standard attribute |
| 7 | `max_points` | `decimal(10,2)` | NO | - | NULL | - | Standard attribute |
| 8 | `sort_order` | `int` | NO | - | 1 | - | Standard attribute |
| 9 | `is_portfolio_computable` | `tinyint(1)` | NO | - | 1 | - | Standard attribute |
| 10 | `authority_status` | `varchar(50)` | NO | - | OFFICIAL | - | Standard attribute |
| 11 | `source_rubric_reference` | `varchar(255)` | YES | - | NULL | - | Standard attribute |
| 12 | `is_published` | `tinyint(1)` | NO | - | 1 | - | Standard attribute |
| 13 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 14 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `award_criterion_components`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `criterion_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `code` | `varchar(50)` | NO | - | NULL | - | Standard attribute |
| 4 | `name` | `varchar(200)` | NO | - | NULL | - | Standard attribute |
| 5 | `description` | `text` | YES | - | NULL | - | Standard attribute |
| 6 | `max_points` | `decimal(10,2)` | NO | - | NULL | - | Standard attribute |
| 7 | `sort_order` | `int` | NO | - | 1 | - | Standard attribute |
| 8 | `is_computable` | `tinyint(1)` | NO | - | 1 | - | Standard attribute |
| 9 | `authority_status` | `varchar(50)` | NO | - | OFFICIAL | - | Standard attribute |
| 10 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 11 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `award_cycles`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `code` | `varchar(50)` | NO | UNI | NULL | - | Unique constraint |
| 3 | `academic_year` | `varchar(20)` | NO | - | NULL | - | Standard attribute |
| 4 | `name` | `varchar(150)` | NO | - | NULL | - | Standard attribute |
| 5 | `semester` | `varchar(20)` | NO | - | 2nd Semester | - | Standard attribute |
| 6 | `start_date` | `date` | NO | - | NULL | - | Standard attribute |
| 7 | `end_date` | `date` | NO | - | NULL | - | Standard attribute |
| 8 | `candidate_threshold` | `decimal(5,2)` | NO | - | 80.00 | - | Standard attribute |
| 9 | `status` | `varchar(20)` | NO | - | draft | - | Standard attribute |
| 10 | `opens_at` | `datetime(6)` | YES | - | NULL | - | Standard attribute |
| 11 | `closes_at` | `datetime(6)` | YES | - | NULL | - | Standard attribute |
| 12 | `created_by` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 13 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |

### Table: `award_definitions`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `code` | `varchar(50)` | NO | UNI | NULL | - | Unique constraint |
| 3 | `name` | `varchar(200)` | NO | UNI | NULL | - | Unique constraint |
| 4 | `category` | `varchar(50)` | NO | - | leadership | - | Standard attribute |
| 5 | `description` | `text` | YES | - | NULL | - | Standard attribute |
| 6 | `candidate_threshold_percent` | `decimal(5,2)` | NO | - | 80.00 | - | Standard attribute |
| 7 | `gender_restriction` | `varchar(20)` | YES | - | NULL | - | Standard attribute |
| 8 | `graduating_only` | `tinyint(1)` | NO | - | 1 | - | Standard attribute |
| 9 | `status` | `varchar(20)` | NO | - | active | - | Standard attribute |
| 10 | `authority_status` | `varchar(50)` | NO | - | OFFICIAL | - | Standard attribute |
| 11 | `source_fidelity_status` | `varchar(50)` | NO | - | PENDING_RECONCILIATION | - | Standard attribute |
| 12 | `is_catalog_visible` | `tinyint(1)` | NO | - | 1 | - | Standard attribute |
| 13 | `active_scoring_version` | `varchar(20)` | NO | - | 1.0 | - | Standard attribute |
| 14 | `metadata` | `json` | YES | - | NULL | - | Standard attribute |
| 15 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 16 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `award_evaluation_summary_reports`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `cycle_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `award_definition_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `college_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 5 | `generated_by` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 6 | `report_payload` | `json` | NO | - | NULL | - | Standard attribute |
| 7 | `total_evaluated` | `int` | NO | - | 0 | - | Standard attribute |
| 8 | `potential_candidates_count` | `int` | NO | - | 0 | - | Standard attribute |
| 9 | `generated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |

### Table: `award_evidence_mapping_conditions`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `mapping_rule_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `field_key` | `varchar(100)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `operator` | `varchar(20)` | NO | - | EQ | - | Standard attribute |
| 5 | `comparison_value` | `text` | YES | - | NULL | - | Standard attribute |
| 6 | `group_number` | `int` | NO | - | 1 | - | Standard attribute |
| 7 | `display_order` | `int` | NO | - | 1 | - | Standard attribute |
| 8 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 9 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `award_evidence_mapping_rules`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `scoring_model_version_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `criterion_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `criterion_component_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 5 | `rule_code` | `varchar(100)` | NO | - | NULL | - | Standard attribute |
| 6 | `name` | `varchar(200)` | NO | - | NULL | - | Standard attribute |
| 7 | `description` | `text` | YES | - | NULL | - | Standard attribute |
| 8 | `portfolio_category_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 9 | `portfolio_subcategory_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 10 | `authority_status` | `varchar(50)` | NO | - | OFFICIAL | - | Standard attribute |
| 11 | `priority` | `int` | NO | - | 1 | - | Standard attribute |
| 12 | `is_active` | `tinyint(1)` | NO | MUL | 1 | - | Indexed / Foreign key |
| 13 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 14 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `award_interview_eligibilities`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `cycle_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `award_definition_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `student_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 5 | `eligibility_source` | `varchar(30)` | NO | - | NULL | - | Standard attribute |
| 6 | `pathway` | `varchar(30)` | NO | - | automated_threshold | - | Standard attribute |
| 7 | `evaluation_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 8 | `dean_nomination_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 9 | `potential_score` | `decimal(5,2)` | YES | - | NULL | - | Standard attribute |
| 10 | `eligible_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 11 | `status` | `varchar(20)` | NO | - | eligible | - | Standard attribute |
| 12 | `revoked_at` | `datetime(6)` | YES | - | NULL | - | Standard attribute |
| 13 | `revoked_by` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 14 | `revocation_reason` | `text` | YES | - | NULL | - | Standard attribute |

### Table: `award_portfolio_mappings`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `scoring_rule_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `portfolio_category_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `portfolio_subcategory_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 5 | `metadata_predicate` | `json` | YES | - | NULL | - | Standard attribute |
| 6 | `is_active` | `tinyint(1)` | NO | - | 1 | - | Standard attribute |
| 7 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |

### Table: `award_scoring_model_versions`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `award_definition_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `award_cycle_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 4 | `version_number` | `varchar(20)` | NO | - | 1.0 | - | Standard attribute |
| 5 | `version_label` | `varchar(100)` | YES | - | NULL | - | Standard attribute |
| 6 | `status` | `varchar(20)` | NO | MUL | published | - | Indexed / Foreign key |
| 7 | `candidate_threshold_percent` | `decimal(5,2)` | NO | - | 80.00 | - | Standard attribute |
| 8 | `graduating_only` | `tinyint(1)` | NO | - | 1 | - | Standard attribute |
| 9 | `gender_requirement` | `varchar(20)` | YES | - | NULL | - | Standard attribute |
| 10 | `authority_status` | `varchar(50)` | NO | - | OFFICIAL | - | Standard attribute |
| 11 | `published_at` | `datetime(6)` | YES | - | NULL | - | Standard attribute |
| 12 | `published_by` | `char(36)` | YES | - | NULL | - | Standard attribute |
| 13 | `retired_at` | `datetime(6)` | YES | - | NULL | - | Standard attribute |
| 14 | `retired_by` | `char(36)` | YES | - | NULL | - | Standard attribute |
| 15 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 16 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `award_scoring_rules`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `criterion_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `scoring_model_version_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 4 | `criterion_component_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 5 | `parent_rule_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 6 | `code` | `varchar(50)` | NO | - | NULL | - | Standard attribute |
| 7 | `name` | `varchar(200)` | NO | - | NULL | - | Standard attribute |
| 8 | `rule_type` | `varchar(50)` | NO | - | NULL | - | Standard attribute |
| 9 | `points` | `decimal(10,2)` | YES | - | NULL | - | Standard attribute |
| 10 | `max_points` | `decimal(10,2)` | YES | - | NULL | - | Standard attribute |
| 11 | `rule_config` | `json` | YES | - | NULL | - | Standard attribute |
| 12 | `authority_status` | `varchar(50)` | NO | - | OFFICIAL | - | Standard attribute |
| 13 | `is_active` | `tinyint(1)` | NO | MUL | 1 | - | Indexed / Foreign key |
| 14 | `sort_order` | `int` | NO | - | 1 | - | Standard attribute |
| 15 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 16 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `award_student_evaluation_summaries`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `evaluation_id` | `char(36)` | NO | UNI | NULL | - | Unique constraint |
| 3 | `student_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `award_definition_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 5 | `cycle_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 6 | `scoring_model_version_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 7 | `summary_payload` | `json` | NO | - | NULL | - | Standard attribute |
| 8 | `raw_score` | `decimal(10,2)` | NO | - | 0.00 | - | Standard attribute |
| 9 | `max_computable_score` | `decimal(10,2)` | NO | - | 100.00 | - | Standard attribute |
| 10 | `potential_score` | `decimal(5,2)` | NO | - | 0.00 | - | Standard attribute |
| 11 | `candidate_threshold_percent` | `decimal(5,2)` | NO | - | 80.00 | - | Standard attribute |
| 12 | `qualifies_portfolio_based` | `tinyint(1)` | NO | - | 0 | - | Standard attribute |
| 13 | `candidate_pathway` | `varchar(50)` | NO | - | automatic_portfolio | - | Standard attribute |
| 14 | `generated_by` | `char(36)` | YES | - | NULL | - | Standard attribute |
| 15 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 16 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `certificate_issuance_batches`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `event_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 3 | `template_version_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `issuer_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 5 | `batch_name` | `varchar(150)` | NO | - | NULL | - | Standard attribute |
| 6 | `issued_count` | `int` | NO | - | 0 | - | Standard attribute |
| 7 | `status` | `varchar(20)` | NO | - | completed | - | Standard attribute |
| 8 | `issued_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |

### Table: `certificate_template_families`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `code` | `varchar(50)` | NO | UNI | NULL | - | Unique constraint |
| 3 | `name` | `varchar(150)` | NO | - | NULL | - | Standard attribute |
| 4 | `description` | `text` | YES | - | NULL | - | Standard attribute |
| 5 | `category` | `varchar(50)` | NO | - | NULL | - | Standard attribute |
| 6 | `status` | `varchar(20)` | NO | - | active | - | Standard attribute |
| 7 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 8 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `certificate_template_versions`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `family_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `version_number` | `int` | NO | - | NULL | - | Standard attribute |
| 4 | `layout_config` | `json` | NO | - | NULL | - | Standard attribute |
| 5 | `signatories_config` | `json` | NO | - | NULL | - | Standard attribute |
| 6 | `background_storage_path` | `varchar(500)` | YES | - | NULL | - | Standard attribute |
| 7 | `status` | `varchar(20)` | NO | - | active | - | Standard attribute |
| 8 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |

### Table: `colleges`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `code` | `varchar(20)` | NO | UNI | NULL | - | Unique constraint |
| 3 | `name` | `varchar(150)` | NO | - | NULL | - | Standard attribute |
| 4 | `description` | `text` | YES | - | NULL | - | Standard attribute |
| 5 | `status` | `varchar(20)` | NO | - | active | - | Standard attribute |
| 6 | `logo_storage_key` | `varchar(500)` | YES | - | NULL | - | Standard attribute |
| 7 | `logo_original_name` | `varchar(255)` | YES | - | NULL | - | Standard attribute |
| 8 | `logo_mime_type` | `varchar(100)` | YES | - | NULL | - | Standard attribute |
| 9 | `logo_updated_at` | `datetime(6)` | YES | - | NULL | - | Standard attribute |
| 10 | `acronym_badge_color` | `varchar(7)` | YES | - | NULL | - | Standard attribute |
| 11 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 12 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `dean_assignments`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `personnel_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `college_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `effective_from` | `date` | NO | - | NULL | - | Standard attribute |
| 5 | `effective_until` | `date` | YES | - | NULL | - | Standard attribute |
| 6 | `is_active` | `tinyint(1)` | NO | - | 1 | - | Standard attribute |
| 7 | `assigned_by` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 8 | `assigned_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 9 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 10 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |
| 11 | `active_college_dean_guard` | `char(36)` | YES | UNI | NULL | VIRTUAL GENERATED | Generated virtual/stored guard |
| 12 | `active_personnel_dean_guard` | `char(36)` | YES | UNI | NULL | VIRTUAL GENERATED | Generated virtual/stored guard |

### Table: `dean_student_nominations`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `cycle_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `award_definition_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `student_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 5 | `dean_assignment_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 6 | `dean_profile_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 7 | `college_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 8 | `justification` | `text` | NO | - | NULL | - | Standard attribute |
| 9 | `status` | `varchar(20)` | NO | - | active | - | Standard attribute |
| 10 | `nominated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 11 | `withdrawn_at` | `datetime(6)` | YES | - | NULL | - | Standard attribute |
| 12 | `withdrawal_reason` | `text` | YES | - | NULL | - | Standard attribute |

### Table: `events`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `organizer_profile_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 3 | `organization_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 4 | `college_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 5 | `administrative_unit_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 6 | `title` | `varchar(255)` | NO | - | NULL | - | Standard attribute |
| 7 | `description` | `text` | YES | - | NULL | - | Standard attribute |
| 8 | `event_type` | `varchar(50)` | NO | - | NULL | - | Standard attribute |
| 9 | `start_time` | `datetime(6)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 10 | `end_time` | `datetime(6)` | NO | - | NULL | - | Standard attribute |
| 11 | `venue` | `varchar(255)` | YES | - | NULL | - | Standard attribute |
| 12 | `status` | `varchar(30)` | NO | MUL | published | - | Indexed / Foreign key |
| 13 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 14 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `file_security_audit_events`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `actor_profile_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 3 | `evidence_domain` | `varchar(50)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `evidence_id` | `char(36)` | NO | - | NULL | - | Standard attribute |
| 5 | `storage_bucket` | `varchar(100)` | NO | - | NULL | - | Standard attribute |
| 6 | `storage_path` | `varchar(500)` | NO | - | NULL | - | Standard attribute |
| 7 | `detected_mime_type` | `varchar(100)` | NO | - | NULL | - | Standard attribute |
| 8 | `byte_size` | `bigint` | NO | - | NULL | - | Standard attribute |
| 9 | `sha256` | `varchar(64)` | NO | - | NULL | - | Standard attribute |
| 10 | `scanner` | `varchar(100)` | NO | - | NULL | - | Standard attribute |
| 11 | `result` | `varchar(20)` | NO | - | NULL | - | Standard attribute |
| 12 | `details` | `json` | YES | - | NULL | - | Standard attribute |
| 13 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |

### Table: `issued_certificates`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `batch_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `recipient_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `certificate_code` | `varchar(100)` | NO | UNI | NULL | - | Unique constraint |
| 5 | `render_payload` | `json` | NO | - | NULL | - | Standard attribute |
| 6 | `storage_path` | `varchar(500)` | YES | - | NULL | - | Standard attribute |
| 7 | `status` | `varchar(20)` | NO | - | valid | - | Standard attribute |
| 8 | `issued_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 9 | `revoked_at` | `datetime(6)` | YES | - | NULL | - | Standard attribute |
| 10 | `revocation_reason` | `text` | YES | - | NULL | - | Standard attribute |

### Table: `local_auth_credentials`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `profile_id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `password_hash` | `varchar(255)` | NO | - | NULL | - | Standard attribute |
| 3 | `password_changed_at` | `datetime(6)` | YES | - | NULL | - | Standard attribute |
| 4 | `status` | `varchar(20)` | NO | - | active | - | Standard attribute |
| 5 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 6 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `local_auth_sessions`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `token_hash` | `char(64)` | NO | UNI | NULL | - | Unique constraint |
| 4 | `issued_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 5 | `expires_at` | `datetime(6)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 6 | `last_seen_at` | `datetime(6)` | YES | - | NULL | - | Standard attribute |
| 7 | `revoked_at` | `datetime(6)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 8 | `revocation_reason` | `varchar(64)` | YES | - | NULL | - | Standard attribute |
| 9 | `created_ip` | `varchar(45)` | YES | - | NULL | - | Standard attribute |
| 10 | `user_agent_hash` | `char(64)` | YES | - | NULL | - | Standard attribute |

### Table: `migrations`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `bigint unsigned` | NO | PRI | NULL | auto_increment | Primary key |
| 2 | `version` | `varchar(255)` | NO | - | NULL | - | Standard attribute |
| 3 | `class` | `varchar(255)` | NO | - | NULL | - | Standard attribute |
| 4 | `group` | `varchar(255)` | NO | - | NULL | - | Standard attribute |
| 5 | `namespace` | `varchar(255)` | NO | - | NULL | - | Standard attribute |
| 6 | `time` | `int` | NO | - | NULL | - | Standard attribute |
| 7 | `batch` | `int unsigned` | NO | - | NULL | - | Standard attribute |

### Table: `notification_preferences`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `category` | `varchar(50)` | NO | - | NULL | - | Standard attribute |
| 4 | `email_enabled` | `tinyint(1)` | NO | - | 1 | - | Standard attribute |
| 5 | `in_app_enabled` | `tinyint(1)` | NO | - | 1 | - | Standard attribute |
| 6 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 7 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `notifications`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `recipient_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `actor_profile_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 4 | `notification_type` | `varchar(50)` | NO | - | NULL | - | Standard attribute |
| 5 | `title` | `varchar(200)` | NO | - | NULL | - | Standard attribute |
| 6 | `message` | `text` | NO | - | NULL | - | Standard attribute |
| 7 | `reference_type` | `varchar(50)` | YES | - | NULL | - | Standard attribute |
| 8 | `reference_id` | `char(36)` | YES | - | NULL | - | Standard attribute |
| 9 | `is_mandatory` | `tinyint(1)` | NO | - | 0 | - | Standard attribute |
| 10 | `read_at` | `datetime(6)` | YES | - | NULL | - | Standard attribute |
| 11 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |

### Table: `organization_moderator_assignments`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `organization_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `personnel_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `effective_from` | `date` | NO | - | NULL | - | Standard attribute |
| 5 | `effective_until` | `date` | YES | - | NULL | - | Standard attribute |
| 6 | `is_active` | `tinyint(1)` | NO | - | 1 | - | Standard attribute |
| 7 | `assigned_by` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 8 | `assigned_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 9 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 10 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |
| 11 | `active_org_moderator_guard` | `char(36)` | YES | UNI | NULL | VIRTUAL GENERATED | Generated virtual/stored guard |

### Table: `organization_program_affiliations`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `organization_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `academic_program_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |

### Table: `organizations`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `college_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 3 | `code` | `varchar(30)` | NO | UNI | NULL | - | Unique constraint |
| 4 | `name` | `varchar(150)` | NO | - | NULL | - | Standard attribute |
| 5 | `scope` | `varchar(30)` | NO | - | NULL | - | Standard attribute |
| 6 | `category` | `varchar(50)` | NO | - | NULL | - | Standard attribute |
| 7 | `status` | `varchar(20)` | NO | - | active | - | Standard attribute |
| 8 | `logo_storage_key` | `varchar(500)` | YES | - | NULL | - | Standard attribute |
| 9 | `logo_original_name` | `varchar(255)` | YES | - | NULL | - | Standard attribute |
| 10 | `logo_mime_type` | `varchar(100)` | YES | - | NULL | - | Standard attribute |
| 11 | `logo_updated_at` | `datetime(6)` | YES | - | NULL | - | Standard attribute |
| 12 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 13 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `password_reset_requests`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `institutional_email` | `varchar(255)` | NO | - | NULL | - | Standard attribute |
| 3 | `reason` | `text` | NO | - | NULL | - | Standard attribute |
| 4 | `status` | `varchar(20)` | NO | - | pending | - | Standard attribute |
| 5 | `ip_address` | `varchar(45)` | YES | - | NULL | - | Standard attribute |
| 6 | `user_agent` | `text` | YES | - | NULL | - | Standard attribute |
| 7 | `processed_by` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 8 | `processed_at` | `datetime(6)` | YES | - | NULL | - | Standard attribute |
| 9 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 10 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `personnel_accomplishment_evidence`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `accomplishment_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `storage_path` | `varchar(500)` | NO | - | NULL | - | Standard attribute |
| 4 | `original_filename` | `varchar(255)` | NO | - | NULL | - | Standard attribute |
| 5 | `mime_type` | `varchar(100)` | NO | - | NULL | - | Standard attribute |
| 6 | `detected_mime_type` | `varchar(100)` | YES | - | NULL | - | Standard attribute |
| 7 | `byte_size` | `bigint` | NO | - | NULL | - | Standard attribute |
| 8 | `checksum` | `varchar(64)` | YES | - | NULL | - | Standard attribute |
| 9 | `sha256` | `varchar(64)` | YES | - | NULL | - | Standard attribute |
| 10 | `uploaded_by` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 11 | `uploaded_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 12 | `security_status` | `varchar(30)` | NO | - | clean | - | Standard attribute |
| 13 | `malware_scanner` | `varchar(100)` | NO | - | backend_clamav_v1 | - | Standard attribute |
| 14 | `security_validated_at` | `datetime(6)` | YES | - | NULL | - | Standard attribute |
| 15 | `status` | `varchar(20)` | NO | - | active | - | Standard attribute |

### Table: `personnel_accomplishments`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `personnel_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `domain` | `varchar(50)` | NO | - | NULL | - | Standard attribute |
| 4 | `title` | `varchar(255)` | NO | - | NULL | - | Standard attribute |
| 5 | `organizer_or_publisher` | `varchar(255)` | YES | - | NULL | - | Standard attribute |
| 6 | `occurrence_date` | `date` | YES | - | NULL | - | Standard attribute |
| 7 | `description` | `text` | YES | - | NULL | - | Standard attribute |
| 8 | `claimed_points` | `decimal(6,2)` | NO | - | 0.00 | - | Standard attribute |
| 9 | `status` | `varchar(30)` | NO | - | draft | - | Standard attribute |
| 10 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 11 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `personnel_administrative_unit_affiliations`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `personnel_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `administrative_unit_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `effective_from` | `date` | NO | - | NULL | - | Standard attribute |
| 5 | `effective_until` | `date` | YES | - | NULL | - | Standard attribute |
| 6 | `is_active` | `tinyint(1)` | NO | - | 1 | - | Standard attribute |
| 7 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 8 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |
| 9 | `active_personnel_unit_guard` | `char(36)` | YES | UNI | NULL | VIRTUAL GENERATED | Generated virtual/stored guard |

### Table: `personnel_college_affiliations`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `personnel_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `college_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `effective_from` | `date` | NO | - | NULL | - | Standard attribute |
| 5 | `effective_until` | `date` | YES | - | NULL | - | Standard attribute |
| 6 | `is_active` | `tinyint(1)` | NO | - | 1 | - | Standard attribute |
| 7 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 8 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |
| 9 | `active_personnel_guard` | `char(36)` | YES | UNI | NULL | VIRTUAL GENERATED | Generated virtual/stored guard |

### Table: `personnel_evaluation_deficiency_requests`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `evaluation_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `item_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 4 | `requested_by` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 5 | `deficiency_description` | `text` | NO | - | NULL | - | Standard attribute |
| 6 | `status` | `varchar(20)` | NO | - | pending | - | Standard attribute |
| 7 | `response_text` | `text` | YES | - | NULL | - | Standard attribute |
| 8 | `responded_at` | `datetime(6)` | YES | - | NULL | - | Standard attribute |
| 9 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 10 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `personnel_evaluation_events`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `evaluation_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `actor_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `action` | `varchar(50)` | NO | - | NULL | - | Standard attribute |
| 5 | `previous_status` | `varchar(30)` | YES | - | NULL | - | Standard attribute |
| 6 | `new_status` | `varchar(30)` | NO | - | NULL | - | Standard attribute |
| 7 | `remarks` | `text` | YES | - | NULL | - | Standard attribute |
| 8 | `occurred_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |

### Table: `personnel_evaluation_items`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `evaluation_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `accomplishment_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 4 | `domain` | `varchar(50)` | NO | - | NULL | - | Standard attribute |
| 5 | `item_description` | `text` | NO | - | NULL | - | Standard attribute |
| 6 | `claimed_points` | `decimal(5,2)` | NO | - | 0.00 | - | Standard attribute |
| 7 | `verified_points` | `decimal(5,2)` | NO | - | 0.00 | - | Standard attribute |
| 8 | `remarks` | `text` | YES | - | NULL | - | Standard attribute |
| 9 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |

### Table: `personnel_evaluation_reports`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `evaluation_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `generated_by` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `report_payload` | `json` | NO | - | NULL | - | Standard attribute |
| 5 | `summary_score` | `decimal(6,2)` | NO | - | NULL | - | Standard attribute |
| 6 | `passing_status` | `varchar(20)` | NO | - | NULL | - | Standard attribute |
| 7 | `generated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |

### Table: `personnel_evaluations`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `personnel_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `evaluator_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `academic_year` | `varchar(20)` | NO | - | NULL | - | Standard attribute |
| 5 | `semester` | `varchar(20)` | NO | - | NULL | - | Standard attribute |
| 6 | `score_professional_development` | `decimal(5,2)` | NO | - | 0.00 | - | Standard attribute |
| 7 | `score_productivity_creative_work` | `decimal(5,2)` | NO | - | 0.00 | - | Standard attribute |
| 8 | `score_service_leadership` | `decimal(5,2)` | NO | - | 0.00 | - | Standard attribute |
| 9 | `total_score` | `decimal(6,2)` | NO | - | 0.00 | - | Standard attribute |
| 10 | `passing_status` | `varchar(20)` | NO | - | fail | - | Standard attribute |
| 11 | `status` | `varchar(30)` | NO | - | draft | - | Standard attribute |
| 12 | `finalized_at` | `datetime(6)` | YES | - | NULL | - | Standard attribute |
| 13 | `finalized_by` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 14 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 15 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `personnel_profiles`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `profile_id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `personnel_classification` | `varchar(30)` | NO | - | academic | - | Standard attribute |
| 3 | `employment_status` | `varchar(30)` | NO | - | full_time | - | Standard attribute |
| 4 | `rank_level` | `varchar(50)` | YES | - | NULL | - | Standard attribute |
| 5 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 6 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `personnel_program_affiliations`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `personnel_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `academic_program_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `effective_from` | `date` | NO | - | NULL | - | Standard attribute |
| 5 | `effective_until` | `date` | YES | - | NULL | - | Standard attribute |
| 6 | `is_active` | `tinyint(1)` | NO | - | 1 | - | Standard attribute |
| 7 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 8 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `personnel_qualification_reviews`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `personnel_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `reviewer_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `qualification_status` | `varchar(30)` | NO | - | NULL | - | Standard attribute |
| 5 | `remarks` | `text` | YES | - | NULL | - | Standard attribute |
| 6 | `reviewed_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |

### Table: `portfolio_categories`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `code` | `varchar(50)` | NO | UNI | NULL | - | Unique constraint |
| 3 | `name` | `varchar(150)` | NO | - | NULL | - | Standard attribute |
| 4 | `description` | `text` | YES | - | NULL | - | Standard attribute |
| 5 | `sort_order` | `int` | NO | - | 0 | - | Standard attribute |
| 6 | `status` | `varchar(20)` | NO | - | active | - | Standard attribute |
| 7 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 8 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `portfolio_subcategories`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `category_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `code` | `varchar(100)` | NO | - | NULL | - | Standard attribute |
| 4 | `name` | `varchar(200)` | NO | - | NULL | - | Standard attribute |
| 5 | `description` | `text` | YES | - | NULL | - | Standard attribute |
| 6 | `metadata_requirements` | `json` | YES | - | NULL | - | Standard attribute |
| 7 | `sort_order` | `int` | NO | - | 0 | - | Standard attribute |
| 8 | `status` | `varchar(20)` | NO | - | active | - | Standard attribute |
| 9 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 10 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `profile_roles`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `role_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `scope_type` | `varchar(30)` | NO | MUL | university | - | Indexed / Foreign key |
| 5 | `scope_id` | `char(36)` | YES | - | NULL | - | Standard attribute |
| 6 | `is_active` | `tinyint(1)` | NO | - | 1 | - | Standard attribute |
| 7 | `assigned_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 8 | `assigned_by` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |

### Table: `profiles`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `institutional_id` | `varchar(50)` | NO | UNI | NULL | - | Unique constraint |
| 3 | `account_type` | `varchar(30)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `email` | `varchar(255)` | NO | UNI | NULL | - | Unique constraint |
| 5 | `full_name` | `varchar(255)` | NO | - | NULL | - | Standard attribute |
| 6 | `first_name` | `varchar(100)` | YES | - | NULL | - | Standard attribute |
| 7 | `middle_name` | `varchar(100)` | YES | - | NULL | - | Standard attribute |
| 8 | `last_name` | `varchar(100)` | YES | - | NULL | - | Standard attribute |
| 9 | `designation_title` | `varchar(150)` | YES | - | NULL | - | Standard attribute |
| 10 | `avatar_url` | `text` | YES | - | NULL | - | Standard attribute |
| 11 | `status` | `varchar(20)` | NO | - | active | - | Standard attribute |
| 12 | `must_change_password` | `tinyint(1)` | NO | - | 1 | - | Standard attribute |
| 13 | `password_hash` | `varchar(255)` | YES | - | NULL | - | Standard attribute |
| 14 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 15 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |
| 16 | `active_hr_guard` | `char(36)` | YES | UNI | NULL | VIRTUAL GENERATED | Generated virtual/stored guard |

### Table: `program_coordinator_assignments`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `personnel_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `academic_program_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `effective_from` | `date` | NO | - | NULL | - | Standard attribute |
| 5 | `effective_until` | `date` | YES | - | NULL | - | Standard attribute |
| 6 | `is_active` | `tinyint(1)` | NO | - | 1 | - | Standard attribute |
| 7 | `assigned_by` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 8 | `assigned_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 9 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 10 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |
| 11 | `active_program_coord_guard` | `char(36)` | YES | UNI | NULL | VIRTUAL GENERATED | Generated virtual/stored guard |

### Table: `role_assignment_events`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `actor_profile_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 3 | `target_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `assignment_type` | `varchar(50)` | NO | - | NULL | - | Standard attribute |
| 5 | `role_or_scope_id` | `char(36)` | YES | - | NULL | - | Standard attribute |
| 6 | `action` | `varchar(30)` | NO | - | NULL | - | Standard attribute |
| 7 | `metadata` | `json` | YES | - | NULL | - | Standard attribute |
| 8 | `occurred_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |

### Table: `roles`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `role_key` | `varchar(50)` | NO | UNI | NULL | - | Unique constraint |
| 3 | `display_name` | `varchar(100)` | NO | - | NULL | - | Standard attribute |
| 4 | `description` | `text` | YES | - | NULL | - | Standard attribute |
| 5 | `is_system_role` | `tinyint(1)` | NO | - | 1 | - | Standard attribute |
| 6 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 7 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `student_award_criterion_scores`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `evaluation_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `criterion_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `awarded_points` | `decimal(10,2)` | NO | - | 0.00 | - | Standard attribute |
| 5 | `max_points` | `decimal(10,2)` | NO | - | NULL | - | Standard attribute |
| 6 | `scoring_snapshot` | `json` | YES | - | NULL | - | Standard attribute |
| 7 | `evaluator_remarks` | `text` | YES | - | NULL | - | Standard attribute |
| 8 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 9 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `student_award_evaluations`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `cycle_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `award_definition_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `student_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 5 | `evaluator_profile_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 6 | `status` | `varchar(20)` | NO | - | pending | - | Standard attribute |
| 7 | `raw_score` | `decimal(10,2)` | NO | - | 0.00 | - | Standard attribute |
| 8 | `max_computable_score` | `decimal(10,2)` | NO | - | 100.00 | - | Standard attribute |
| 9 | `potential_score` | `decimal(5,2)` | NO | - | 0.00 | - | Standard attribute |
| 10 | `qualifies_portfolio_based` | `tinyint(1)` | NO | - | 0 | - | Standard attribute |
| 11 | `candidate_status` | `varchar(30)` | YES | - | NOT_CLASSIFIED | - | Standard attribute |
| 12 | `candidate_classified_at` | `datetime(6)` | YES | - | NULL | - | Standard attribute |
| 13 | `evaluated_at` | `datetime(6)` | YES | - | NULL | - | Standard attribute |
| 14 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 15 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `student_award_score_evidence`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `criterion_score_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `portfolio_record_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `scoring_rule_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 5 | `points_effect` | `decimal(10,2)` | NO | - | 0.00 | - | Standard attribute |
| 6 | `basis_snapshot` | `json` | YES | - | NULL | - | Standard attribute |
| 7 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |

### Table: `student_portfolio_evidence`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `portfolio_record_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `storage_path` | `varchar(500)` | NO | - | NULL | - | Standard attribute |
| 4 | `original_filename` | `varchar(255)` | NO | - | NULL | - | Standard attribute |
| 5 | `mime_type` | `varchar(100)` | NO | - | NULL | - | Standard attribute |
| 6 | `detected_mime_type` | `varchar(100)` | YES | - | NULL | - | Standard attribute |
| 7 | `byte_size` | `bigint` | NO | - | NULL | - | Standard attribute |
| 8 | `checksum` | `varchar(64)` | YES | - | NULL | - | Standard attribute |
| 9 | `sha256` | `varchar(64)` | YES | - | NULL | - | Standard attribute |
| 10 | `evidence_type` | `varchar(50)` | NO | - | certificate | - | Standard attribute |
| 11 | `uploaded_by` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 12 | `uploaded_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 13 | `security_status` | `varchar(30)` | NO | - | clean | - | Standard attribute |
| 14 | `malware_scanner` | `varchar(100)` | NO | - | backend_clamav_v1 | - | Standard attribute |
| 15 | `security_validated_at` | `datetime(6)` | YES | - | NULL | - | Standard attribute |
| 16 | `status` | `varchar(20)` | NO | - | active | - | Standard attribute |

### Table: `student_portfolio_records`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `student_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `category_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `subcategory_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 5 | `title` | `varchar(255)` | NO | - | NULL | - | Standard attribute |
| 6 | `organizer_or_body` | `varchar(255)` | YES | - | NULL | - | Standard attribute |
| 7 | `occurrence_date` | `date` | YES | - | NULL | - | Standard attribute |
| 8 | `start_date` | `date` | YES | - | NULL | - | Standard attribute |
| 9 | `end_date` | `date` | YES | - | NULL | - | Standard attribute |
| 10 | `description` | `text` | YES | - | NULL | - | Standard attribute |
| 11 | `structured_metadata` | `json` | YES | - | NULL | - | Standard attribute |
| 12 | `status` | `varchar(30)` | NO | MUL | draft | - | Indexed / Foreign key |
| 13 | `submitted_at` | `datetime(6)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 14 | `verified_at` | `datetime(6)` | YES | - | NULL | - | Standard attribute |
| 15 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 16 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `student_portfolio_verification_events`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `portfolio_record_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `actor_profile_id` | `char(36)` | YES | MUL | NULL | - | Indexed / Foreign key |
| 4 | `action` | `varchar(30)` | NO | - | NULL | - | Standard attribute |
| 5 | `previous_status` | `varchar(30)` | YES | - | NULL | - | Standard attribute |
| 6 | `new_status` | `varchar(30)` | NO | - | NULL | - | Standard attribute |
| 7 | `remarks` | `text` | YES | - | NULL | - | Standard attribute |
| 8 | `occurred_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |

### Table: `student_profiles`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `profile_id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `year_level` | `varchar(20)` | YES | - | NULL | - | Standard attribute |
| 3 | `enrollment_status` | `varchar(30)` | NO | - | enrolled | - | Standard attribute |
| 4 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 5 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |

### Table: `student_program_enrollments`

| Col # | Column Name | Type | Nullable | Key | Default | Extra | Initial Observation |
|---|---|---|---|---|---|---|---|
| 1 | `id` | `char(36)` | NO | PRI | NULL | - | Primary key |
| 2 | `student_profile_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 3 | `academic_program_id` | `char(36)` | NO | MUL | NULL | - | Indexed / Foreign key |
| 4 | `year_level` | `varchar(20)` | NO | - | NULL | - | Standard attribute |
| 5 | `academic_year` | `varchar(20)` | NO | - | NULL | - | Standard attribute |
| 6 | `effective_from` | `date` | NO | - | NULL | - | Standard attribute |
| 7 | `effective_until` | `date` | YES | - | NULL | - | Standard attribute |
| 8 | `is_active` | `tinyint(1)` | NO | - | 1 | - | Standard attribute |
| 9 | `created_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED | Standard attribute |
| 10 | `updated_at` | `datetime(6)` | NO | - | CURRENT_TIMESTAMP(6) | DEFAULT_GENERATED on update CURRENT_TIMESTAMP(6) | Standard attribute |
| 11 | `active_student_guard` | `char(36)` | YES | UNI | NULL | VIRTUAL GENERATED | Generated virtual/stored guard |

