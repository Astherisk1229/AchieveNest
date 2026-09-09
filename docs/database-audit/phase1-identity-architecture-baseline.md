# AchieveNest — Phase 1: Identity Architecture Baseline

> **Current Architecture:** Supertype `profiles` with Subtypes `student_profiles` & `personnel_profiles`  

---

## Structure of `profiles`

| Field | Type | Null | Key | Default |
|---|---|---|---|---|
| `id` | `char(36)` | NO | PRI | NULL |
| `institutional_id` | `varchar(50)` | NO | UNI | NULL |
| `account_type` | `varchar(30)` | NO | MUL | NULL |
| `email` | `varchar(255)` | NO | UNI | NULL |
| `full_name` | `varchar(255)` | NO |  | NULL |
| `first_name` | `varchar(100)` | YES |  | NULL |
| `middle_name` | `varchar(100)` | YES |  | NULL |
| `last_name` | `varchar(100)` | YES |  | NULL |
| `designation_title` | `varchar(150)` | YES |  | NULL |
| `avatar_url` | `text` | YES |  | NULL |
| `status` | `varchar(20)` | NO |  | active |
| `must_change_password` | `tinyint(1)` | NO |  | 1 |
| `password_hash` | `varchar(255)` | YES |  | NULL |
| `created_at` | `datetime(6)` | NO |  | CURRENT_TIMESTAMP(6) |
| `updated_at` | `datetime(6)` | NO |  | CURRENT_TIMESTAMP(6) |
| `active_hr_guard` | `char(36)` | YES | UNI | NULL |
