# AchieveNest — Phase C: Referential Action & Cascade Risk Audit

> **Database:** `achievenest_local`  

---

## 1. Referential Delete Rules Distribution
- **`RESTRICT`:** 40 constraints
- **`SET NULL`:** 26 constraints
- **`CASCADE`:** 60 constraints

## 2. Cascade Risk Evaluation
Audit of CASCADE actions on historical, evaluation, scoring, and certificate records:

| Child Table | Child Column | Parent Table | Delete Action | Risk Level | Assessment |
|---|---|---|---|:---:|---|
| `account_lifecycle_events` | `profile_id` | `profiles` | `CASCADE` | MEDIUM (Historical event cleanup) | Parent-driven entity lifecycle |
| `attendance_records` | `attendee_profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `attendance_records` | `session_id` | `attendance_sessions` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `attendance_sessions` | `event_id` | `events` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `award_candidate_manual_decisions` | `award_definition_id` | `award_definitions` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `award_candidate_manual_decisions` | `cycle_id` | `award_cycles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `award_candidate_manual_decisions` | `student_profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `award_criteria` | `award_definition_id` | `award_definitions` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `award_criterion_components` | `criterion_id` | `award_criteria` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `award_evaluation_summary_reports` | `cycle_id` | `award_cycles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `award_evidence_mapping_conditions` | `mapping_rule_id` | `award_evidence_mapping_rules` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `award_evidence_mapping_rules` | `criterion_id` | `award_criteria` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `award_evidence_mapping_rules` | `scoring_model_version_id` | `award_scoring_model_versions` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `award_interview_eligibilities` | `cycle_id` | `award_cycles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `award_interview_eligibilities` | `student_profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `award_portfolio_mappings` | `scoring_rule_id` | `award_scoring_rules` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `award_scoring_model_versions` | `award_definition_id` | `award_definitions` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `award_scoring_rules` | `criterion_id` | `award_criteria` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `award_scoring_rules` | `parent_rule_id` | `award_scoring_rules` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `award_student_evaluation_summaries` | `award_definition_id` | `award_definitions` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `award_student_evaluation_summaries` | `cycle_id` | `award_cycles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `award_student_evaluation_summaries` | `evaluation_id` | `student_award_evaluations` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `award_student_evaluation_summaries` | `student_profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `certificate_template_versions` | `family_id` | `certificate_template_families` | `CASCADE` | CONTROLLED (Owned child lifecycle) | Parent-driven entity lifecycle |
| `dean_assignments` | `personnel_profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `dean_student_nominations` | `cycle_id` | `award_cycles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `dean_student_nominations` | `student_profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `issued_certificates` | `batch_id` | `certificate_issuance_batches` | `CASCADE` | CONTROLLED (Owned child lifecycle) | Parent-driven entity lifecycle |
| `issued_certificates` | `recipient_profile_id` | `profiles` | `CASCADE` | CONTROLLED (Owned child lifecycle) | Parent-driven entity lifecycle |
| `local_auth_credentials` | `profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `local_auth_sessions` | `profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `notification_preferences` | `profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `notifications` | `recipient_profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `organization_moderator_assignments` | `organization_id` | `organizations` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `organization_moderator_assignments` | `personnel_profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `organization_program_affiliations` | `organization_id` | `organizations` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `personnel_accomplishment_evidence` | `accomplishment_id` | `personnel_accomplishments` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `personnel_accomplishments` | `personnel_profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `personnel_administrative_unit_affiliations` | `personnel_profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `personnel_college_affiliations` | `personnel_profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `personnel_evaluation_deficiency_requests` | `evaluation_id` | `personnel_evaluations` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `personnel_evaluation_events` | `evaluation_id` | `personnel_evaluations` | `CASCADE` | MEDIUM (Historical event cleanup) | Parent-driven entity lifecycle |
| `personnel_evaluation_items` | `evaluation_id` | `personnel_evaluations` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `personnel_evaluation_reports` | `evaluation_id` | `personnel_evaluations` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `personnel_evaluations` | `personnel_profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `personnel_profiles` | `profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `personnel_program_affiliations` | `personnel_profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `personnel_qualification_reviews` | `personnel_profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `profile_roles` | `profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `program_coordinator_assignments` | `personnel_profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `role_assignment_events` | `target_profile_id` | `profiles` | `CASCADE` | MEDIUM (Historical event cleanup) | Parent-driven entity lifecycle |
| `student_award_criterion_scores` | `evaluation_id` | `student_award_evaluations` | `CASCADE` | CONTROLLED (Owned child lifecycle) | Parent-driven entity lifecycle |
| `student_award_evaluations` | `cycle_id` | `award_cycles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `student_award_evaluations` | `student_profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `student_award_score_evidence` | `criterion_score_id` | `student_award_criterion_scores` | `CASCADE` | CONTROLLED (Owned child lifecycle) | Parent-driven entity lifecycle |
| `student_portfolio_evidence` | `portfolio_record_id` | `student_portfolio_records` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `student_portfolio_records` | `student_profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `student_portfolio_verification_events` | `portfolio_record_id` | `student_portfolio_records` | `CASCADE` | MEDIUM (Historical event cleanup) | Parent-driven entity lifecycle |
| `student_profiles` | `profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
| `student_program_enrollments` | `student_profile_id` | `profiles` | `CASCADE` | LOW (Standard relational cascade) | Parent-driven entity lifecycle |
