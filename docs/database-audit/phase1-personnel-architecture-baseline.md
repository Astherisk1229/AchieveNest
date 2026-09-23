# AchieveNest — Phase 1: Personnel Architecture Baseline

> **Current Architecture:** `profiles` $\rightarrow$ `personnel_profiles` $\rightarrow$ Affiliations  

---

## Structure of `personnel_profiles`

| Field | Type | Null | Key | Default |
|---|---|---|---|---|
| `profile_id` | `char(36)` | NO | PRI | NULL |
| `personnel_classification` | `varchar(30)` | NO |  | academic |
| `employment_status` | `varchar(30)` | NO |  | full_time |
| `rank_level` | `varchar(50)` | YES |  | NULL |
| `created_at` | `datetime(6)` | NO |  | CURRENT_TIMESTAMP(6) |
| `updated_at` | `datetime(6)` | NO |  | CURRENT_TIMESTAMP(6) |
