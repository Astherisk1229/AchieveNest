# AchieveNest — Phase E: Identity 3NF Assessment Matrix

> **Standard:** Codd's Normalization Standard (1NF, 2NF, 3NF)  

---

| Table | 1NF | 2NF | 3NF | Derived / Cache Attributes | 3NF Assessment & Decision |
|---|:---:|:---:|:---:|---|---|
| `profiles` | **PASS** | **PASS** | **PASS** | `full_name` (Search Cache) | **PASS** (Justified derived display cache; all non-key attributes depend on `id`) |
| `student_profiles` | **PASS** | **PASS** | **PASS** | `year_level` (Active Cache) | **PASS** (Justified active enrollment cache; historical source in enrollments) |
| `personnel_profiles` | **PASS** | **PASS** | **PASS** | None | **PASS** (Pure 3NF subtype extension) |
| `profile_roles` | **PASS** | **PASS** | **PASS** | None | **PASS** (Pure 3NF junction table) |
| `roles` | **PASS** | **PASS** | **PASS** | None | **PASS** (Pure 3NF lookup catalog) |
| `local_auth_credentials` | **PASS** | **PASS** | **PASS** | None | **PASS** (1:0..1 Auth credential table) |
| `local_auth_sessions` | **PASS** | **PASS** | **PASS** | None | **PASS** (Session lifecycle entity) |
| `password_reset_requests` | **PASS** | **PASS** | **PASS** | None | **PASS** (Workflow entity) |
