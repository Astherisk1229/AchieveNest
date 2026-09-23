# AchieveNest Phase 4 Fresh Disposable Database Build Report

## Phase 4 Result

### Disposable Environment

- Name: `AchieveNest-Phase4-Validation` (local fallback project ID: `phase4`)
- Project ref: local-only; no cloud project ref
- Database target: PostgreSQL `17.6`, database `postgres`, user `postgres`, `127.0.0.1:54322`
- Connection type: direct, loopback-only Docker port binding
- Execution environment: Codex-managed Windows PowerShell on the local host
- Confirmed not Test (`gliqcruavudrjehgbfei`): YES
- Confirmed not production (`atlicalzumfunolhukbz`): YES

The disposable database ran in `supabase_db_phase4`. Docker's authoritative binding was `127.0.0.1:54322->5432/tcp`. Localhost connected successfully, while all tested non-loopback addresses (`172.20.240.1`, `192.168.110.92`, and `192.168.137.1`) failed from both host and external-container paths.

### Safety Verification

- Branch: `compat/target-schema-test`
- Starting HEAD: `22608f5a4eeaad9b8ae1c49d6c2c11c4b3b56c59`
- Starting working tree: clean
- Original ignored backend `.env` backup: `C:\Users\Admin\Documents\AchieveNest-local-backups\backend-env-pre-phase4`
- Backup SHA-256 matched the original before local reconfiguration.
- Local ignored `.env` target: `127.0.0.1:54322`, database `postgres`, development group
- No protected Supabase hostname, project ref, or credentials were retained in the Phase 4 `.env`.
- Existing AchieveNest-Test modified: NO
- Production modified: NO
- PR #20 merged: NO

### Clean Baseline Verification

Before migration replay, the disposable database was reset to zero:

- AchieveNest tables before migration: `0`
- Public tables before migration: `0`
- Existing CodeIgniter migration records: none; `public.migrations` table absent (`false`)
- Auth users: `0`
- Storage buckets: `0`
- Storage objects: `0`
- Result: PASS

### Migration Execution

- Pre-execution status: all repository migrations `000001`-`000026` pending
- Command: `.\scripts\spark.ps1 migrate`
- First migration: `000001 CreateIdentityAndAcademicFoundation`
- Last migration: `000026 HardenEvidenceUploadSecurity`
- Applied: `26`
- Failed: `0`
- Batch: `1`
- Result: PASS

CodeIgniter executed all migrations in continuous repository order and returned `Migrations complete.` No migration was skipped, manually run, or manually marked complete.

### Migration History

- Total records: `26`
- Distinct versions: `26`
- First recorded version: `2026-08-21-000001`
- Last recorded version: `2026-08-27-000026`
- Continuous `000001`-`000026`: YES
- Missing: none
- Duplicates: none
- Result: PASS

### Schema Validation

- Public base tables: `56`
- Public views: `2`
- Public indexes: `215`
- Public foreign keys: `128`
- Public check constraints: `123`
- Public functions: `14`
- Public triggers: `18`
- RLS-enabled public tables: `56`
- Public policies: `98`
- Result: PASS

Required target domains are present: institutional structure, student and personnel affiliations, governance assignments, portfolio/evidence, award evaluation/scoring, notifications, audit, certificates, and events.

Compatibility is preserved:
- `departments`: present
- `degree_programs`: present
- `profile_roles`: present
- Legacy `profiles.department_id`, `profiles.degree_program_id`, and `profiles.year_level`: present
- `v_current_student_academic_placement`: present with `security_invoker=true`
- `v_current_personnel_affiliation`: present with `security_invoker=true`

### Constraints and Indexes

- One active HR administrator: `uq_profiles_one_active_hr_admin`
- OSAD singleton index/constraint: absent as required
- One active organization moderator per organization: `uq_org_moderator_one_active_per_organization`
- Dean active uniqueness: `uq_dean_one_active_per_college`, `uq_dean_one_active_per_personnel`
- Program coordinator active uniqueness: `uq_program_one_active_coordinator`
- Award threshold: `award_definitions_candidate_threshold_percent_check` enforces `0`-`100`
- Student evidence security: `ck_student_evidence_security_status`, `ck_student_evidence_sha256`
- Personnel evidence security: `ck_personnel_evidence_security_status`, `ck_personnel_evidence_sha256`
- File audit hash: `file_security_audit_events_sha256_check`
- Result: PASS

