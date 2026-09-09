# PLAN 11 — Phase 3 Role & Redirect Stability Matrix
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. Role Transition & Redirect Stability

| Trigger Action | Source State | Destination State | Shell Reused? | Navigation Recomputed? | Reload Required? |
|---|---|---|---|---|---|
| **Personnel Role Switch** | `program_coordinator` | `dean` | **YES** | **YES (Instant)** | **NO** |
| **Personnel Role Switch** | `dean` | `osad_staff` (If authorized) | **YES** | **YES (Instant)** | **NO** |
| **Unauthorized URL Access** | User types `/hr/audit-trail` | Redirects to `/osad/dashboard` | **YES** | **YES (Instant)** | **NO** |
| **Password Change Guard** | `must_change_password=1` | Redirects to `/change-password`| Layout bypassed | N/A | **NO** |
| **Unauthenticated Route** | Anonymous user visits `/osad/accounts`| Redirects to `/login` | Unmounted | N/A | **NO** |
