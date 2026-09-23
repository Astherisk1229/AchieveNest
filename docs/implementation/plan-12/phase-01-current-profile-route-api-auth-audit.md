# PLAN 12 — Phase 1 Current Profile Route/API/Auth Audit
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Routing & Authorization Architecture

1. **Frontend Student Profile Routes**:
   - Primary Route: `/student/account` (renders `AccountPage.jsx`)
   - Dashboard: `/student/dashboard` (renders `StudentDashboardPage.jsx`)
2. **Current API Endpoint**:
   - `GET /api/v1/auth/me` returns basic authenticated user details and student placement (`student_program_enrollments`).
   - Plan 12 Phase 2 will establish a dedicated, comprehensive `GET /api/v1/student/profile` endpoint returning all institutional relationships.
3. **Authentication & Authorization**:
   - Enforced by `LayoutShell` with `allowedAccountTypes={['student']}`.
   - Bearer token authentication verified via `AuthenticatedActorService`.
