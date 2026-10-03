# AchieveNest Plan 07 — Phase 2A Evidence
# Schema and Symbol Classification Report

---

## 1. Physical Database Schema Classification

| Table Name | Column Name | Physical Existence | Nullable / Default | Classification | Role in Plan 07 Architecture |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `local_auth_credentials` | `must_change_password` | **YES** | `NO` / `DEFAULT 1` | `DB_COLUMN_CANONICAL` | **Sole persisted authority** for first-login requirement. |
| `local_auth_credentials` | `password_hash` | **YES** | `NO` | `DB_COLUMN_CANONICAL` | Stored bcrypt password hash. |
| `profiles` | `status` | **YES** | `NO` / `DEFAULT 'active'` | `DB_COLUMN_CANONICAL` | **Sole administrative access authority** (`active`, `suspended`, `archived`, `disabled`). |
| `profiles` | `must_change_password` | **YES** | `NO` / `DEFAULT 1` | `DB_COLUMN_DUPLICATE` | Legacy duplicate column; deprecated and superseded by `local_auth_credentials`. |
| `profiles` | `password_hash` | **YES** | `YES` | `DB_COLUMN_DUPLICATE` | Legacy duplicate column; superseded by `local_auth_credentials`. |

---

## 2. API Projection and DTO Symbol Classification

| Symbol / Field Name | Context | Source | Classification |
| :--- | :--- | :--- | :--- |
| `must_change_password` | `/api/v1/auth/login` payload | `local_auth_credentials.must_change_password` | `DTO_OR_SERIALIZER_FIELD` |
| `must_change_password` | `/api/v1/auth/me` user object | `local_auth_credentials.must_change_password` | `DTO_OR_SERIALIZER_FIELD` |
| `credential_must_change_password` | `/osad/students` SQL select | `local_auth_credentials.must_change_password` | `SQL_ALIAS` |
| `credential_must_change_password` | `/hr/personnel` SQL select | `local_auth_credentials.must_change_password` | `SQL_ALIAS` |
| `must_change_password` | Frontend Session Snapshot | `/api/v1/auth/me` or `/api/v1/auth/login` | `FRONTEND_SNAPSHOT` |
| `temporary_password` | Provisioning & Reset response | Request-local generation (in-memory only) | `TEMPORARY_CREDENTIAL_DATA` |
