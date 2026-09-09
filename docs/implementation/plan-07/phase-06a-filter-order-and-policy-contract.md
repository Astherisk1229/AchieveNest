# AchieveNest Plan 07 — Phase 6A Evidence
# Filter Execution Order & Policy Contract

---

## 1. Authentication, Lifecycle & RBAC Filter Pipeline

```text
Incoming HTTP Request
  │
  ├─ 1. CORS Preflight Filter (Allow OPTIONS)
  │
  ├─ 2. Routing Resolution (CodeIgniter Router)
  │
  ├─ 3. RequiredNextActionFilter
  │      ├─ Check Authorization Header
  │      ├─ If Unauthenticated: Pass through to Controller / Auth Filter
  │      ├─ Resolve Authenticated Actor (claims & profile)
  │      ├─ Resolve Canonical Credential & Account Lifecycle
  │      ├─ If can_access_protected_portal = true: Pass through
  │      └─ If pending_first_login (must_change_password = 1):
  │            ├─ Evaluate RestrictedSessionRoutePolicy(matched_alias, uri, method)
  │            ├─ If Exact Match (GET auth.me, POST auth.change_password, POST auth.logout): Allow
  │            └─ Else: Deny immediately with 403 PASSWORD_CHANGE_REQUIRED
  │
  ├─ 4. RBAC / Authorization Filters (Role Verification)
  │
  ▼
Controller Action Execution
```

---

## 2. Invariant Guarantees

- **Lifecycle Overrides RBAC**: A user in `pending_first_login` is stopped at Stage 3 before RBAC filters or controller logic can execute.
- **Fail-Closed Default**: Any unknown route or unapproved HTTP method on an allowed route results in immediate denial.
