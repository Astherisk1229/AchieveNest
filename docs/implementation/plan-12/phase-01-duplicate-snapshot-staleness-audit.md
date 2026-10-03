# PLAN 12 — Phase 1 Duplicate Snapshot & Staleness Audit
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Snapshot Fields & Staleness Evaluation

1. **Legacy Snapshot Fields Identified**:
   - `profiles.degree_program_id` / `profiles.department_id`: Deprecated legacy columns superseded by `student_program_enrollments`.
   - `profiles.year_level`: Deprecated column on `profiles` table; canonical source is `student_program_enrollments.year_level`.
2. **Staleness Risk Resolution**:
   - The authoritative student profile queries must always join against `student_program_enrollments` (`WHERE is_active = 1`), `academic_programs`, `colleges`, `program_coordinator_assignments`, and `organization_moderator_assignments` dynamically to prevent stale cached text.
