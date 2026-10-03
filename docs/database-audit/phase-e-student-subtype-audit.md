# AchieveNest — Phase E: Student Subtype Audit

> **Table:** `student_profiles` (1:0..1 Extension of `profiles`)  

---

## 1. Relational Subtype Definition
- **Primary Key**: `profile_id` (CHAR(36))
- **Foreign Key**: `profile_id` $\rightarrow$ `profiles.id` (RESTRICT on Delete / UPDATE CASCADE)
- **Cardinality**: `profiles (1)` $\rightarrow$ `(0..1) student_profiles`

## 2. Attribute Inventory & Ownership

| Attribute | Type | Nullable | Classification | Semantic Role |
|---|---|---|---|---|
| `profile_id` | `CHAR(36)` | NO | **PK + FK** | Links student subtype to parent profile |
| `enrollment_status` | `VARCHAR(32)` | NO | **AUTHORITATIVE** | Current student status (`enrolled`, `graduated`, `leave_of_absence`) |
| `year_level` | `INT` | YES | **DERIVED CACHE** | Current year level cached from active `student_program_enrollments` |
| `created_at` | `DATETIME` | YES | **HISTORICAL** | Subtype creation timestamp |
| `updated_at` | `DATETIME` | YES | **HISTORICAL** | Subtype modification timestamp |
