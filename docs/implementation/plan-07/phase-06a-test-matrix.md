# AchieveNest Plan 07 — Phase 6A Evidence
# Test Matrix & Verification Results

---

## 1. Automated Integration & Unit Tests

| Test ID | Scope | Expected Result | Result |
| :--- | :--- | :--- | :---: |
| `P6A-POL-001` | Exact `GET auth.me` | Allowed | **PASS** |
| `P6A-POL-002` | `POST auth.me` | Denied (403) | **PASS** |
| `P6A-POL-003` | Exact `POST auth.change_password` | Allowed | **PASS** |
| `P6A-POL-004` | `GET auth.change_password` | Denied (404/403) | **PASS** |
| `P6A-POL-005` | Exact `POST auth.logout` | Allowed | **PASS** |
| `P6A-POL-006` | Password-reset route under every method | Denied (403) | **PASS** |
| `P6A-POL-007` | Unknown route alias / path | Denied (403) | **PASS** |
| `P6A-PEND-001` | Pending Student on `/password-reset-requests` | 403 `PASSWORD_CHANGE_REQUIRED` | **PASS** |
| `P6A-PEND-003` | Pending OSAD Admin on `/password-reset-requests` | 403 `PASSWORD_CHANGE_REQUIRED` | **PASS** |
| `P6A-PEND-004` | Pending HR Admin on `/password-reset-requests` | 403 `PASSWORD_CHANGE_REQUIRED` | **PASS** |
| `P6A-ACT-001` | Active authorized OSAD Admin on `/password-reset-requests` | 200 OK | **PASS** |
| `P6A-ACT-002` | Active authorized HR Admin on `/password-reset-requests` | 200 OK | **PASS** |
| `P6A-PUB-001` | Public unauthenticated POST on `/password-reset-requests` | 200 OK | **PASS** |

---

## 2. Regression Suites

| Test Suite | Scope | Result |
| :--- | :--- | :---: |
| **Frontend Vitest Suite** | 70 test files, 412 tests | **PASS (412/412)** |
| **Backend PHPUnit Suite** | 33 unit tests, 707 assertions | **PASS (33/33)** |
| **Live Phase 6A Hardened Suite** | Full-stack end-to-end integration | **PASS (100%)** |
| **Live Phase 6 Enforcement Suite** | Full activation & rotation suite | **PASS (100%)** |
