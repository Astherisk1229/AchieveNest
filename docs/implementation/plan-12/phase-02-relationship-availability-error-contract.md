# PLAN 12 — Phase 2 Relationship Availability & Error Contract
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Availability Semantics & Partial Relationship Handling

### 1.1 Unassigned States
- **No Program/College Assigned**: `academic: null`, `college: null`, `has_program: false`, `has_college: false`.
- **No Active Coordinator**: `coordinator: null`, `has_coordinator: false`.
- **No Active Organization**: `organization: null`, `has_organization: false`.
- **No Active Moderator**: `moderator: null`, `has_moderator: false`.

### 1.2 Error Responses
- **401 Unauthorized**: Missing or invalid bearer token (`code: "UNAUTHORIZED"`).
- **403 Forbidden**: Authenticated user is not a student (`code: "FORBIDDEN"`).
- **500 Fetch Failed**: Internal database query error (`code: "FETCH_FAILED"`).
