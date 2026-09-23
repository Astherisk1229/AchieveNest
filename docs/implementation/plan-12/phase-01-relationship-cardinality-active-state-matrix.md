# PLAN 12 — Phase 1 Relationship Cardinality & Active-State Matrix
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Cardinality & Active Assignment Constraints

| Relationship Path | Cardinality | Active Constraint Guard | Historical Data Retained? |
|---|---|---|---|
| **Student -> Program Enrollment** | Exactly 1 active per student | `uq_student_program_enrollments_one_active` / `active_student_guard` | **Yes** (`is_active = 0`) |
| **Program -> College** | N programs to 1 College | `academic_programs.college_id` Foreign Key | **No (Structural)** |
| **Program -> Coordinator** | Exactly 1 active coordinator per program | `uq_program_one_active_coordinator` / `active_program_coord_guard` | **Yes** (`effective_until`) |
| **Organization -> Moderator** | Exactly 1 active moderator per organization| `uq_org_moderator_one_active_per_organization` / `active_org_moderator_guard` | **Yes** (`effective_until`) |
| **College -> Dean** | Exactly 1 active dean per college | `uq_dean_one_active_per_college` / `active_college_dean_guard` | **Yes** (`effective_until`) |
