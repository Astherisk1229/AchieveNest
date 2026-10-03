# AchieveNest — Phase E: Subtype Consistency & Distribution Report

> **Database:** `achievenest_local`  

---

## 1. Identity Account Type Distribution

| Account Type (`profiles.account_type`) | Profile Count | Expected Subtype Extension |
|---|---:|---|
| `hr_admin` | 2 | `personnel_profiles` |
| `osad_admin` | 2 | `personnel_profiles` |
| `personnel` | 11 | None (Administrative / Pure User) |
| `student` | 74 | `student_profiles` |

## 2. Overlap & Integrity Analysis
- **Student / Personnel Subtype Overlap Count**: **0** (Zero overlap detected in active dataset).
- **Student Account Subtype Mismatch Count**: **0** (100% of student accounts possess matching `student_profiles` rows).
