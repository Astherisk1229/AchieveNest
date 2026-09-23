# Phase 3B — Verifier Authorization Map
## Role Resolution, Program Scoping, and Security Boundary Matrix

**Domain:** Verification Authorization & Access Control  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 22:40:00 UTC+08:00  

---

## 1. Authorized Verifier Roles and Scopes

```text
Authorization Decision Hierarchy:
┌─────────────────────────────────────────────────────────────┐
│ 1. Is user authenticated with a valid active JWT session?   │
│    └─ No  -> HTTP 401 UNAUTHORIZED                          │
│ 2. Is actor the owner of the portfolio record?              │
│    └─ Yes -> HTTP 403 SELF_VERIFICATION_FORBIDDEN           │
│ 3. Does actor hold an authorized verification role?         │
│    ├─ OSAD Staff (osad_staff) -> Global Campus-Wide Scope   │
│    ├─ Program Coordinator     -> Scoped to Assigned Program │
│    └─ Other Account / Role    -> HTTP 403 FORBIDDEN         │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Role-by-Role Authorization Matrix

| Persona / Role | Role Code | Verification Scope | Permitted Actions | Blocked Actions |
|---|---|---|---|---|
| **Student** | `student` | Own records only (view/submit) | `create`, `addEvidence`, `resubmit` | `verify`, `requestRevision`, `reject`, `self-verify` |
| **Program Coordinator** | `program_coordinator` | Students enrolled in assigned academic program(s) | `coordinatorQueue`, `verify`, `requestRevision`, `reject` | Cross-program verification, self-verification |
| **OSAD Staff** | `osad_staff` | All academic programs (Campus-Wide) | Full queue review, `verify`, `requestRevision`, `reject` | Self-verification |
| **College Dean** | `dean` | College oversight / nomination | View college summaries, award nominations | Direct portfolio verification queue |
| **HR Staff** | `hr_staff` | Personnel accomplishments only | HR evaluation domain | Student portfolio verification |
| **Anonymous / Unauthenticated** | `none` | None | None | All endpoints (HTTP 401) |

---

## 3. Server-Side Security Enforcement

- Object-level security is enforced centrally in `AuthorizationService::portfolio()->canVerify($actor, $record)`.
- Self-verification attempts trigger an explicit denial:
  ```json
  {
    "error": {
      "code": "SELF_VERIFICATION_FORBIDDEN",
      "message": "Students cannot verify their own submissions."
    }
  }
  ```
- Unauthorized cross-program verification attempts trigger:
  ```json
  {
    "error": {
      "code": "FORBIDDEN",
      "message": "You are not the authorized active Program Coordinator for this student program."
    }
  }
  ```
