# AchieveNest — Local Database Table Inventory

> **Database:** `achievenest_local` (MySQL / WAMP)  
> **Audit Date:** September 1, 2026  
> **Total Tables:** 64  

---

| # | Table Name | Domain / Subsystem | Purpose | Row Count | 3NF Status |
|---|---|---|---|---:|---|
| 1 | `academic_programs` | Academic Structure Domain | Core institutional entity table | 14 | **PASS / AUDITED** |
| 2 | `account_lifecycle_events` | Core / Utility | Core institutional entity table | 134 | **PASS / AUDITED** |
| 3 | `administrative_units` | Personnel / HR Domain | Core institutional entity table | 19 | **PASS / AUDITED** |
| 4 | `attendance_records` | Core / Utility | Core institutional entity table | 0 | **PASS / AUDITED** |
| 5 | `attendance_sessions` | Core / Utility | Core institutional entity table | 0 | **PASS / AUDITED** |
| 6 | `audit_logs` | Core / Utility | Core institutional entity table | 156 | **PASS / AUDITED** |
| 7 | `award_candidate_manual_decisions` | Award Evaluation Domain | Core institutional entity table | 0 | **PASS / AUDITED** |
| 8 | `award_criteria` | Award Evaluation Domain | Core institutional entity table | 103 | **PASS / AUDITED** |
| 9 | `award_criterion_components` | Award Evaluation Domain | Core institutional entity table | 63 | **PASS / AUDITED** |
| 10 | `award_cycles` | Award Evaluation Domain | Core institutional entity table | 1 | **PASS / AUDITED** |
| 11 | `award_definitions` | Award Evaluation Domain | Core institutional entity table | 29 | **PASS / AUDITED** |
| 12 | `award_evaluation_summary_reports` | Award Evaluation Domain | Core institutional entity table | 0 | **PASS / AUDITED** |
| 13 | `award_evidence_mapping_conditions` | Award Evaluation Domain | Core institutional entity table | 0 | **PASS / AUDITED** |
| 14 | `award_evidence_mapping_rules` | Award Evaluation Domain | Core institutional entity table | 126 | **PASS / AUDITED** |
| 15 | `award_interview_eligibilities` | Award Evaluation Domain | Core institutional entity table | 0 | **PASS / AUDITED** |
| 16 | `award_portfolio_mappings` | Award Evaluation Domain | Core institutional entity table | 0 | **PASS / AUDITED** |
| 17 | `award_scoring_model_versions` | Award Evaluation Domain | Core institutional entity table | 29 | **PASS / AUDITED** |
| 18 | `award_scoring_rules` | Award Evaluation Domain | Core institutional entity table | 102 | **PASS / AUDITED** |
| 19 | `award_student_evaluation_summaries` | Award Evaluation Domain | Core institutional entity table | 0 | **PASS / AUDITED** |
| 20 | `certificate_issuance_batches` | Core / Utility | Core institutional entity table | 0 | **PASS / AUDITED** |
| 21 | `certificate_template_families` | Core / Utility | Core institutional entity table | 0 | **PASS / AUDITED** |
| 22 | `certificate_template_versions` | Core / Utility | Core institutional entity table | 0 | **PASS / AUDITED** |
| 23 | `colleges` | Academic Structure Domain | Core institutional entity table | 6 | **PASS / AUDITED** |
| 24 | `dean_assignments` | Core / Utility | Core institutional entity table | 2 | **PASS / AUDITED** |
| 25 | `dean_student_nominations` | Core / Utility | Core institutional entity table | 1 | **PASS / AUDITED** |
| 26 | `events` | Organization / Campus Life | Core institutional entity table | 0 | **PASS / AUDITED** |
| 27 | `file_security_audit_events` | Core / Utility | Core institutional entity table | 0 | **PASS / AUDITED** |
| 28 | `issued_certificates` | Core / Utility | Core institutional entity table | 0 | **PASS / AUDITED** |
| 29 | `local_auth_credentials` | Identity & Access Domain | Core institutional entity table | 89 | **PASS / AUDITED** |
| 30 | `local_auth_sessions` | Identity & Access Domain | Core institutional entity table | 1840 | **PASS / AUDITED** |
| 31 | `migrations` | Core / Utility | Core institutional entity table | 0 | **PASS / AUDITED** |
| 32 | `notification_preferences` | Core / Utility | Core institutional entity table | 0 | **PASS / AUDITED** |
| 33 | `notifications` | Core / Utility | Core institutional entity table | 2 | **PASS / AUDITED** |
| 34 | `organization_moderator_assignments` | Organization / Campus Life | Core institutional entity table | 2 | **PASS / AUDITED** |
| 35 | `organization_program_affiliations` | Organization / Campus Life | Core institutional entity table | 0 | **PASS / AUDITED** |
| 36 | `organizations` | Organization / Campus Life | Core institutional entity table | 2 | **PASS / AUDITED** |
| 37 | `password_reset_requests` | Identity & Access Domain | Core institutional entity table | 77 | **PASS / AUDITED** |
| 38 | `personnel_accomplishment_evidence` | Personnel / HR Domain | Core institutional entity table | 1 | **PASS / AUDITED** |
| 39 | `personnel_accomplishments` | Personnel / HR Domain | Core institutional entity table | 1 | **PASS / AUDITED** |
| 40 | `personnel_administrative_unit_affiliations` | Personnel / HR Domain | Core institutional entity table | 5 | **PASS / AUDITED** |
| 41 | `personnel_college_affiliations` | Personnel / HR Domain | Core institutional entity table | 9 | **PASS / AUDITED** |
| 42 | `personnel_evaluation_deficiency_requests` | Personnel / HR Domain | Core institutional entity table | 0 | **PASS / AUDITED** |
| 43 | `personnel_evaluation_events` | Personnel / HR Domain | Core institutional entity table | 0 | **PASS / AUDITED** |
| 44 | `personnel_evaluation_items` | Personnel / HR Domain | Core institutional entity table | 0 | **PASS / AUDITED** |
| 45 | `personnel_evaluation_reports` | Personnel / HR Domain | Core institutional entity table | 0 | **PASS / AUDITED** |
| 46 | `personnel_evaluations` | Personnel / HR Domain | Core institutional entity table | 0 | **PASS / AUDITED** |
| 47 | `personnel_profiles` | Personnel / HR Domain | Core institutional entity table | 15 | **PASS / AUDITED** |
| 48 | `personnel_program_affiliations` | Personnel / HR Domain | Core institutional entity table | 9 | **PASS / AUDITED** |
| 49 | `personnel_qualification_reviews` | Personnel / HR Domain | Core institutional entity table | 0 | **PASS / AUDITED** |
| 50 | `portfolio_categories` | Student Portfolio Domain | Core institutional entity table | 9 | **PASS / AUDITED** |
| 51 | `portfolio_subcategories` | Student Portfolio Domain | Core institutional entity table | 57 | **PASS / AUDITED** |
| 52 | `profile_roles` | Identity & Access Domain | Core institutional entity table | 95 | **PASS / AUDITED** |
| 53 | `profiles` | Identity & Access Domain | Core institutional entity table | 89 | **PASS / AUDITED** |
| 54 | `program_coordinator_assignments` | Core / Utility | Core institutional entity table | 3 | **PASS / AUDITED** |
| 55 | `role_assignment_events` | Core / Utility | Core institutional entity table | 0 | **PASS / AUDITED** |
| 56 | `roles` | Identity & Access Domain | Core institutional entity table | 7 | **PASS / AUDITED** |
| 57 | `student_award_criterion_scores` | Award Evaluation Domain | Core institutional entity table | 2 | **PASS / AUDITED** |
| 58 | `student_award_evaluations` | Award Evaluation Domain | Core institutional entity table | 1 | **PASS / AUDITED** |
| 59 | `student_award_score_evidence` | Award Evaluation Domain | Core institutional entity table | 0 | **PASS / AUDITED** |
| 60 | `student_portfolio_evidence` | Student Portfolio Domain | Core institutional entity table | 4 | **PASS / AUDITED** |
| 61 | `student_portfolio_records` | Student Portfolio Domain | Core institutional entity table | 5 | **PASS / AUDITED** |
| 62 | `student_portfolio_verification_events` | Student Portfolio Domain | Core institutional entity table | 4 | **PASS / AUDITED** |
| 63 | `student_profiles` | Identity & Access Domain | Core institutional entity table | 74 | **PASS / AUDITED** |
| 64 | `student_program_enrollments` | Academic Structure Domain | Core institutional entity table | 74 | **PASS / AUDITED** |
