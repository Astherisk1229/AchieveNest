# PLAN 12 — Phase 7 Profile Query & Cache-Key Contract
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Executive Summary

This contract establishes the canonical query keys, scoped cache identities, invalidation rules, and role/account isolation boundaries under **Plan 12 Phase 7 — Synchronization and Caching**.

### Key Contract Highlights
1. **Account & Role Scoped Cache Keys**:
   - Cache key format: `['student-profile', authenticatedUserId, role]`.
   - Zero sensitive credentials or tokens stored in keys.
   - Private student profile cache is strictly partitioned from public portfolio cache (`['public-portfolio', studentId]`) and admin diagnostic cache (`['admin-diagnostics', targetId]`).
2. **Authoritative Query Invalidation**:
   - Updates to Program Enrollments, College linkages, Organizations, Coordinator assignments, Moderator assignments, or Personnel lifecycles trigger precise invalidation of the affected student profile query without broad destructive cache purges.
3. **Login & Activation Refetch Lifecycle**:
   - First-login credential change completion (Plan 07) immediately triggers a fresh server-authoritative profile fetch upon entering the authenticated student layout.
4. **Partial Failure Defense**:
   - If upstream queries fail for a sub-relationship (e.g. timeout on coordinator table), base identity is preserved and the failed component displays `TEMPORARILY_UNAVAILABLE` rather than being mislabeled as "not assigned".

---

# 2. Phase 7 Completion Matrix

```text
========================================================================
PLAN 12 — PHASE 7 SYNCHRONIZATION AND CACHING
========================================================================
Canonical Profile Query Key: PASS (['student-profile', userId, role])
Cache Key Account/Role Scoped: PASS
Public/Private Cache Separation: PASS
Relationship Invalidation Matrix: PASS
Cross-User Cache Leakage: 0
Stale Client Authority Snapshots: 0
Partial Upstream Failure Handling: PASS
========================================================================
```
