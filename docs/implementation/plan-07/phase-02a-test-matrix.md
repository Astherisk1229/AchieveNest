# AchieveNest Plan 07 — Phase 2A Evidence
# Test Matrix & Verification Results

---

## 1. Backend Unit Tests (`AccountLifecycleResolverTest.php`)

| Test Name | Validated Contract | Assertions | Status |
| :--- | :--- | :---: | :--- |
| `testActiveWithMustChangePasswordDerivesPendingFirstLogin` | Canonical `must_change_password = true` $\rightarrow$ `pending_first_login` | 6 | **PASS** |
| `testActiveWithMustChangePasswordOneDerivesPendingFirstLogin` | Canonical `must_change_password = 1` $\rightarrow$ `pending_first_login` | 2 | **PASS** |
| `testActiveWithMustChangePasswordFalseDerivesActive` | Canonical `must_change_password = false` $\rightarrow$ `active` | 6 | **PASS** |
| `testSuspendedPrecedenceOverMustChangePassword` | `profiles.status = suspended` overrides credential flag | 4 | **PASS** |
| `testArchivedPrecedenceOverMustChangePassword` | `profiles.status = archived` overrides credential flag | 4 | **PASS** |
| `testDisabledPrecedenceOverMustChangePassword` | `profiles.status = disabled` overrides credential flag | 4 | **PASS** |
| `testLockedPrecedence` | `isLocked = true` overrides credential flag | 3 | **PASS** |
| `testUnsupportedStatusFailsClosedAsUnknown` | Invalid status string fails closed to `unknown` | 3 | **PASS** |
| `testNullStatusFailsClosedAsUnknown` | Null status fails closed to `unknown` | 2 | **PASS** |

---

## 2. End-to-End Live Contract Suite

| Step | Flow | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :---: |
| 1 | OSAD Admin Login | Status `active`, action `none` | Status `active`, action `none` | **PASS** |
| 2 | Provision Student | Returns `pending_first_login`, `must_change_password = true`, temp password | Returns `pending_first_login`, `must_change_password = true` | **PASS** |
| 3 | OSAD List Students | Projected `pending_first_login` from credentials join | Projected `pending_first_login` | **PASS** |
| 4 | Student First Login | Authenticates with temp password; returns `pending_first_login` | Authenticates; returns `pending_first_login` | **PASS** |
| 5 | Student `/auth/me` | Rehydrates `pending_first_login` from `local_auth_credentials` | Rehydrates `pending_first_login` | **PASS** |
| 6 | Password Change | Atomically sets `must_change_password = 0` on `local_auth_credentials` | Returned `active`, `must_change_password = false` | **PASS** |
| 7 | Post-Activation Login | Returns `active`, `must_change_password = false`, action `none` | Returns `active`, `must_change_password = false` | **PASS** |
| 8 | HR Provision & List | Created personnel appears in directory as `pending_first_login` | Found in HR directory as `pending_first_login` | **PASS** |

---

## 3. Frontend Regression Test Suite

- **Vitest Suites**: 66 / 66 test files passed (**100% PASS**).
- **Total Tests**: 386 / 386 passed (**100% PASS**).
- **Storage Protection**: Verified `temporary_password` is absent from browser storage.
