# PLAN 09 — Phase 3 Schema & Relationship Matrix
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Schema Definition Matrix

| Table Name | Primary Key | Foreign Key Columns | Target Parent Table | Multiplicity | On Delete / Update |
|---|---|---|---|---|---|
| `profiles` | `id` (UUID) | None | N/A | Root Entity | N/A |
| `student_profiles` | `profile_id` (UUID) | `profile_id` | `profiles.id` | 1:1 | CASCADE / CASCADE |
| `student_program_enrollments` | `id` (UUID) | `student_profile_id`<br>`academic_program_id` | `profiles.id`<br>`academic_programs.id` | N:1<br>N:1 | RESTRICT / CASCADE<br>RESTRICT / CASCADE |
| `profile_roles` | `id` (UUID) | `profile_id`<br>`role_id`<br>`assigned_by` | `profiles.id`<br>`roles.id`<br>`profiles.id` | N:1<br>N:1<br>N:1 | CASCADE / CASCADE<br>RESTRICT / CASCADE<br>SET NULL / CASCADE |
| `local_auth_credentials` | `profile_id` (UUID) | `profile_id` | `profiles.id` | 1:1 | CASCADE / CASCADE |
| `academic_programs` | `id` (UUID) | `college_id` | `colleges.id` | N:1 | RESTRICT / CASCADE |
| `colleges` | `id` (UUID) | None | N/A | Root Reference | N/A |
| `roles` | `id` (UUID) | None | N/A | Catalog Reference | N/A |
| `account_lifecycle_events` | `id` (UUID) | `profile_id`<br>`actor_profile_id` | `profiles.id`<br>`profiles.id` | N:1<br>N:1 | CASCADE / CASCADE<br>SET NULL / CASCADE |
| `audit_logs` | `id` (UUID) | `actor_profile_id` | `profiles.id` | N:1 | SET NULL / CASCADE |

---

# 2. Required vs. Optional Relationship Classification

| Relationship Path | Required for Creation? | Required for Listing? | Optional / Nullable? | Join Type in Listing Query | Rationale |
|---|---|---|---|---|---|
| `profiles` ↔ `student_profiles` | **YES** | **YES** | **NO** | `INNER JOIN` | Defines the student identity extension. Non-students are excluded. |
| `profiles` ↔ `local_auth_credentials` | **YES** | **YES** | **NO** | `LEFT JOIN` | Provides `must_change_password` first-login gate state. |
| `student_profiles` ↔ `student_program_enrollments` | **YES** | **YES** | **NO** (Active placement required) | `LEFT JOIN` with `is_active = 1` | Associates student with degree program. `LEFT JOIN` avoids dropping legacy unplaced accounts. |
| `student_program_enrollments` ↔ `academic_programs` | **YES** | **YES** | **NO** | `LEFT JOIN` | Provides program code and title. |
| `academic_programs` ↔ `colleges` | **YES** | **YES** | **NO** | `LEFT JOIN` | Provides college code and title. |
| `profiles` ↔ `profile_roles` | **YES** | **NO** (Implicit via `account_type='student'`) | **NO** | Omitted from list select | Role is verified during authorization, not joined in row projection. |
| `profiles` ↔ `organizations` | **NO** | **NO** | **YES** | Omitted | Extra-curricular organization affiliation is independent of academic roster. |
| `profiles` ↔ `program_coordinator_assignments` | **NO** | **NO** | **YES** | Omitted | Coordinators manage programs, not individual student accounts directly. |

---

# 3. Relational Entity Diagram

```text
+----------------------------+
|         colleges           |
+-------------+--------------+
              | 1
              | has many
              | N
+-------------v--------------+
|     academic_programs      |
+-------------+--------------+
              | 1
              | has many
              | N
+-------------v--------------+       1:1         +----------------------------+
|student_program_enrollments +------------------->|      student_profiles      |
+----------------------------+                   +-------------+--------------+
                                                               | 1:1
                                                               | extends
                                                               | 1
+----------------------------+       1:1         +-------------v--------------+
|   local_auth_credentials   |<------------------+          profiles          |
+----------------------------+                   +-------------+--------------+
                                                               | 1
                                                               | has many
                                                               | N
+----------------------------+       N:1         +-------------v--------------+
|           roles            |<------------------+       profile_roles        |
+----------------------------+                   +----------------------------+
```
