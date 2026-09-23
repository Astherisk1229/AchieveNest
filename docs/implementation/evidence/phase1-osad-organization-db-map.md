# Plan 02 Phase 1 Evidence: Database Schema & Relational Constraint Map

## Execution Timestamp
2026-09-01T11:43:30+08:00
Database: `achievenest_local`

---

## 1. Table Definitions & Constraints

### 1.1 `organizations`
- `id`: char(36) PK
- `college_id`: char(36) NULL, FK -> `colleges.id` (ON DELETE RESTRICT)
- `code`: varchar(30) UNIQUE NOT NULL
- `name`: varchar(150) NOT NULL
- `scope`: varchar(30) NOT NULL (CHECK: `university`, `college`, `program`)
- `category`: varchar(50) NOT NULL (CHECK: `academic_college`, `co_curricular`, `special_interest`, `socio_cultural`, `religious`, `sports`, `student_council`)
- `status`: varchar(20) NOT NULL DEFAULT 'active' (CHECK: `active`, `inactive`, `archived`)
- `logo_storage_key`: varchar(500) NULL
- `logo_original_name`: varchar(255) NULL
- `logo_mime_type`: varchar(100) NULL
- `logo_updated_at`: datetime(6) NULL
- `created_at`: datetime(6) NOT NULL
- `updated_at`: datetime(6) NOT NULL

### 1.2 `organization_program_affiliations`
- `id`: char(36) PK
- `organization_id`: char(36) NOT NULL, FK -> `organizations.id` (ON DELETE CASCADE)
- `academic_program_id`: char(36) NOT NULL, FK -> `academic_programs.id` (ON DELETE RESTRICT)
- `created_at`: datetime(6) NOT NULL
- `UNIQUE KEY uq_org_program (organization_id, academic_program_id)`

### 1.3 `organization_moderator_assignments`
- `id`: char(36) PK
- `organization_id`: char(36) NOT NULL, FK -> `organizations.id` (ON DELETE CASCADE)
- `personnel_profile_id`: char(36) NOT NULL, FK -> `profiles.id` (ON DELETE CASCADE)
- `effective_from`: date NOT NULL
- `effective_until`: date NULL
- `is_active`: tinyint(1) NOT NULL DEFAULT '1'
- `assigned_by`: char(36) NULL, FK -> `profiles.id` (ON DELETE SET NULL)
- `assigned_at`: datetime(6) NOT NULL
- `created_at`: datetime(6) NOT NULL
- `updated_at`: datetime(6) NOT NULL
- `active_org_moderator_guard`: char(36) GENERATED ALWAYS AS (case when (`is_active` = 1) then `organization_id` else NULL end) VIRTUAL
- `UNIQUE KEY uq_active_org_moderator (active_org_moderator_guard)`

---

## 2. Cardinality Analysis
- **Organization to Program Scope**: 1:N (one organization can affiliate with multiple academic programs).
- **Program to Organization**: 1:N (multiple organizations can affiliate with the same academic program).
- **Organization to Active Moderator**: N:1 (at most one active moderator per organization, enforced by `uq_active_org_moderator`).
- **Moderator to Organizations**: 1:N (one personnel member may serve as moderator for multiple organizations).
- **Moderator Tenure History**: Soft deactivation (`is_active = 0`, `effective_until = CURRENT_DATE`) permanently retains historical assignments.
