# PLAN 12 — Final Synchronization & Cache Invalidation Contract
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Synchronization & Query Invalidation Rules

1. **Cache Key Specification**:
   - `['student-profile', userId, role]` strictly scoped by authenticated account ID and role.
2. **Invalidation Matrix**:
   - Any OSAD / Registrar update to Program Enrollments, College linkages, Organizations, Coordinator assignments, Moderator assignments, or Personnel status flags triggers targeted invalidation of the student profile query.
3. **Zero Stale Client Authority**:
   - Client state derives dynamically from the canonical query payload. `Stale client authority snapshots`: **0**.
4. **Context Isolation**:
   - Role switches and account switches cleanly purge/partition cache entries (`Cross-user cache leakage = 0`).
