# AchieveNest Plan 07 — Phase 8A Database Report
# Database Discrepancy, Constraints & Migration Report

---

## 1. Discrepancy Audit Execution

```text
========================================================================
PHASE 8A DATABASE DISCREPANCY AUDIT
========================================================================

profiles_missing_credentials                     : 0 discrepancies
profiles_with_duplicate_credentials              : 0 discrepancies
invalid_or_null_must_change_password             : 0 discrepancies
profiles_column_must_change_password_exists      : 0 discrepancies
plaintext_password_column_exists                 : 0 discrepancies
completed_reset_requests_missing_processor       : 0 discrepancies
student_role_mismatch                            : 0 discrepancies
personnel_role_mismatch                          : 0 discrepancies

Summary: ALL INTEGRITY CHECKS PASSED (0 discrepancies)
```

---

## 2. Institutional ID Constraints & Limits

- Column `profiles.institutional_id`: `VARCHAR(50) NOT NULL UNIQUE`.
- Student ID rule: ASCII digits only (`[0-9]{5,50}`), preserving leading zeros.
- Personnel ID rule: 5 to 50 characters, control-character sanitized, unique in `profiles`.
- Uniqueness is enforced at the database level by unique index `idx_profiles_institutional_id`.
