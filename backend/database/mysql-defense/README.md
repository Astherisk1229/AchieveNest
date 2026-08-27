# AchieveNest WAMP/MySQL Defense Migration Package

## Status

**PHASE 5 — IN PROGRESS / REVIEW ONLY / NOT YET EXECUTED**

This directory contains the deterministic MySQL 8.4.7 migration package for the `defense/wamp-local` branch.

The existing CodeIgniter PostgreSQL/Supabase migration chain under `backend/app/Database/Migrations/` is intentionally preserved and MUST NOT be modified, deleted, or executed against MySQL.

## Verified target environment

- Wampserver: 3.4.0 (64-bit)
- Database engine: MySQL 8.4.7
- Database: `achievenest_local`
- Character set: `utf8mb4`
- Collation: `utf8mb4_0900_ai_ci`
- Application account: `achievenest_app@localhost`
- Port: `3306`

## Authority order

1. AchieveNest Final Target Data Schema v1.0
2. AchieveNest Finalized Structure and Relationship Model
3. Four-Deliverable Consistency Audit / Current-to-Target Migration Matrix
4. `defense/wamp-local` repository implementation evidence

Repository legacy structures do not override finalized target business rules.

## Safety rules

1. Do not run the PostgreSQL migration chain against MySQL.
2. Do not execute files in this package until Phase 5 authoring and review are complete.
3. Do not create a `departments` final table.
4. Do not copy Supabase `auth.users`, `storage.buckets`, `storage.objects`, RLS policies, database roles, `auth.uid()`, or SECURITY DEFINER helpers.
5. Do not store plaintext passwords, reset secrets, access tokens, service keys, or credential hashes in audit data.
6. Do not place physical evidence files in the database or public web root.
7. Do not invent reference rows, category descriptions, award definitions, or stakeholder rules.
8. All identifiers use application-generated UUID strings stored as `CHAR(36)` unless a later approved migration explicitly documents otherwise.
9. All application timestamps are stored in UTC using `DATETIME(6)`.
10. MySQL implementation syntax may change, but finalized business meaning may not.

## Migration order

| File | Domain | Status |
|---|---|---|
| `migrations/000001_identity_and_institutional.sql` | identity, local credentials, lifecycle, roles, colleges, academic programs, administrative units | AUTHORED — REVIEW ONLY |
| `migrations/000002_student_personnel_affiliations.sql` | Student/Personnel subtypes, enrollment, College/Program/Admin Unit affiliations | PENDING |
| `migrations/000003_governance_and_organizations.sql` | Dean, Program Coordinator, organizations, Moderator assignments | PENDING |
| `migrations/000004_student_portfolio_verification.sql` | 9/57 taxonomy structure, portfolio records, evidence metadata, verification history | PENDING |
| `migrations/000005_events_and_certificates.sql` | events, attendance, certificate templates/issuance | PENDING |
| `migrations/000006_award_scoring_and_eligibility.sql` | 15 Potential Awards structure, rules, evaluations, nominations, eligibility | PENDING |
| `migrations/000007_notifications.sql` | notifications and optional preferences | PENDING |
| `migrations/000008_personnel_ranking.sql` | Personnel accomplishments, qualification and Administrator Ranking | PENDING |
| `migrations/000009_audit_and_file_security.sql` | append-only audit and evidence security history | PENDING |
| `migrations/000010_constraints_indexes_reference_seeds.sql` | cross-domain guards, indexes and authoritative permanent seed data | PENDING |

## Execution model

These SQL files are deliberately stored outside `backend/app/Database/Migrations/` during Phase 5 so CodeIgniter cannot accidentally mix them with the preserved PostgreSQL migration history.

Phase 6 will choose and document the controlled execution mechanism after the full package passes review. Until then, this directory is an auditable migration specification/package only.

## Frozen MySQL representation rules

- PostgreSQL `uuid` -> `CHAR(36)` with application-generated UUID values.
- PostgreSQL `jsonb` -> MySQL `JSON`.
- PostgreSQL `timestamptz` -> UTC `DATETIME(6)`.
- PostgreSQL `numeric(p,s)` -> `DECIMAL(p,s)`.
- PostgreSQL `inet` -> `VARCHAR(45)`.
- Boolean values -> `BOOLEAN` / MySQL `TINYINT(1)` semantics.
- Business status/type values -> `VARCHAR` + `CHECK`, not MySQL `ENUM`.
- PostgreSQL partial active-only uniqueness -> deterministic generated nullable guard columns + `UNIQUE` indexes where possible.
- RLS -> CodeIgniter application authorization, not SQL-table emulation.
- Supabase Storage -> protected local filesystem + relational metadata.

## Phase 5 completion gate

Phase 5 may be marked PASSED only when:

- every frozen business domain has a reviewed MySQL migration file;
- no PostgreSQL-only syntax remains in the MySQL package;
- all required PK/FK/unique/check/index semantics are represented;
- active-history uniqueness is preserved without destructive overwrites;
- the authoritative 9 categories, 57 subcategories and 15 Potential Awards are seeded only from approved source wording;
- no Supabase internal schema has been copied;
- the package passes a clean static review before any execution against `achievenest_local`.
