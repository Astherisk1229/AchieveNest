# AchieveNest Plan 07 — Phase 2A Implementation Report
# `must_change_password` Single Source of Truth & Credential-State Remediation

---

## 1. Top-Level Summary

```text
PLAN 07 — PHASE 2A MUST-CHANGE-PASSWORD SOURCE-OF-TRUTH REMEDIATION

Repository/Phase 2 state revalidated: PASS
profiles.must_change_password classification: PHYSICAL DUPLICATE COLUMN (DEPRECATED FOR REMOVAL)
Canonical persisted source: local_auth_credentials.must_change_password
Repository references classified: PASS
Read-only discrepancy audit: PASS
Missing credential rows: 0
Duplicate credential rows: 0
Mismatched duplicate flags: 0
Lifecycle resolver canonical input: PASS
Student provisioning single write: PASS
Personnel provisioning single write: PASS
Login and /auth/me consistency: PASS
Password-change single write: PASS
Administrative-reset single write: PASS
OSAD/HR listing consistency: PASS
Frontend lifecycle snapshot boundary: PASS
Temporary-password persistent-storage audit: PASS
Duplicate-column migration: APPLIED (Migration 2026-09-02-000054)
Credential exposure regression: PASS
Automated tests: PASS
Documentation corrected: PASS
Critical findings: 0
High findings: 0
Unresolved blockers: 0

SPLIT-BRAIN RISK: ELIMINATED
REMEDIATION DECISION: READY FOR PHASE 3
```

---

## 2. Executive Remediation Summary

Phase 2A resolved all ambiguities regarding credential state authority and eliminated the split-brain risk between `profiles.must_change_password` and `local_auth_credentials.must_change_password`.

### 2.1 Binding Architectural Authority
- **Single Persisted Authority**: `local_auth_credentials.must_change_password` is now the **sole authoritative persisted source** for first-login and password-change requirements.
- **Administrative Access Authority**: `profiles.status` remains the sole administrative authority (`active`, `suspended`, `archived`, `disabled`).
- **Lifecycle Derivation**: `App\Services\AccountLifecycleResolver` accepts `profiles.status` and `local_auth_credentials.must_change_password` (plus lock state), deterministically computing `account_lifecycle_status`.
- **Database Migration**: Applied Migration `2026-09-02-000054_AddMustChangePasswordToLocalAuthCredentials.php`, adding `must_change_password TINYINT(1) NOT NULL DEFAULT 1` to `local_auth_credentials` and backfilling existing records.
- **Zero Discrepancy Baseline**: Read-only audit of all 90 profiles in `achievenest_local` confirmed 0 missing credentials, 0 duplicate credentials, 0 unsupported flag values, and 0 mismatches between tables.

---

## 3. Backend & Frontend Surface Cutover

| Surface | Operation | Canonical Cutover Implementation |
| :--- | :--- | :--- |
| **`POST /api/v1/auth/login`** | Read & Authenticate | Queries `local_auth_credentials.must_change_password` and feeds canonical value to `AccountLifecycleResolver`. |
| **`GET /api/v1/auth/me`** | Session Rehydration | Queries `local_auth_credentials.must_change_password` directly to ensure 100% parity with `/auth/login`. |
| **`POST /api/v1/provisioning/manual-student`** | Write Account | Inserts `local_auth_credentials` with `must_change_password = 1`. |
| **`POST /api/v1/provisioning/manual-personnel`** | Write Account | Inserts `local_auth_credentials` with `must_change_password = 1`. |
| **`POST /api/v1/auth/change-password`** | User Activation | Atomically updates `local_auth_credentials` (`must_change_password = 0`, `password_changed_at = NOW()`), clears sessions. |
| **`POST /api/v1/password-reset-requests/...`** | Admin Reset | Atomically updates `local_auth_credentials` (`must_change_password = 1`, `password_changed_at = NOW()`), revokes sessions. |
| **`GET /api/v1/osad/students`** | Listing Projection | Left joins `local_auth_credentials lac` and projects `COALESCE(lac.must_change_password, 1) AS credential_must_change_password`. |
| **`GET /api/v1/hr/personnel`** | Directory Projection | Left joins `local_auth_credentials lac` and projects `COALESCE(lac.must_change_password, 1) AS credential_must_change_password`. |
| **`authService.js` (Frontend)** | Storage Normalization | Explicitly constructs allowlisted session snapshot. Spreading `...user` was removed and `delete sessionPayload.temporary_password` added to guarantee zero persistent credential leakage. |

---

## 4. Verification Evidence

- **Backend Unit Tests**: `AccountLifecycleResolverTest.php` passed **9/9 tests (41 assertions, 100% PASS)**.
- **Live Contract Tests**: Full 8-step live integration suite executed against MySQL and CodeIgniter backend (**100% PASS**).
- **Frontend Vitest Suite**: All 66 test files passed (**386/386 tests, 100% PASS**).
- **Credential Storage Audit**: Confirmed `temporary_password` is excluded from `localStorage` and `sessionStorage`.
