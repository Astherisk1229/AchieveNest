# PLAN 12 — Phase 10 Authoritative Update/Refresh Verification
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Authoritative Update & Cache Invalidation

1. **Program Reassignment by OSAD**:
   - Updates `student_program_enrollments` (`is_active = 0` on old, `is_active = 1` on new).
   - On the student's next profile fetch, the API resolves the new Academic Program, the new College acronym/color, and the new Program Coordinator.
   - `Stale old program / college / coordinator display`: **0**.
2. **Organization / Moderator Reassignment by OSAD**:
   - Updates `organization_moderator_assignments` (`is_active = 0` on old, `is_active = 1` on new).
   - On the student's next profile fetch, the API resolves the new Organization and the new active Moderator.
   - `Stale old organization / moderator display`: **0**.
