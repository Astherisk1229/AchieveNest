# PLAN 12 — Final Canonical Relationship & Active-Assignment Rules
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Canonical Relational Resolution Paths

1. **Student Ownership**:
   - `Bearer Session Token` -> `profiles.id` where `account_type = 'student'`.
2. **Academic Placement**:
   - `student_program_enrollments` (`WHERE is_active = 1`) -> `academic_programs` -> `colleges`.
3. **College Brand Identity**:
   - `colleges.acronym_badge_color` from master data table.
4. **Program Coordinator**:
   - `program_coordinator_assignments` (`WHERE is_active = 1`) -> `profiles` (`WHERE status = 'active'`).
   - Maximum active coordinators per program: **1** (enforced by `active_program_coord_guard`).
5. **Organization & Moderator**:
   - `organization_program_affiliations` -> `organizations` -> `organization_moderator_assignments` (`WHERE is_active = 1`) -> `profiles` (`WHERE status = 'active'`).
   - Maximum active moderators per organization: **1** (enforced by `active_org_moderator_guard`).
6. **Historical & Inactive Exclusions**:
   - Historical assignments (`is_active = 0`) and suspended/archived personnel (`p.status != 'active'`) are filtered out from current visibility (`Historical/disabled leakage = 0`).
