# PLAN 12 — Phase 3 Conflict & Integrity Handling Matrix
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Integrity Guards & Conflict Defense

1. **Unique Active Assignment Enforcement**:
   - `program_coordinator_assignments`: Guarded by `active_program_coord_guard` (generated virtual column or unique partial index on `academic_program_id` where `is_active = 1`).
   - `organization_moderator_assignments`: Guarded by `active_org_moderator_guard` (unique partial index on `organization_id` where `is_active = 1`).
2. **Deterministic Query Limit**:
   - Every active lookup enforces `LIMIT 1` to guarantee deterministic single-object serialization.
3. **Data Integrity Violation Defense**:
   - If an assignment points to a deleted personnel ID, the inner `JOIN profiles p` will safely fail to match, returning `null` with `has_coordinator = false` rather than throwing a SQL exception.
