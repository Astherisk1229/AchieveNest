# AchieveNest — Phase E: Personnel Subtype Audit

> **Table:** `personnel_profiles` (1:0..1 Extension of `profiles`)  

---

## 1. Relational Subtype Definition
- **Primary Key**: `profile_id` (CHAR(36))
- **Foreign Key**: `profile_id` $\rightarrow$ `profiles.id` (RESTRICT on Delete / UPDATE CASCADE)
- **Cardinality**: `profiles (1)` $\rightarrow$ `(0..1) personnel_profiles`

## 2. Attribute Inventory & Ownership

| Attribute | Type | Nullable | Classification | Semantic Role |
|---|---|---|---|---|
| `profile_id` | `CHAR(36)` | NO | **PK + FK** | Links personnel subtype to parent profile |
| `personnel_classification` | `VARCHAR(64)` | NO | **AUTHORITATIVE** | Employment class (`teaching`, `non_teaching`, `administrative`) |
| `employment_status` | `VARCHAR(32)` | NO | **AUTHORITATIVE** | Status (`regular`, `probationary`, `contractual`, `part_time`) |
| `rank_level` | `VARCHAR(64)` | YES | **AUTHORITATIVE** | Academic / administrative rank level |
| `created_at` | `DATETIME` | YES | **HISTORICAL** | Subtype creation timestamp |
| `updated_at` | `DATETIME` | YES | **HISTORICAL** | Subtype modification timestamp |