### Functions and Triggers

The following security helpers are owned by `postgres`, are `SECURITY DEFINER`, and have `search_path=""`:
- `private.is_hr_admin()` — execute: `postgres`, `authenticated`
- `private.is_osad_admin()` — execute: `postgres`, `authenticated`
- `private.is_active_dean(uuid)` — execute: `postgres`, `authenticated`
- `private.is_active_program_coordinator(uuid)` — execute: `postgres`, `authenticated`
- `public.admin_update_award_candidate_threshold(uuid, uuid, numeric)` — execute: `postgres`, `service_role` only

`PUBLIC`, `anon`, and `authenticated` do not have execute access to the backend-only award threshold operation.

The threshold trigger updates only evaluations for the changed award whose status is not `superseded`. Evaluation triggers recalculate percentages and synchronize portfolio-based eligibility; they do not update `award_definitions`, so the chain does not recurse. Dean-nomination eligibility is not modified by this chain.

All 18 non-internal public triggers are verified. Result: PASS.

### Security Validation

- RLS: enabled on all 56 public base tables
- Public tables without RLS: `0`
- `anon` grants on public tables: `0`
- Authenticated notification update: column-level `UPDATE` only on `notifications.read_at`
- Award definitions: authenticated `SELECT` only; no authenticated `UPDATE`
- Evidence mutation: direct authenticated table mutation grants withheld
- Sensitive evidence Storage buckets: no direct authenticated object policies
- SECURITY DEFINER helpers: owners, search paths, and execute ACLs match approved design
- Result: PASS

### Storage

Six private buckets were created and verified:

| Bucket | Limit | MIME allowlist |
|---|---:|---|
| `avatars` | 5 MiB | JPEG, PNG, WebP |
| `certificate-assets` | 10 MiB | JPEG, PNG, WebP, SVG, PDF |
| `issued-certificates` | 10 MiB | PDF |
| `evaluation-reports` | 20 MiB | PDF |
| `personnel-evidence` | 20 MiB | PDF, JPEG, PNG, WebP |
| `student-evidence` | 20 MiB | PDF, JPEG, PNG, WebP |

- Private: all six
- Avatar policy: owner-path scoped
- HR policy: `evaluation-reports`
- OSAD policy: `certificate-assets` and `issued-certificates`
- Evidence direct browser policies: none
- Result: PASS

### Reference Data & Taxonomy Remediation Review

