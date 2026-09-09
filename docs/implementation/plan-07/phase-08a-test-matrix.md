# AchieveNest Plan 07 — Phase 8A Test Matrix
# Validation & Uniqueness Verification Matrix

---

## 1. Test Execution Results

| Test Category | File / Script | Tests Run | Pass Count | Final Result |
| :--- | :--- | :--- | :--- | :--- |
| **Root Cause & Availability Verification** | `test_phase8a_remediation.php` | 4 | 4 | **100% PASS** |
| **Backend Comprehensive E2E** | `run_phase8_comprehensive_e2e.php` | 21 | 21 | **100% PASS** |
| **Backend Unit Tests** | `RestrictedSessionRoutePolicyTest.php` | 33 | 33 | **100% PASS** |
| **Frontend Test Suite** | 71 test files | 414 | 414 | **100% PASS** |

---

## 2. Specific Investigation Tests

- `P8A-ROOT-001` (Search DB for `bserquina@ndmu.edu.ph`): **0 rows found (Absence confirmed)**.
- `P8A-ROOT-002` (Search DB for `2023368`): **1 row found (`Sean Asther Faderes`)**.
- `P8A-ROOT-005` (Availability check on `bserquina@ndmu.edu.ph`): **Returned `available: true`**.
- `P8A-ROOT-006` (Duplicate ID `2023368` submit): **Returned `409 INSTITUTIONAL_ID_ALREADY_EXISTS` on `institutional_id`**.
- `P8A-ROOT-008` (Fresh ID `9876543` submit with `bserquina@ndmu.edu.ph`): **Returned `201 CREATED` with temporary password**.
