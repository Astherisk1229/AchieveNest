# PLAN 11 — Phase 6 Unauthorized Route & Redirect Audit
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. Guard & Redirect Behavior

| Unauthorized Scenario | Attempted Route | Guard Component | Final Destination | Desktop Sidebar Impact | Unauthorized Data Leak |
|---|---|---|---|---|---|
| Student attempts OSAD | `/osad/accounts` | `LayoutShell` (allowedAccountTypes) | `/student/dashboard` | **Sidebar remains visible** | **0 (None)** |
| OSAD attempts HR Admin | `/hr/personnel-directory` | `LayoutShell` (allowedAccountTypes) | `/osad/dashboard` | **Sidebar remains visible** | **0 (None)** |
| Anonymous User | `/student/portfolio` | `LayoutShell` (Auth check) | `/login` | Unmounts authenticated shell | **0 (None)** |
| Password Reset Required| Any authenticated route | `LayoutShell` (must_change_password) | `/change-password` | Bypasses layout | **0 (None)** |

---

# 2. Key Stability Invariant
- Authorization redirects execute smoothly through React Router `<Navigate to="..." replace />` without triggering full page reloads or unexpected desktop sidebar dismissal.
