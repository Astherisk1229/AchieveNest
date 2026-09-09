# AchieveNest — Phase C: Unique Constraint Audit

> **Database:** `achievenest_local`  

---

## 1. Unique Constraints Inventory

| Table Name | Constraint Name | Column(s) Enforced | Candidate Key Role | Status |
|---|---|---|---|:---:|
| `academic_programs` | `code` | `code` | Domain code uniqueness | **PASS** |
| `administrative_units` | `code` | `code` | Domain code uniqueness | **PASS** |
| `administrative_units` | `name` | `name` | Natural / Business uniqueness | **PASS** |
| `attendance_records` | `uq_session_attendee` | `session_id`, `attendee_profile_id` | Natural / Business uniqueness | **PASS** |
| `award_criteria` | `uq_award_criterion_code` | `award_definition_id`, `code` | Domain code uniqueness | **PASS** |
| `award_cycles` | `code` | `code` | Domain code uniqueness | **PASS** |
| `award_definitions` | `code` | `code` | Domain code uniqueness | **PASS** |
| `award_definitions` | `name` | `name` | Natural / Business uniqueness | **PASS** |
| `award_interview_eligibilities` | `uq_cycle_award_student_source` | `cycle_id`, `award_definition_id`, `student_profile_id`, `eligibility_source` | Natural / Business uniqueness | **PASS** |
| `award_scoring_rules` | `uq_criterion_rule_code` | `criterion_id`, `code` | Domain code uniqueness | **PASS** |
| `award_student_evaluation_summaries` | `uq_ases_eval` | `evaluation_id` | Natural / Business uniqueness | **PASS** |
| `certificate_template_families` | `code` | `code` | Domain code uniqueness | **PASS** |
| `certificate_template_versions` | `uq_family_version` | `family_id`, `version_number` | Natural / Business uniqueness | **PASS** |
| `colleges` | `code` | `code` | Domain code uniqueness | **PASS** |
| `dean_assignments` | `uq_active_college_dean` | `active_college_dean_guard` | Natural / Business uniqueness | **PASS** |
| `dean_assignments` | `uq_active_personnel_dean` | `active_personnel_dean_guard` | Natural / Business uniqueness | **PASS** |
| `issued_certificates` | `certificate_code` | `certificate_code` | Domain code uniqueness | **PASS** |
| `local_auth_sessions` | `token_hash` | `token_hash` | Natural / Business uniqueness | **PASS** |
| `notification_preferences` | `uq_profile_notif_category` | `profile_id`, `category` | Natural / Business uniqueness | **PASS** |
| `organization_moderator_assignments` | `uq_active_org_moderator` | `active_org_moderator_guard` | Natural / Business uniqueness | **PASS** |
| `organization_program_affiliations` | `uq_org_program` | `organization_id`, `academic_program_id` | Natural / Business uniqueness | **PASS** |
| `organizations` | `code` | `code` | Domain code uniqueness | **PASS** |
| `personnel_administrative_unit_affiliations` | `uq_active_personnel_admin_unit` | `active_personnel_unit_guard` | Natural / Business uniqueness | **PASS** |
| `personnel_college_affiliations` | `uq_active_personnel_college` | `active_personnel_guard` | Natural / Business uniqueness | **PASS** |
| `portfolio_categories` | `code` | `code` | Domain code uniqueness | **PASS** |
| `portfolio_subcategories` | `uq_cat_subcat_code` | `category_id`, `code` | Domain code uniqueness | **PASS** |
| `profiles` | `email` | `email` | Institutional email candidate key | **PASS** |
| `profiles` | `institutional_id` | `institutional_id` | Institutional ID candidate key | **PASS** |
| `profiles` | `uq_profiles_one_active_hr_admin` | `active_hr_guard` | Natural / Business uniqueness | **PASS** |
| `program_coordinator_assignments` | `uq_active_program_coordinator` | `active_program_coord_guard` | Natural / Business uniqueness | **PASS** |
| `roles` | `role_key` | `role_key` | Natural / Business uniqueness | **PASS** |
| `student_award_criterion_scores` | `uq_eval_criterion` | `evaluation_id`, `criterion_id` | Natural / Business uniqueness | **PASS** |
| `student_award_score_evidence` | `uq_critscore_portrec` | `criterion_score_id`, `portfolio_record_id` | Natural / Business uniqueness | **PASS** |
| `student_program_enrollments` | `uq_active_student_enrollment` | `active_student_guard` | Natural / Business uniqueness | **PASS** |
