# AchieveNest Plan 07 — Phase 1 Evidence
# Current-State Runtime Test Matrix

---

## 1. Runtime Scenario Execution Results

| Test ID | Scenario | Preconditions | Steps | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P07-P1-001** | OSAD Admin Login | Valid OSAD credentials | POST `/auth/login` | HTTP 200, JWT token returned | HTTP 200, Token returned | **PASS** |
| **P07-P1-002** | OSAD `/auth/me` Profile | Bearer token | GET `/auth/me` | Account type `osad_admin`, role `osad_staff` | Verified exact type and role | **PASS** |
| **P07-P1-003** | Provision Student Account | OSAD Auth Token | POST `/provisioning/manual-student` | HTTP 201, temp password, `must_change_password=true` | HTTP 201, `Ndmu#52cbe9d2`, `must_change_password: true` | **PASS** |
| **P07-P1-004** | Student First Login | New student email & temp pwd | POST `/auth/login` | HTTP 200, `must_change_password: true` | HTTP 200, flag true | **PASS** |
| **P07-P1-005** | Student Profile Resolution | Student Bearer token | GET `/auth/me` | Full name, role `student`, academic program | Resolved name & BSCS program | **PASS** |
| **P07-P1-006** | Student Mandatory Password Change | Student Bearer token | POST `/auth/change-password` | HTTP 200, password updated | HTTP 200, updated | **PASS** |
| **P07-P1-007** | Student Login with New Password | New password | POST `/auth/login` | HTTP 200, `must_change_password: false` | HTTP 200, flag false | **PASS** |
| **P07-P1-008** | Student Login with Old Temp Password| Revoked temp password | POST `/auth/login` | HTTP 401 Invalid credentials | HTTP 401 Invalid credentials | **PASS** |
| **P07-P1-009** | Login with ID Number instead of Email| Student ID in email field | POST `/auth/login` | HTTP 422 Invalid domain | HTTP 422 Invalid domain | **PASS** |
| **P07-P1-010** | HR Admin Login & Personnel Creation| HR Auth Token | POST `/provisioning/manual-personnel`| HTTP 201, temp password, `must_change_password=true` | HTTP 201, `Ndmu#9358eccd` | **PASS** |
| **P07-P1-011** | Personnel First Login | New personnel email & temp pwd | POST `/auth/login` | HTTP 200, `must_change_password: true` | HTTP 200, flag true | **PASS** |
| **P07-P1-012** | Personnel Profile & Affiliation Resolution| Personnel Bearer token | GET `/auth/me` | Full name, role `personnel`, college affiliation | Resolved College of Engineering | **PASS** |

---

## 2. Test Execution Trace Evidence

All 12 runtime scenarios were executed against the live local backend (`http://127.0.0.1:8080/api/v1`) and verified against the MySQL `achievenest_local` database. All synthetic test records were transactionally verified and cleaned up post-test.
