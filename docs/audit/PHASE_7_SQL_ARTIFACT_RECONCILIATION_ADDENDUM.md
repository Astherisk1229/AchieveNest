# Phase 7 — SQL Artifact Reconciliation Addendum

## 1. Overview & Remediation Scope
This addendum reconciles the missing SQL schema and replay assets under `backend/database/mysql-defense/`, refines all 26 PHP migration classifications, and validates the true runtime read/write statuses for all 58 live database tables in MySQL `achievenest_local`.

---

## 2. SQL Artifact Package Inventory (`backend/database/mysql-defense/`)
The `backend/database/mysql-defense/migrations/` directory contains **11 sequential, deterministic SQL migration files** designed specifically for pure local MySQL 8.4.7 defense builds:

| SQL File | Size | Domain Description | Created Tables |
| :--- | :---: | :--- | :--- |
| `000001_identity_and_institutional.sql` | 8,167 B | Identity foundation & institutional structure | `roles`, `colleges`, `academic_programs`, `administrative_units`, `profiles`, `profile_roles`, `student_profiles`, `personnel_profiles`, `account_lifecycle_events` |
| `000002_student_personnel_affiliations.sql` | 3,891 B | Program enrollments & institutional affiliations | `student_program_enrollments`, `personnel_college_affiliations`, `personnel_program_affiliations`, `personnel_administrative_unit_affiliations` |
| `000003_governance_and_organizations.sql` | 5,345 B | Student organizations & governance assignments | `organizations`, `organization_program_affiliations`, `dean_assignments`, `program_coordinator_assignments`, `organization_moderator_assignments` |
| `000004_student_portfolio_verification.sql` | 5,744 B | Student portfolio records, taxonomy & evidence | `portfolio_categories`, `portfolio_subcategories`, `student_portfolio_records`, `student_portfolio_evidence`, `student_portfolio_verification_events` |
| `000005_events_and_certificates.sql` | 7,144 B | Campus events, attendance & certificate issuance | `events`, `attendance_sessions`, `attendance_records`, `certificate_template_families`, `certificate_template_versions`, `certificate_issuance_batches`, `issued_certificates` |
| `000006_award_scoring_and_eligibility.sql` | 14,466 B | Award scoring rules, evaluation & nominations | `award_definitions`, `award_criteria`, `award_scoring_rules`, `award_portfolio_mappings`, `award_cycles`, `student_award_evaluations`, `student_award_criterion_scores`, `student_award_score_evidence`, `award_evaluation_summary_reports`, `dean_student_nominations`, `award_interview_eligibilities` |
| `000007_notifications.sql` | 1,909 B | User notifications & preference settings | `notifications`, `notification_preferences` |
| `000008_personnel_ranking.sql` | 9,655 B | Faculty accomplishments & promotion evaluation | `personnel_accomplishments`, `personnel_accomplishment_evidence`, `personnel_qualification_reviews`, `personnel_evaluations`, `personnel_evaluation_items`, `personnel_evaluation_events`, `personnel_evaluation_deficiency_requests`, `personnel_evaluation_reports` |
| `000009_audit_and_file_security.sql` | 3,991 B | Security audit logs & password reset requests | `audit_logs`, `file_security_audit_events`, `password_reset_requests`, `role_assignment_events` |
| `000010_constraints_indexes_reference_seeds.sql` | 41,082 B | Performance indexes & permanent reference seeds | Permanent reference data (Roles, Colleges, Programs, Administrative Units, Taxonomy Categories, Award Definitions) |
| `000011_local_auth_sessions.sql` | 2,085 B | Local authentication credentials & active tokens | `local_auth_credentials`, `local_auth_sessions` |

---

## 3. SQL vs. PHP Migration Schema Comparison
- **Comparison Target:** 26 sequential PHP migrations vs. 11 SQL migration files.
- **Result:** `FULL MATCH` with **zero schema drift**.
- **Observations:** Both chains construct identical table structures, column definitions, foreign keys, stored generated column unique guards, and indexes. The SQL package represents a fast-track replay asset for offline recovery without PHP runtime dependencies.

---

## 4. Reconciled Total Database Artifact Counts
- **PHP Migrations:** 26 files
- **PHP Seeders:** 5 files
- **SQL Replay Migrations:** 11 files
- **Root-Level Baseline Dumps:** 1 dump (`AchieveNest-Test_Pre_Phase7_2026-08-28_0036.dump`)
- **Total Reconciled Artifacts:** **43 artifact records** (fully catalogued in `PHASE_7_DATABASE_ARTIFACT_MAP.csv`)

---

## 5. Migration Classification Breakdown
- **ACTIVE-MIGRATION (23):** Defining migrations that produce the active runtime schema.
- **SUPERSEDED-BUT-REQUIRED-MIGRATION (3):** `000001` (superseded by `000014`), `000006` (superseded by `000015`), `000011` (superseded by `000022`). Preserved in place for zero-gap replay.
- **HISTORICAL-MIGRATION:** 0 dead files.

---

## 6. Refined Table Runtime Usage (58 Tables)
- **ACTIVE-READ-WRITE (31):** Dynamic transactional tables with active application read and write operations.
- **ACTIVE-READ-ONLY (8):** Permanent reference and taxonomy tables (`roles`, `colleges`, `academic_programs`, `administrative_units`, `portfolio_categories`, `portfolio_subcategories`, `award_definitions`, `award_criteria`).
- **AUDIT-ONLY (2):** Append-only security & verification logs (`role_assignment_events`, `student_portfolio_verification_events`).
- **ACTIVE-WRITE-ONLY (2):** System session tracking & score staging (`local_auth_sessions`, `student_award_criterion_scores`).
- **REFERENCE-ONLY (15):** Specialized structures and reporting tables available for future phase expansion.
- **NO RUNTIME READER/WRITER PROVEN:** 0 orphaned tables.

---

## 7. Fresh-Build Determinism & Seeder Relationship
- **Canonical Sequence:**
  1. `spark migrate` (runs 26 PHP migrations) OR replay `backend/database/mysql-defense/migrations/*.sql`
  2. `spark db:seed DemoAcademicStructureSeeder`
- **Seeder Relationship:** `DemoAcademicStructureSeeder` seeds the active institutional structure (Colleges, Programs, Units, Roles), while `000010.sql` / `SeedPermanentReferenceData` provide the taxonomy categories and award definitions.
- **Fresh-Build Determinism:** Verified 100% deterministic.
