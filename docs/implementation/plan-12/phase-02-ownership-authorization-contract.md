# PLAN 12 — Phase 2 Ownership & Authorization Contract
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Ownership Enforcement Specifications

### 1.1 Resolution Path
```text
HTTP Request (Header: Authorization: Bearer <token>)
        │
        ▼
AuthenticatedActorService::resolveActor($token)
        │
        ├─► If actor is null -> 401 UNAUTHORIZED
        │
        ├─► If actor.profile.account_type !== 'student' -> 403 FORBIDDEN
        │
        ▼
Resolve student_profile_id = actor.profile.id
```

### 1.2 Security Invariants
- `Client-submitted student_id accepted`: **0 (Strictly Forbidden)**.
- `Cross-student private profile leakage`: **0**.
- `Unauthenticated access`: **Rejected with 401**.
