# PLAN 12 — Phase 3 Active Relationship Resolution Contract
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Executive Summary

This report documents the active relationship resolution algorithms, historical assignment isolation, unique constraints, and lifecycle status filtering under **Plan 12 Phase 3 — Active Relationship Resolution**.

### Key Resolution Highlights
1. **Canonical Active Resolution**:
   - `Program Coordinator`: Resolved strictly via `program_coordinator_assignments` with `is_active = 1` and `profiles.status = 'active'`.
   - `Organization Moderator`: Resolved strictly via `organization_moderator_assignments` with `is_active = 1` and `profiles.status = 'active'`.
2. **Historical Data Isolation**:
   - Historical assignments (`is_active = 0` / `effective_until < NOW()`) remain preserved in database history tables for audit traceability, but are completely filtered out from student contact visibility (`Historical leakage = 0`).
3. **Database Unique Constraints**:
   - `active_program_coord_guard`: Strictly prevents more than 1 active coordinator per program.
   - `active_org_moderator_guard`: Strictly prevents more than 1 active moderator per organization.
4. **Valid Unassigned Semantics**:
   - Unassigned coordinators or moderators resolve cleanly as `null` with `has_coordinator = false` / `has_moderator = false`, eliminating 500 errors and false broken states.

---

# 2. Phase 3 Resolution Matrix

```text
========================================================================
PLAN 12 — PHASE 3 ACTIVE RELATIONSHIP RESOLUTION
========================================================================
Active Coordinator Resolution: PASS (pca.is_active = 1 AND p.status = 'active')
Active Moderator Resolution: PASS (oma.is_active = 1 AND p.status = 'active')
Historical Assignment Leakage: 0 (Strictly isolated)
Unassigned Relationship Handling: PASS (Valid null state)
Multiple Active Conflict Handling: PASS (Guarded by DB Unique Constraints)
========================================================================
```
