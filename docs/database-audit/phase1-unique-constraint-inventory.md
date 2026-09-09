# AchieveNest — Phase 1: Unique Constraint Inventory

> **Database:** `achievenest_local`  

---

| Table Name | Constraint Name | Column(s) | Purpose |
|---|---|---|---|
| `academic_programs` | `code` | `code` | Enforces candidate uniqueness |
| `administrative_units` | `code` | `code` | Enforces candidate uniqueness |
| `administrative_units` | `name` | `name` | Enforces candidate uniqueness |
| `attendance_records` | `uq_session_attendee` | `session_id`, `attendee_profile_id` | Enforces candidate uniqueness |
| `award_criteria` | `uq_award_criterion_code` | `award_definition_id`, `code` | Enforces candidate uniqueness |
| `award_cycles` | `code` | `code` | Enforces candidate uniqueness |
| `award_definitions` | `code` | `code` | Enforces candidate uniqueness |
| `award_definitions` | `name` | `name` | Enforces candidate uniqueness |
| `award_interview_eligibilities` | `uq_cycle_award_student_source` | `cycle_id`, `award_definition_id`, `student_profile_id`, `eligibility_source` | Enforces candidate uniqueness |
| `award_scoring_rules` | `uq_criterion_rule_code` | `criterion_id`, `code` | Enforces candidate uniqueness |
| `award_student_evaluation_summaries` | `uq_ases_eval` | `evaluation_id` | Enforces candidate uniqueness |
| `certificate_template_families` | `code` | `code` | Enforces candidate uniqueness |
| `certificate_template_versions` | `uq_family_version` | `family_id`, `version_number` | Enforces candidate uniqueness |
| `colleges` | `code` | `code` | Enforces candidate uniqueness |
| `dean_assignments` | `uq_active_college_dean` | `active_college_dean_guard` | Enforces candidate uniqueness |
| `dean_assignments` | `uq_active_personnel_dean` | `active_personnel_dean_guard` | Enforces candidate uniqueness |
| `issued_certificates` | `certificate_code` | `certificate_code` | Enforces candidate uniqueness |
| `local_auth_sessions` | `token_hash` | `token_hash` | Enforces candidate uniqueness |
| `notification_preferences` | `uq_profile_notif_category` | `profile_id`, `category` | Enforces candidate uniqueness |
| `organization_moderator_assignments` | `uq_active_org_moderator` | `active_org_moderator_guard` | Enforces candidate uniqueness |
| `organization_program_affiliations` | `uq_org_program` | `organization_id`, `academic_program_id` | Enforces candidate uniqueness |
| `organizations` | `code` | `code` | Enforces candidate uniqueness |
| `personnel_administrative_unit_affiliations` | `uq_active_personnel_admin_unit` | `active_personnel_unit_guard` | Enforces candidate uniqueness |
| `personnel_college_affiliations` | `uq_active_personnel_college` | `active_personnel_guard` | Enforces candidate uniqueness |
| `portfolio_categories` | `code` | `code` | Enforces candidate uniqueness |
| `portfolio_subcategories` | `uq_cat_subcat_code` | `category_id`, `code` | Enforces candidate uniqueness |
| `profiles` | `email` | `email` | Enforces candidate uniqueness |
| `profiles` | `institutional_id` | `institutional_id` | Enforces candidate uniqueness |
| `profiles` | `uq_profiles_one_active_hr_admin` | `active_hr_guard` | Enforces candidate uniqueness |
| `program_coordinator_assignments` | `uq_active_program_coordinator` | `active_program_coord_guard` | Enforces candidate uniqueness |
| `roles` | `role_key` | `role_key` | Enforces candidate uniqueness |
| `student_award_criterion_scores` | `uq_eval_criterion` | `evaluation_id`, `criterion_id` | Enforces candidate uniqueness |
| `student_award_score_evidence` | `uq_critscore_portrec` | `criterion_score_id`, `portfolio_record_id` | Enforces candidate uniqueness |
| `student_program_enrollments` | `uq_active_student_enrollment` | `active_student_guard` | Enforces candidate uniqueness |
