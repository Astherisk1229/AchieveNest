# AchieveNest — Phase 16: Backward Compatibility Architecture Map

> **Scope:** Authoritative register of all backward compatibility mechanisms, aliases, legacy fallbacks, and dormant stubs retained in AchieveNest.  
> **Status:** `PASSED / COMPLETED`  
> **Target Branch:** `audit/project-architecture-linkage`  
> **Starting HEAD:** `f97453d`

---

# 1. Executive Summary

During the architectural transition from legacy mock prototypes and cloud dependencies to the CodeIgniter 4 local-defense platform, six critical compatibility mechanisms were intentionally preserved to ensure zero regressions across legacy bookmarks, institutional role mappings, and test harnesses.

---

# 2. Compatibility Mechanisms Register

| Mechanism ID | Artifact Path | Legacy Input / Route | Canonical Target / Action | Architectural Reason | Runtime Invocation | Preconditions for Future Retirement |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CMP-001** | `frontend/src/App.jsx:266` | Route: `/depsec` | Redirect: `/personnel/dashboard` | Prevents 404 broken links for bookmarks referencing legacy Department Secretary URL | Client browser URL navigation | Major institutional version bump after bookmark deprecation |
| **CMP-002** | `frontend/src/utils/roleContext.js` | Role String: `department_secretary` | Canonical Role: `CANONICAL_ROLES.DEAN` (`'dean'`) | Normalizes legacy database fixtures or external institutional directory sync strings | Client auth parsing and permission checks | Complete purge of legacy role strings from upstream enterprise systems |
| **CMP-003** | `frontend/src/services/authService.js` | Session Field: `user.department_id` | Null-safe Fallback: `department_id: user.department_id || null` | Prevents runtime null-pointer exceptions in legacy components expecting `department_id` | User session restoration on `/auth/me` | Full frontend adoption of College / Academic Program schema |
| **CMP-004** | `frontend/src/pages/osad-admin/OSADAwardCandidateReviewPage.jsx` | Query Param: `?tab=awardees` | Tab State: Candidate Review | Maintains deep-link compatibility for legacy OSAD URLs while strictly enforcing "Candidate" semantics | Client URL query parameter inspection | Deprecation notice communicated to institutional OSAD operators |
| **CMP-005** | `backend/app/Controllers/Api/TargetHRPersonnelController.php` | Route: `POST /api/v1/hr/personnel/{id}/dean-role` | Action: Dean Governance Assignment | Retains Phase 5 provisioning route for HR governance management of College Deans | HR Administrator governance assignments | None — Retained as core HR governance API endpoint |
| **CMP-006** | `backend/app/Services/SupabaseAuthService.php` & `frontend/src/config/supabase.js` | Class / Config: Supabase Auth Clients | Action: Dormant local mock client | Preserves backward import compatibility without making remote network calls (0 cloud calls) | Dormant (0 runtime calls in local defense) | Full cleanup phase specifically targeting Supabase package uninstallation |

---

# 3. Verification & Non-Interference Proof

- All 6 compatibility mechanisms were verified non-interfering in Phase 15 regression testing.
- `/depsec` redirects with 0 errors.
- `department_secretary` maps deterministically to `dean`.
- `?tab=awardees` loads the candidate review state without implying final awardee status.
- Supabase compatibility stubs produce exactly 0 network calls.
