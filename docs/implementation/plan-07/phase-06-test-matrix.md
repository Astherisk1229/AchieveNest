# AchieveNest Plan 07 — Phase 6 Evidence
# Test Matrix & Verification Results

---

## 1. Automated Integration & Unit Tests

| Test ID | Scope | Expected Result | Result |
| :--- | :--- | :--- | :---: |
| `P6-AUTH-001` | First login with temporary password | Restricted session, `must_change_password = true` | **PASS** |
| `P6-API-004` | Restricted session calling protected endpoint | Blocked with 403 `PASSWORD_CHANGE_REQUIRED` | **PASS** |
| `P6-API-002` | Restricted session calling `/auth/me` | Allowed with `pending_first_login` | **PASS** |
| `P6-PWD-002` | Incorrect current temporary password | 422 `INCORRECT_CURRENT_PASSWORD` | **PASS** |
| `P6-PWD-005` | New password equals temporary password | 422 `PASSWORD_REUSE_FORBIDDEN` | **PASS** |
| `P6-PWD-001` | Valid password change transaction | Commits, clears flag, issues fresh session | **PASS** |
| `P6-SES-003` | Old session token reused | 401 `INVALID_ACCESS_TOKEN` | **PASS** |
| `P6-SES-002` | Fresh session token on `/auth/me` | 200 with `active` lifecycle | **PASS** |
| `P6-ROUTE-001` | RouteAccessController on pending user | Resolves redirect to `/change-password` | **PASS** |
| `P6-ROUTE-003` | RouteAccessController on active user | Resolves canonical portal dashboard | **PASS** |
| `P6-UI-001` | ChangePasswordPage markup | 3 labeled fields with reveal controls | **PASS** |

---

## 2. Regression Suites

| Test Suite | Scope | Result |
| :--- | :--- | :---: |
| **Frontend Vitest Suite** | 70 test files, 412 tests | **PASS (412/412)** |
| **Backend PHPUnit Suite** | 24 unit tests, 680 assertions | **PASS (24/24)** |
| **Live Enforcement Suite** | 10-step full-stack integration | **PASS (10/10)** |
