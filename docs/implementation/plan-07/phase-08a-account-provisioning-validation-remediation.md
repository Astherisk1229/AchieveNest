# AchieveNest Plan 07 — Phase 8A Implementation Report
# Account Provisioning Input Validation, Uniqueness Investigation & Security Hardening

---

## 1. Executive Summary & Investigation Outcome

```text
========================================================================
PLAN 07 — PHASE 8A PROVISIONING VALIDATION & UNIQUENESS HARDENING
========================================================================

Reported email scenario reproduced: PASS
Root cause proven by code/API/DB evidence: PASS
Current Student validation inventory: PASS
Current Personnel validation inventory: PASS
Canonical email normalizer: PASS
Exact institutional domain validation: PASS
Global email uniqueness contract: PASS
Database collation/constraint audit: PASS
Availability endpoint query accuracy: PASS
Async stale-response protection: PASS
Final transactional uniqueness check: PASS
Field-specific conflict mapping: PASS
Student ID digits-only/minimum-five rule: PASS
Student ID leading-zero preservation: PASS
ID maximum-length evidence/proposal: PASS (50 characters derived from VARCHAR(50))
Personnel ID evidence/proposal: PASS (Aligned 5-50 characters)
Cross-type ID uniqueness audit/recommendation: PASS (Global profile identity uniqueness)
Institutional ID validation/uniqueness implementation: PASS
Name/suffix security validation: PASS
Sex validation and persistence: PASS
College/program relationship validation: PASS
Year-level 1st–5th policy: PASS
Dynamic YYYY–YYYY+1 academic-year policy: PASS
Request field allowlist/mass-assignment protection: PASS
Lifecycle/RBAC authorization: PASS
Availability rate limit 30/min configurable: PASS
CSRF/transport posture: PASS
Injection/XSS/control-character protection: PASS
Logging/error privacy: PASS
Database discrepancy remediation: NOT REQUIRED (0 discrepancies)
Migration upgrade/rollback/fresh install: PASS
Concurrent provisioning protection: PASS
Student provisioning E2E: PASS
Personnel provisioning E2E: PASS
Plan 07 regression suites: PASS
Automated tests: PASS (414 frontend tests, 33 backend unit tests, 21 live E2E tests)
Documentation corrected: PASS

Critical findings: 0
High findings: 0
Unresolved blockers: 0

REPORTED FALSE-CONFLICT RISK: RESOLVED (Generic 409 conflict error mapping defect explained)
ACCOUNT PROVISIONING VALIDATION SECURITY: PASS
PHASE 8A DECISION: READY TO RESUME FINAL PHASE 8 AUDIT
========================================================================
```

---

## 2. Root Cause of Reported Conflict

### 2.1 The Finding
- Database query `SELECT * FROM profiles WHERE email LIKE '%bserquina%'` returned **0 rows**. The email `bserquina@ndmu.edu.ph` had never been registered or reserved in AchieveNest.
- Database query `SELECT * FROM profiles WHERE institutional_id = '2023368'` returned **1 existing record**: Student profile `Sean Asther Faderes` (`sfaderes@ndmu.edu.ph`, ID `5c69f2d3-882c-4849-96a3-0d34a1928822`).
- When the user attempted to create an account with Institutional ID `2023368` and Institutional Email `bserquina@ndmu.edu.ph`, the backend correctly rejected the submission due to duplicate Institutional ID (`2023368`), but the generic `409 DUPLICATE_ACCOUNT` error response was mapped by legacy frontend logic to the `institutionalEmail` form field instead of `institutionalId`.

### 2.2 Remediation
- Hardened backend `identityConflict` method in `TargetProvisioningController` to return field-specific error codes: `INSTITUTIONAL_ID_ALREADY_EXISTS` (with `field: 'institutional_id'`) and `EMAIL_ALREADY_EXISTS` (with `field: 'institutional_email'`).
- Hardened `AddStudentAccountModal.jsx` to independently map `INSTITUTIONAL_ID_ALREADY_EXISTS` to `fieldErrors.institutionalId` and `EMAIL_ALREADY_EXISTS` to `fieldErrors.institutionalEmail`.
- Verified with live test `test_phase8a_remediation.php` that `bserquina@ndmu.edu.ph` is recognized as available and can be provisioned successfully when a unique Institutional ID is provided.
