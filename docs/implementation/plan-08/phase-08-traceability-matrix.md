# AchieveNest Plan 08 — Phase 8 Traceability Matrix
## Comprehensive Testing & Cross-Layer Traceability

---

| Scenario / Requirement | Verification Layer | Automated Test File | Concrete Evidence & Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| **5/5 Canonical Year Levels** | UI / API / DB | `test_plan08_phase8_comprehensive_suite.php` (Section 1) | 1st Year to 5th Year created with HTTP 201 & verified in DB | **PASS** |
| **Graduate Rejection** | UI / API / DB | `test_plan08_phase8_comprehensive_suite.php` (Section 2, 8) | Rejected by UI, API (422), and DB (`chk_student_profiles_year_level`) | **PASS** |
| **Invalid Year Level Matrix** | API / DB | `test_plan08_phase8_comprehensive_suite.php` (Section 2) | 6th Year, numeric, whitespace, injection rejected (HTTP 422) | **PASS** |
| **Canonical Sex Options** | UI / API / DB | `test_plan08_phase8_comprehensive_suite.php` (Section 3) | Male, Female, Prefer not to say created & verified in DB | **PASS** |
| **Invalid Sex Rejection** | API / DB | `test_plan08_phase8_comprehensive_suite.php` (Section 3, 8) | Omitted, null, blank, Unknown, Other, Alien rejected (422 & DB CHECK) | **PASS** |
| **Academic Year Invariants** | UI / API / DB | `test_plan08_phase8_comprehensive_suite.php` (Section 4, 8) | 2025-2026/2026-2027 accepted; future/malformed rejected | **PASS** |
| **Zero Partial Records** | DB Integrity | `test_plan08_phase8_comprehensive_suite.php` (Section 5) | 0 partial rows in profiles, student_profiles, enrollments, credentials | **PASS** |
| **Legacy NULL Sex Handling** | DB & UI | `test_plan08_phase8_comprehensive_suite.php` (Section 6) | 74 records preserved; explicit canonical correction required on edit | **PASS** |
| **OSAD Year Level Filter** | API Controller | `test_plan08_phase8_comprehensive_suite.php` (Section 7) | Filter '1st Year' matches students; 'Graduate' rejected with 422 | **PASS** |
| **Mass Assignment Protection** | Provisioning API | `test_plan08_phase8_comprehensive_suite.php` (Section 9) | Strict allowlisting blocks injected status, roles, must_change_password | **PASS** |
| **Plan 07 Security Regression** | Full Auth Suite | `run_phase9_full_security_regression.php` | 33/33 security tests PASS | **PASS** |
| **Frontend Tests** | Vitest | Full Frontend Vitest Suite | 74 test files / 437 tests PASS | **PASS** |
