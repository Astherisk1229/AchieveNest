# AchieveNest Plan 07 — Phase 6 Evidence
# Frontend Lifecycle Routing & Gate Contract

---

## 1. Route Gate State Transitions

| User Lifecycle State | Attempted Route | Route Gate Action | Resulting View |
| :--- | :--- | :--- | :--- |
| `pending_first_login` (`must_change_password: true`) | `/student/dashboard` | History Replace Redirect | `/change-password` |
| `pending_first_login` (`must_change_password: true`) | `/personnel/portfolio` | History Replace Redirect | `/change-password` |
| `pending_first_login` (`must_change_password: true`) | `/change-password` | Allow | `ChangePasswordPage` |
| `active` (`must_change_password: false`) | `/student/dashboard` | Allow | Student Dashboard |
| `active` (`must_change_password: false`) | `/change-password` | Redirect to Canonical Landing | Student/Personnel Dashboard |

---

## 2. API 403 `PASSWORD_CHANGE_REQUIRED` Interceptor

When any background query receives HTTP 403 with `PASSWORD_CHANGE_REQUIRED`, `apiClient.js` updates the in-memory/stored session state and dispatches a storage event, cleanly trapping the frontend without unhandled exceptions or redirect loops.
