# PLAN 12 — Phase 7 Partial-Upstream-Failure Contract
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Partial Upstream Failure Presentation

1. **Identity Preservation**:
   - If base student identity resolves successfully from `profiles` and `student_program_enrollments`, the UI renders the Profile Header and Academic Information immediately.
2. **Sub-Relationship Isolation**:
   - If an individual join (e.g. `organization_moderator_assignments` or `program_coordinator_assignments`) fails due to a transient database error, that specific card displays `TEMPORARILY_UNAVAILABLE` rather than crashing the page or misrepresenting the role as "not assigned".
3. **Targeted Non-Destructive Retry**:
   - The user can trigger a retry that refetches the profile without losing existing client state.
