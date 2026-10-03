# PLAN 09 — Phase 8 Finding Severity & Repair Classification Matrix
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Finding Severity & Classification Framework

The reconciliation engine categorizes every finding along two dimensions: **Impact Severity** and **Repair Recommendation Classification**.

| Finding Type | Impact Category | Severity Level | Repair Recommendation Classification | Action Required |
|---|---|---|---|---|
| `ORPHAN_STUDENT_PROFILE` | Data Integrity | **CRITICAL** | `DATA REVIEW REQUIRED` | Investigate missing parent profile before manual resolution |
| `DUPLICATE_STUDENT_ID` | Identity Collision | **CRITICAL** | `ADMINISTRATIVE REVIEW REQUIRED` | Review conflicting accounts with OSAD administration |
| `DUPLICATE_INSTITUTIONAL_EMAIL` | Identity Collision | **CRITICAL** | `ADMINISTRATIVE REVIEW REQUIRED` | Review conflicting accounts with OSAD administration |
| `ORPHAN_STUDENT_ACCOUNT` | Structural Gap | **HIGH** | `DATA MIGRATION REQUIRED` | Generate missing `student_profiles` extension |
| `MISSING_STUDENT_ROLE` | RBAC Integrity | **HIGH** | `ADMINISTRATIVE REVIEW REQUIRED` | Assign standard `student` role |
| `INVALID_PROGRAM_REFERENCE` | Referential FK | **HIGH** | `DATA MIGRATION REQUIRED` | Reassign enrollment to valid active program |
| `INVALID_COLLEGE_REFERENCE` | Referential FK | **HIGH** | `DATA MIGRATION REQUIRED` | Correct `college_id` foreign key on program record |
| `MISSING_REQUIRED_ENROLLMENT` | Placement Gap | **MEDIUM** | `ADMINISTRATIVE REVIEW REQUIRED` | Place student in active academic degree program |
| `DUPLICATE_ROLE_ASSIGNMENT` | Redundancy | **MEDIUM** | `DATA MIGRATION REQUIRED` | Deduplicate identical role rows |
| `UNEXPECTED_STATUS_COMBINATION` | Lifecycle State | **LOW** | `NO ACTION REQUIRED` | Historical archival record; valid under Plan 07 |
| `KNOWN_LEGACY_CLASS_C` | Plan 08 Baseline | **NON-ANOMALY** | `NO ACTION REQUIRED` | Legacy NULL Sex row preserved by design |
