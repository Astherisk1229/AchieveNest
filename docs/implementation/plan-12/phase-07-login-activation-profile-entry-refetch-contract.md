# PLAN 12 — Phase 7 Login/Activation/Profile-Entry Refetch Contract
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Lifecycle Refetch Rules

1. **Standard Login**:
   - When a student authenticates, the client acquires a fresh token and invokes `GET /api/v1/student/profile` to populate the profile state.
2. **First-Login Credential Change (Plan 07)**:
   - When the student successfully changes their initial temporary password, the `must_change_password` condition flips to `false`.
   - Upon redirect into the authenticated student shell (`/student/dashboard` or `/student/account`), the profile query initializes fresh data from canonical backend tables.
3. **Profile Entry / Refetch**:
   - Navigating to `/student/account` executes the profile query with cached data displayed while refreshing in background where appropriate (`stale-while-revalidate`).
