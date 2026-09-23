# AchieveNest — Phase 1: Table Inventory

> **Database:** `achievenest_local`  
> **Total Tables:** 64  

---

| # | Table Name | Domain / Module | Purpose | Row Count | Reviewed | 3NF Status |
|---|---|---|---|---:|---|---|
| 1 | `academic_programs` | ACADEMIC_STRUCTURE | Colleges, programs, and student program enrollment history | 14 | YES | NOT YET ASSESSED |
| 2 | `account_lifecycle_events` | AUDIT_SECURITY | Audit logging, security events, and account lifecycle tracking | 134 | YES | NOT YET ASSESSED |
| 3 | `administrative_units` | PERSONNEL | Faculty / staff profiles, affiliations, qualifications, and HR evaluations | 19 | YES | NOT YET ASSESSED |
| 4 | `attendance_records` | EVENT_ATTENDANCE | Campus events and attendance tracking | 0 | YES | NOT YET ASSESSED |
| 5 | `attendance_sessions` | EVENT_ATTENDANCE | Campus events and attendance tracking | 0 | YES | NOT YET ASSESSED |
| 6 | `audit_logs` | AUDIT_SECURITY | Audit logging, security events, and account lifecycle tracking | 156 | YES | NOT YET ASSESSED |
| 7 | `award_candidate_manual_decisions` | AWARD | Authoritative award evaluation, criteria, scoring, and reviews | 0 | YES | NOT YET ASSESSED |
| 8 | `award_criteria` | AWARD | Authoritative award evaluation, criteria, scoring, and reviews | 103 | YES | NOT YET ASSESSED |
| 9 | `award_criterion_components` | AWARD | Authoritative award evaluation, criteria, scoring, and reviews | 63 | YES | NOT YET ASSESSED |
| 10 | `award_cycles` | AWARD | Authoritative award evaluation, criteria, scoring, and reviews | 1 | YES | NOT YET ASSESSED |
| 11 | `award_definitions` | AWARD | Authoritative award evaluation, criteria, scoring, and reviews | 29 | YES | NOT YET ASSESSED |
| 12 | `award_evaluation_summary_reports` | AWARD | Authoritative award evaluation, criteria, scoring, and reviews | 0 | YES | NOT YET ASSESSED |
| 13 | `award_evidence_mapping_conditions` | AWARD | Authoritative award evaluation, criteria, scoring, and reviews | 0 | YES | NOT YET ASSESSED |
| 14 | `award_evidence_mapping_rules` | AWARD | Authoritative award evaluation, criteria, scoring, and reviews | 126 | YES | NOT YET ASSESSED |
| 15 | `award_interview_eligibilities` | AWARD | Authoritative award evaluation, criteria, scoring, and reviews | 0 | YES | NOT YET ASSESSED |
| 16 | `award_portfolio_mappings` | AWARD | Authoritative award evaluation, criteria, scoring, and reviews | 0 | YES | NOT YET ASSESSED |
| 17 | `award_scoring_model_versions` | AWARD | Authoritative award evaluation, criteria, scoring, and reviews | 29 | YES | NOT YET ASSESSED |
| 18 | `award_scoring_rules` | AWARD | Authoritative award evaluation, criteria, scoring, and reviews | 102 | YES | NOT YET ASSESSED |
| 19 | `award_student_evaluation_summaries` | AWARD | Authoritative award evaluation, criteria, scoring, and reviews | 0 | YES | NOT YET ASSESSED |
| 20 | `certificate_issuance_batches` | CERTIFICATE | Certificate templates, issuance batches, and recipient records | 0 | YES | NOT YET ASSESSED |
| 21 | `certificate_template_families` | CERTIFICATE | Certificate templates, issuance batches, and recipient records | 0 | YES | NOT YET ASSESSED |
| 22 | `certificate_template_versions` | CERTIFICATE | Certificate templates, issuance batches, and recipient records | 0 | YES | NOT YET ASSESSED |
| 23 | `colleges` | ACADEMIC_STRUCTURE | Colleges, programs, and student program enrollment history | 6 | YES | NOT YET ASSESSED |
| 24 | `dean_assignments` | ROLE_ACCESS | Role catalog, profile assignments, and governance scope | 2 | YES | NOT YET ASSESSED |
| 25 | `dean_student_nominations` | AWARD | Authoritative award evaluation, criteria, scoring, and reviews | 1 | YES | NOT YET ASSESSED |
| 26 | `events` | EVENT_ATTENDANCE | Campus events and attendance tracking | 0 | YES | NOT YET ASSESSED |
| 27 | `file_security_audit_events` | AUDIT_SECURITY | Audit logging, security events, and account lifecycle tracking | 0 | YES | NOT YET ASSESSED |
| 28 | `issued_certificates` | CERTIFICATE | Certificate templates, issuance batches, and recipient records | 0 | YES | NOT YET ASSESSED |
| 29 | `local_auth_credentials` | IDENTITY | Supertype user profiles, credentials, sessions, and password resets | 89 | YES | NOT YET ASSESSED |
| 30 | `local_auth_sessions` | IDENTITY | Supertype user profiles, credentials, sessions, and password resets | 1840 | YES | NOT YET ASSESSED |
| 31 | `migrations` | MIGRATION | Database migration execution history | 0 | YES | NOT YET ASSESSED |
| 32 | `notification_preferences` | NOTIFICATION | In-app notifications and recipient preferences | 0 | YES | NOT YET ASSESSED |
| 33 | `notifications` | NOTIFICATION | In-app notifications and recipient preferences | 2 | YES | NOT YET ASSESSED |
| 34 | `organization_moderator_assignments` | ORGANIZATION | Student organizations, affiliations, and moderator assignments | 2 | YES | NOT YET ASSESSED |
| 35 | `organization_program_affiliations` | ORGANIZATION | Student organizations, affiliations, and moderator assignments | 0 | YES | NOT YET ASSESSED |
| 36 | `organizations` | ORGANIZATION | Student organizations, affiliations, and moderator assignments | 2 | YES | NOT YET ASSESSED |
| 37 | `password_reset_requests` | IDENTITY | Supertype user profiles, credentials, sessions, and password resets | 77 | YES | NOT YET ASSESSED |
| 38 | `personnel_accomplishment_evidence` | PERSONNEL | Faculty / staff profiles, affiliations, qualifications, and HR evaluations | 1 | YES | NOT YET ASSESSED |
| 39 | `personnel_accomplishments` | PERSONNEL | Faculty / staff profiles, affiliations, qualifications, and HR evaluations | 1 | YES | NOT YET ASSESSED |
| 40 | `personnel_administrative_unit_affiliations` | PERSONNEL | Faculty / staff profiles, affiliations, qualifications, and HR evaluations | 5 | YES | NOT YET ASSESSED |
| 41 | `personnel_college_affiliations` | PERSONNEL | Faculty / staff profiles, affiliations, qualifications, and HR evaluations | 9 | YES | NOT YET ASSESSED |
| 42 | `personnel_evaluation_deficiency_requests` | PERSONNEL | Faculty / staff profiles, affiliations, qualifications, and HR evaluations | 0 | YES | NOT YET ASSESSED |
| 43 | `personnel_evaluation_events` | PERSONNEL | Faculty / staff profiles, affiliations, qualifications, and HR evaluations | 0 | YES | NOT YET ASSESSED |
| 44 | `personnel_evaluation_items` | PERSONNEL | Faculty / staff profiles, affiliations, qualifications, and HR evaluations | 0 | YES | NOT YET ASSESSED |
| 45 | `personnel_evaluation_reports` | PERSONNEL | Faculty / staff profiles, affiliations, qualifications, and HR evaluations | 0 | YES | NOT YET ASSESSED |
| 46 | `personnel_evaluations` | PERSONNEL | Faculty / staff profiles, affiliations, qualifications, and HR evaluations | 0 | YES | NOT YET ASSESSED |
| 47 | `personnel_profiles` | PERSONNEL | Faculty / staff profiles, affiliations, qualifications, and HR evaluations | 15 | YES | NOT YET ASSESSED |
| 48 | `personnel_program_affiliations` | PERSONNEL | Faculty / staff profiles, affiliations, qualifications, and HR evaluations | 9 | YES | NOT YET ASSESSED |
| 49 | `personnel_qualification_reviews` | PERSONNEL | Faculty / staff profiles, affiliations, qualifications, and HR evaluations | 0 | YES | NOT YET ASSESSED |
| 50 | `portfolio_categories` | PORTFOLIO | Student master portfolio records, categories, evidence, and verification | 9 | YES | NOT YET ASSESSED |
| 51 | `portfolio_subcategories` | PORTFOLIO | Student master portfolio records, categories, evidence, and verification | 57 | YES | NOT YET ASSESSED |
| 52 | `profile_roles` | ROLE_ACCESS | Role catalog, profile assignments, and governance scope | 95 | YES | NOT YET ASSESSED |
| 53 | `profiles` | IDENTITY | Supertype user profiles, credentials, sessions, and password resets | 89 | YES | NOT YET ASSESSED |
| 54 | `program_coordinator_assignments` | ROLE_ACCESS | Role catalog, profile assignments, and governance scope | 3 | YES | NOT YET ASSESSED |
| 55 | `role_assignment_events` | ROLE_ACCESS | Role catalog, profile assignments, and governance scope | 0 | YES | NOT YET ASSESSED |
| 56 | `roles` | ROLE_ACCESS | Role catalog, profile assignments, and governance scope | 7 | YES | NOT YET ASSESSED |
| 57 | `student_award_criterion_scores` | AWARD | Authoritative award evaluation, criteria, scoring, and reviews | 2 | YES | NOT YET ASSESSED |
| 58 | `student_award_evaluations` | AWARD | Authoritative award evaluation, criteria, scoring, and reviews | 1 | YES | NOT YET ASSESSED |
| 59 | `student_award_score_evidence` | AWARD | Authoritative award evaluation, criteria, scoring, and reviews | 0 | YES | NOT YET ASSESSED |
| 60 | `student_portfolio_evidence` | PORTFOLIO | Student master portfolio records, categories, evidence, and verification | 4 | YES | NOT YET ASSESSED |
| 61 | `student_portfolio_records` | PORTFOLIO | Student master portfolio records, categories, evidence, and verification | 5 | YES | NOT YET ASSESSED |
| 62 | `student_portfolio_verification_events` | PORTFOLIO | Student master portfolio records, categories, evidence, and verification | 4 | YES | NOT YET ASSESSED |
| 63 | `student_profiles` | IDENTITY | Supertype user profiles, credentials, sessions, and password resets | 74 | YES | NOT YET ASSESSED |
| 64 | `student_program_enrollments` | ACADEMIC_STRUCTURE | Colleges, programs, and student program enrollment history | 74 | YES | NOT YET ASSESSED |