#### Authoritative Source Analysis
- Source file: `C:\Users\Admin\Downloads\AchieveNest_FINAL_Complete_Portfolio_Categories_and_Potential_Award_Scoring_Sheets.docx`
- Categories 1–6 and 9 ([Leadership Position](file:///c:/Users/Admin/Downloads/AchieveNest_FINAL_Complete_Portfolio_Categories_and_Potential_Award_Scoring_Sheets.docx), [Organization Membership / Participation](file:///c:/Users/Admin/Downloads/AchieveNest_FINAL_Complete_Portfolio_Categories_and_Potential_Award_Scoring_Sheets.docx), [Community Service / Volunteerism](file:///c:/Users/Admin/Downloads/AchieveNest_FINAL_Complete_Portfolio_Categories_and_Potential_Award_Scoring_Sheets.docx), [Church / Ministry Involvement](file:///c:/Users/Admin/Downloads/AchieveNest_FINAL_Complete_Portfolio_Categories_and_Potential_Award_Scoring_Sheets.docx), [Seminar / Training](file:///c:/Users/Admin/Downloads/AchieveNest_FINAL_Complete_Portfolio_Categories_and_Potential_Award_Scoring_Sheets.docx), [Citation / Recognition](file:///c:/Users/Admin/Downloads/AchieveNest_FINAL_Complete_Portfolio_Categories_and_Potential_Award_Scoring_Sheets.docx), [Campus Journalism](file:///c:/Users/Admin/Downloads/AchieveNest_FINAL_Complete_Portfolio_Categories_and_Potential_Award_Scoring_Sheets.docx)): 40 subcategories have exact individual description strings in dedicated `Subcategory | Brief Guide` tables. All 40 exact strings match the authoritative DOCX verbatim.
- Categories 7 and 8 ([Sports](file:///c:/Users/Admin/Downloads/AchieveNest_FINAL_Complete_Portfolio_Categories_and_Potential_Award_Scoring_Sheets.docx) and [Socio-Cultural / Performing Arts](file:///c:/Users/Admin/Downloads/AchieveNest_FINAL_Complete_Portfolio_Categories_and_Potential_Award_Scoring_Sheets.docx)): The authoritative document intentionally models subcategories as discipline enumeration values within a metadata matrix without per-discipline description text.
- Per approved clarification, no descriptions were invented or fabricated for the 17 discipline subcategories. The 10 Sports and 7 Socio-Cultural discipline values are preserved exactly as written in the authoritative DOCX, with nullable descriptions inheriting category-level guidance in the student UI.

#### Counts and Integrity
- Categories: expected `9`, actual `9`
- Subcategories: expected `57`, actual `57`

| Category | Subcategory Count | Non-Blank Descriptions | Null / Inherited Descriptions | Description Source Status |
|---|---:|---:|---:|---|
| Leadership Position | 4 | 4 | 0 | Exact DOCX Match (Table 6) |
| Organization Membership / Participation | 5 | 5 | 0 | Exact DOCX Match (Table 7) |
| Community Service / Volunteerism | 5 | 5 | 0 | Exact DOCX Match (Table 8) |
| Church / Ministry Involvement | 4 | 4 | 0 | Exact DOCX Match (Table 9) |
| Seminar / Training | 8 | 8 | 0 | Exact DOCX Match (Table 11) |
| Citation / Recognition | 8 | 8 | 0 | Exact DOCX Match (Table 12) |
| Sports | 10 | 0 | 10 | Exact DOCX Match (Table 14 Matrix Disciplines, Null per model) |
| Socio-Cultural / Performing Arts | 7 | 0 | 7 | Exact DOCX Match (Table 16 Matrix Disciplines, Null per model) |
| Campus Journalism | 6 | 6 | 0 | Exact DOCX Match (Table 18) |
| **Total** | **57** | **40** | **17** | **100% Authoritative Source Alignment** |

- Duplicate category codes/names: `0`
- Duplicate subcategory codes: `0`
- Duplicate subcategory names within category: `0`
- `requires_verification=true`: all `57`
- Obsolete `verification_status_required`: `0`
- Sports Event Date OR Academic Year validation: all `10` Sports subcategories
- Administrative units: `19`
- Graduate School present: NO
- Auth users/profiles seeded: `0` / `0`
- Sample institutional IDs `9000000001`-`9000000005`: `0`
- Protected project refs in live data: `0`
- Award definitions/criteria/scoring rules/mappings seeded: `0` / `0` / `0` / `0`
- Test-specific data found: NO
- Unapproved award seed data found: NO
- Fabricated taxonomy strings: `0`
- Result: PASS

### Application Smoke Validation

- Routes: loaded successfully (`.\scripts\spark.ps1 routes`)
- PHPUnit tests: `50`
- Assertions: `127`
- Failures: `0`
- Errors: `0`
- Health endpoint: HTTP `200`
- Health payload:
  ```json
  {
    "service": "AchieveNest API",
    "status": "ok",
    "database": {
      "configured": true,
      "connected": true
    }
  }
  ```
- Categories endpoint (`/api/v1/portfolio/categories`): HTTP `200` returning all 9 categories and 57 subcategories with structured metadata
- Result: PASS

### Discrepancies

- Previous discrepancy (blank Sports and Socio-Cultural subcategory descriptions) was investigated against the authoritative source `AchieveNest_FINAL_Complete_Portfolio_Categories_and_Potential_Award_Scoring_Sheets.docx`.
- Confirmed that the source DOCX intentionally structures Sports (10) and Socio-Cultural (7) as discipline values under metadata matrices without discrete per-row guides.
- Per approved directive, no artificial strings were fabricated; all 17 disciplines are preserved verbatim from the DOCX, and categories 1–6 and 9 retain their exact source descriptions.
- Zero open discrepancies remain.

### Phase 4 Status

**PASS**

Migration execution, zero-recreation replay, schema construction, security structure, Storage configuration, taxonomy integrity, PHPUnit tests, and API health checks all passed.

### Next Stage

`Phase 5 — Reset and Replay Validation` (to be initiated upon instruction).
