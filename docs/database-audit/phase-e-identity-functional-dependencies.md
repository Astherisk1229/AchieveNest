# AchieveNest — Phase E: Identity Functional Dependencies

> **Scope:** Functional Determinants and Transitive Dependencies in Identity Tables  

---

## 1. `profiles` Table Functional Dependencies
- `id -> institutional_id, account_type, email, first_name, middle_name, last_name, full_name, sex, designation_title, avatar_url, status, must_change_password, password_hash, created_at, updated_at`
- Candidate Keys: `institutional_id -> id`, `email -> id`
- **Derived Dependency**: `(first_name, middle_name, last_name) -> full_name` (Documented Justified Denormalization for Search Performance)

## 2. `student_profiles` Table Functional Dependencies
- `profile_id -> enrollment_status, year_level, created_at, updated_at`
- `profile_id` (PK) is simultaneously FK referencing `profiles.id`
- **Derived Dependency**: `year_level` is functionally determined by active `student_program_enrollments` instance.

## 3. `personnel_profiles` Table Functional Dependencies
- `profile_id -> personnel_classification, employment_status, rank_level, created_at, updated_at`
- Fully atomic, non-transitive dependency directly on `profile_id`.

## 4. `profile_roles` Table Functional Dependencies
- `(profile_id, role_id) -> assigned_by, assigned_at`
- Fully dependent on composite key `(profile_id, role_id)`.
