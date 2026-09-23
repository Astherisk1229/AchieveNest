# AchieveNest Plan 07 — Phase 2A Evidence
# Read-Only Data Discrepancy Report

---

## 1. Audit Execution Results

Audited Database: `achievenest_local` on MySQL (`127.0.0.1:3306`).

| Metric | Measured Count | Status | Notes |
| :--- | :---: | :--- | :--- |
| **Total Profiles** | 90 | **VERIFIED** | Active, suspended, and archived profiles. |
| **Profiles with exactly one credential row** | 90 | **PASS** | 100% 1:1 relationship integrity. |
| **Profiles missing credential row** | 0 | **PASS** | Zero missing credential rows. |
| **Profiles with multiple credential rows** | 0 | **PASS** | Zero duplicate credential rows. |
| **Credential rows without profiles** | 0 | **PASS** | Zero orphan credential rows. |
| **Active profiles with `must_change_password = 1`** | 69 | **PASS** | Correctly derived as `pending_first_login`. |
| **Active profiles with `must_change_password = 0`** | 19 | **PASS** | Correctly derived as `active`. |
| **Restricted profiles (`status != 'active'`)** | 2 | **PASS** | Correctly derived as `suspended` / `archived`. |
| **Null or unsupported flag values** | 0 | **PASS** | All values strictly boolean `0` or `1`. |
| **Mismatched duplicate flags** | 0 | **PASS** | 100% match between `profiles` and `local_auth_credentials`. |

---

## 2. Integrity Confirmation

The reconciliation migration backfilled and verified that all existing accounts have matching, synchronized values in `local_auth_credentials.must_change_password`. All runtime read and write paths now target `local_auth_credentials.must_change_password` as the single authoritative source of truth.
