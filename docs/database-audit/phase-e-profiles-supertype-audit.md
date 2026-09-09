# AchieveNest — Phase E: Profiles Supertype Audit

> **Database:** `achievenest_local`  
> **Table:** `profiles` (Master Supertype Entity)  

---

## 1. Table Structure & Attribute Classification

| Column Name | Type | Nullable | Key | Semantic Ownership | 3NF Justification |
|---|---|---|---|---|---|
| `id` | `CHAR(36)` | NO | PRI | Primary Key | Immutable surrogate UUID identity |
| `institutional_id` | `VARCHAR(64)` | NO | UNI | Shared Person Identifier | Universal NDMU ID across students and personnel |
| `account_type` | `VARCHAR(32)` | NO | - | Identity Discriminator | Base identity subtype classification (`student`, `faculty`, `staff`, etc.) |
| `email` | `VARCHAR(255)` | NO | UNI | Shared Contact Identifier | Canonical `@ndmu.edu.ph` institutional email |
| `first_name` | `VARCHAR(128)` | NO | - | Shared Person Attribute | Atomic given name |
| `middle_name` | `VARCHAR(128)` | YES | - | Shared Person Attribute | Atomic middle name |
| `last_name` | `VARCHAR(128)` | NO | - | Shared Person Attribute | Atomic surname |
| `full_name` | `VARCHAR(255)` | NO | - | Derived Display Cache | Concatenated display name for fast indexing and UI rendering |
| `sex` | `VARCHAR(16)` | YES | - | Shared Person Attribute | Single authoritative legal/institutional sex for award gating |
| `designation_title` | `VARCHAR(255)` | YES | - | Shared Display Attribute | Retained in profiles for unified navbar & badge display |
| `avatar_url` | `TEXT` | YES | - | Shared Account Attribute | Profile avatar reference |
| `status` | `VARCHAR(32)` | NO | - | Shared Account Lifecycle | Account state (`active`, `suspended`, `archived`) |
| `must_change_password` | `TINYINT(1)` | NO | - | Authentication Control | Security flag forcing password update on first login |
| `password_hash` | `VARCHAR(255)` | YES | - | Authentication Credential | Primary local credential storage (complemented by local_auth_credentials) |
| `created_at` | `DATETIME` | YES | - | Audit Timestamp | Creation timestamp |
| `updated_at` | `DATETIME` | YES | - | Audit Timestamp | Modification timestamp |
| `active_hr_guard` | `VARCHAR(64)` | YES | UNI | Generated Uniqueness Guard | Enforces single-active HR administrative role guard |
