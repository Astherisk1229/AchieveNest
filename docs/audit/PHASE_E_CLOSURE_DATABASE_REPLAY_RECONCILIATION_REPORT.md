# AchieveNest — Phase E Closure Database Replay Reconciliation Report

**Date:** August 30, 2026  
**Status:** `PASS — SAFE TO PROCEED TO PHASE F`  
**Objective:** Reconcile and classify the 58 vs 57 database table count difference between canonical `achievenest_local` and offline defense replay `achievenest_test_replay`.

---

## 1. Repository State

- **Branch:** `audit/project-architecture-linkage`
- **HEAD:** `46eef5ac5968341697cd17ce89bc32a04a520991` (`docs(audit): record phase e organization persistence`)
- **Working Tree Clean:** `YES` (tracked baseline clean)

---

## 2. Database Counts

- **Canonical (`achievenest_local`):** `58 tables`
- **Replay (`achievenest_test_replay`):** `57 tables`

---

## 3. Exact Set Difference

### Tables present in `achievenest_local` but absent from `achievenest_test_replay`:
1. `migrations`

### Tables present in `achievenest_test_replay` but absent from `achievenest_local`:
- `NONE` (0 tables)

---

## 4. Difference Classification

| Table | Canonical | Replay | Created By | Runtime Used? | Permanent Schema? | Classification |
| :--- | :---: | :---: | :--- | :---: | :---: | :--- |
| `migrations` | `YES` | `NO` | CodeIgniter 4 CLI migration runner (`Config\Migrations::$table = 'migrations'`) | Yes (CLI migration bookkeeping only) | No (Framework metadata) | **EXPECTED FRAMEWORK/RUNTIME TABLE** |

### Evidence & Trace to Repository Sources:
- Configured in [`backend/app/Config/Migrations.php:L30`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Config/Migrations.php#L30):
  ```php
  public string $table = 'migrations';
  ```
- The CodeIgniter framework creates `migrations` (columns: `id`, `version`, `class`, `group`, `namespace`, `time`, `batch`) when `spark migrate` is invoked.
- The offline MySQL defense replay (`000001` through `000012`) executes pure SQL scripts directly against MySQL, creating all 57 domain and reference tables without executing the CodeIgniter PHP migration runner.
- Zero business tables are missing from the replay.

---

## 5. Business Schema Parity

- **Comparison Method:** Column-level inspection across all 57 business tables comparing `column_name`, `ordinal_position`, `column_type`, `is_nullable`, `column_default`, and `extra` attributes in `information_schema.columns`.
- **Result:** `PASS` (100% column definition parity across all 57 business tables).

Key business tables verified:
- `organizations` (`PASS`)
- `organization_program_affiliations` (`PASS`)
- `organization_moderator_assignments` (`PASS`)
- `award_definitions` (`PASS`)
- `award_criteria` (`PASS`)
- `award_scoring_rules` (`PASS`)
- `award_portfolio_mappings` (`PASS`)
- `student_portfolio_records` (`PASS`)
- `dean_student_nominations` (`PASS`)
- `award_interview_eligibilities` (`PASS`)
- Local auth / session / profile tables (`PASS`)

---

## 6. Organization Logo Schema Parity

- **Comparison:** `SHOW CREATE TABLE organizations` across `achievenest_local` and `achievenest_test_replay`.
- **Result:** `PASS` (Identical schema definitions):
  - `logo_storage_key` `varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL`
  - `logo_original_name` `varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL`
  - `logo_mime_type` `varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL`
  - `logo_updated_at` `datetime(6) DEFAULT NULL`
  - All foreign keys, unique keys, and check constraints identical.

---

## 7. Award Reference Parity

| Metric | `achievenest_local` | `achievenest_test_replay` | Parity Status |
| :--- | :---: | :---: | :---: |
| `award_definitions` count | `15` | `15` | `PASS` |
| `award_criteria` count | `40` | `40` | `PASS` |
| `award_scoring_rules` count | `0` | `0` | `PASS` |
| `award_portfolio_mappings` count | `0` | `0` | `PASS` |
| Distinct candidate threshold count | `1` | `1` | `PASS` |
| `candidate_threshold_percent` value | `80.00%` | `80.00%` | `PASS` |

---

## 8. Organization Data Classification

- **`CSS`** (`40000000-0000-0000-0000-000000000001`): **DEMO FIXTURE DATA** (Created during demo persona setup in `achievenest_local`).
- **`DEMO_JPIA`** (`d0000000-0000-0000-0002-000000000000`): **DEMO FIXTURE DATA** (Created during demo scenario seeding in `achievenest_local`).
- **Replay Table `organizations`**: Intentionally created empty in replay schema migrations as organizations are managed runtime entities, not immutable reference taxonomies.

---

## 9. Logo Storage Security Sanity Check

1. **Storage key generation:**
   - Server-generated storage key: **YES** (`organizations/{orgId}/logo_{fileUuid}.{ext}`)
   - Raw client filename used as filesystem path: **NO** (Client filename stored solely in `logo_original_name` metadata field; unique UUIDv4 used on disk).
2. **Path traversal protection:**
   - In-depth sanitization: `str_replace(['../', '..\\'], '')` combined with internal storage root prefix isolation.
3. **Logo retrieval route authorization:**
   - `GET /api/v1/osad/organizations/{id}/logo`: Intentionally **public/display-safe** with binary streaming (`Content-Type`, `Content-Length`, `Cache-Control: public, max-age=86400`) for asset rendering in browser without exposing internal filesystem paths.
   - `POST` and `DELETE` logo routes: Strictly OSAD-authenticated and authorized.

---

## 10. Phase E Report Parity Statement Update

The Phase E parity statement has been updated to:
```text
SCHEMA PARITY CONFIRMED — 57 BUSINESS/REPLAY TABLES + 1 EXPECTED LOCAL-ONLY FRAMEWORK METADATA TABLE (migrations)
```

---

## 11. Phase E Final Decision

```text
PHASE E CLOSURE: PASS — SAFE TO PROCEED TO PHASE F
```
