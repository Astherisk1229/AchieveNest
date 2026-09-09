# AchieveNest — Phase 1: Student Architecture Baseline

> **Current Architecture:** `profiles` $\rightarrow$ `student_profiles` $\rightarrow$ `student_program_enrollments`  

---

## Structure of `student_profiles`

| Field | Type | Null | Key | Default |
|---|---|---|---|---|
| `profile_id` | `char(36)` | NO | PRI | NULL |
| `year_level` | `varchar(20)` | YES |  | NULL |
| `enrollment_status` | `varchar(30)` | NO |  | enrolled |
| `created_at` | `datetime(6)` | NO |  | CURRENT_TIMESTAMP(6) |
| `updated_at` | `datetime(6)` | NO |  | CURRENT_TIMESTAMP(6) |

## Structure of `student_program_enrollments`

| Field | Type | Null | Key | Default |
|---|---|---|---|---|
| `id` | `char(36)` | NO | PRI | NULL |
| `student_profile_id` | `char(36)` | NO | MUL | NULL |
| `academic_program_id` | `char(36)` | NO | MUL | NULL |
| `year_level` | `varchar(20)` | NO |  | NULL |
| `academic_year` | `varchar(20)` | NO |  | NULL |
| `effective_from` | `date` | NO |  | NULL |
| `effective_until` | `date` | YES |  | NULL |
| `is_active` | `tinyint(1)` | NO |  | 1 |
| `created_at` | `datetime(6)` | NO |  | CURRENT_TIMESTAMP(6) |
| `updated_at` | `datetime(6)` | NO |  | CURRENT_TIMESTAMP(6) |
| `active_student_guard` | `char(36)` | YES | UNI | NULL |
