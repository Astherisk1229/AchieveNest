# AchieveNest — MySQL 8.4.7 Defense Migration Package

## Overview

This directory contains the complete, deterministic MySQL 8.4.7 migration package for the **AchieveNest WAMP Defense Build** (`achievenest_local`).

The existing PostgreSQL/Supabase migration chain (`backend/app/Database/Migrations/`) is preserved untouched.

---

## Migration Manifest

The migration package consists of 10 sequential, deterministic SQL files:

| Migration File | Domain Description | Key Tables / Objects |
|---|---|---|
| `000001_identity_and_institutional.sql` | Identity foundation & institutional hierarchy | `roles`, `colleges`, `academic_programs`, `administrative_units`, `profiles`, `profile_roles`, `student_profiles`, `personnel_profiles`, `account_lifecycle_events` |
| `000002_student_personnel_affiliations.sql` | Student program enrollments & personnel institutional affiliations | `student_program_enrollments`, `personnel_college_affiliations`, `personnel_program_affiliations`, `personnel_administrative_unit_affiliations` |
| `000003_governance_and_organizations.sql` | Student organizations & governance assignments | `organizations`, `organization_program_affiliations`, `dean_assignments`, `program_coordinator_assignments`, `organization_moderator_assignments` |
| `000004_student_portfolio_verification.sql` | Student portfolio, taxonomy & verification | `portfolio_categories`, `portfolio_subcategories`, `student_portfolio_records`, `student_portfolio_evidence`, `student_portfolio_verification_events` |
| `000005_events_and_certificates.sql` | Events, attendance sessions & certificate issuance | `events`, `attendance_sessions`, `attendance_records`, `certificate_template_families`, `certificate_template_versions`, `certificate_issuance_batches`, `issued_certificates` |
| `000006_award_scoring_and_eligibility.sql` | Award scoring rules, evaluation & dean nominations | `award_definitions`, `award_criteria`, `award_scoring_rules`, `award_portfolio_mappings`, `award_cycles`, `student_award_evaluations`, `student_award_criterion_scores`, `student_award_score_evidence`, `award_evaluation_summary_reports`, `dean_student_nominations`, `award_interview_eligibilities` |
| `000007_notifications.sql` | Persistent notifications & preferences | `notifications`, `notification_preferences` |
| `000008_personnel_ranking.sql` | Personnel accomplishments & ranking evaluation | `personnel_accomplishments`, `personnel_accomplishment_evidence`, `personnel_qualification_reviews`, `personnel_evaluations`, `personnel_evaluation_items`, `personnel_evaluation_events`, `personnel_evaluation_deficiency_requests`, `personnel_evaluation_reports` |
| `000009_audit_and_file_security.sql` | System audit, file security & role events | `audit_logs`, `file_security_audit_events`, `password_reset_requests`, `role_assignment_events` |
| `000010_constraints_indexes_reference_seeds.sql` | Active-history uniqueness, performance indexes & permanent reference seeds | Stored generated column unique guards, performance indexes, 7 Roles, 5 Colleges, 14 Programs, 19 Administrative Units, 9 Categories, 57 Subcategories, 15 Potential Awards |

---

## MySQL 8.4.7 Compatibility Standards

1. **Identifiers**: `CHAR(36)` for application UUID-compatible primary and foreign keys.
2. **Timestamps**: `DATETIME(6)` in UTC with microsecond precision.
3. **Structured Data**: Native `JSON` data type.
4. **Numerics**: `DECIMAL(p, s)` for exact monetary and scoring values.
5. **Booleans**: `BOOLEAN` (MySQL `TINYINT(1)`).
6. **Active-History Uniqueness**: Implemented via `CHAR(36)` stored generated columns + unique indexes (allowing multiple `NULL` inactive rows with exactly one active row).
7. **Storage Isolation**: Evidence files are referenced by storage paths; physical files reside outside the database.
8. **No Secrets**: Plaintext passwords, tokens, and sensitive keys are strictly excluded.
9. **No Supabase Dependencies**: All Supabase-specific functions, schemas (`auth`, `storage`), and PostgreSQL RLS commands are omitted.
