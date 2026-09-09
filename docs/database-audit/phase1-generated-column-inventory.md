# AchieveNest — Phase 1: Generated Column Inventory

> **Database:** `achievenest_local`  

---

| Table Name | Column Name | Generation Expression | Extra / Storage Mode |
|---|---|---|---|
| `dean_assignments` | `active_college_dean_guard` | `(case when (`is_active` = 1) then `college_id` else NULL end)` | VIRTUAL GENERATED |
| `dean_assignments` | `active_personnel_dean_guard` | `(case when (`is_active` = 1) then `personnel_profile_id` else NULL end)` | VIRTUAL GENERATED |
| `organization_moderator_assignments` | `active_org_moderator_guard` | `(case when (`is_active` = 1) then `organization_id` else NULL end)` | VIRTUAL GENERATED |
| `personnel_administrative_unit_affiliations` | `active_personnel_unit_guard` | `(case when (`is_active` = 1) then `personnel_profile_id` else NULL end)` | VIRTUAL GENERATED |
| `personnel_college_affiliations` | `active_personnel_guard` | `(case when (`is_active` = 1) then `personnel_profile_id` else NULL end)` | VIRTUAL GENERATED |
| `profiles` | `active_hr_guard` | `(case when ((`account_type` = _utf8mb4\'hr_admin\') and (`status` = _utf8mb4\'active\')) then `id` else NULL end)` | VIRTUAL GENERATED |
| `program_coordinator_assignments` | `active_program_coord_guard` | `(case when (`is_active` = 1) then `academic_program_id` else NULL end)` | VIRTUAL GENERATED |
| `student_program_enrollments` | `active_student_guard` | `(case when (`is_active` = 1) then `student_profile_id` else NULL end)` | VIRTUAL GENERATED |
