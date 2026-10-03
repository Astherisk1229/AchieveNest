# AchieveNest Live MySQL Login Verification Report

Verification date: 2026-09-11
Environment: `development`
Active database: local MySQL database `achievenest_local` on `127.0.0.1:3306`
Credential, token, and secret values: omitted

## Executive Result

All four affected personnel accounts are structurally login-ready and passed authorized end-to-end authentication. No account repair, password reset, role repair, identity merge, or seeder rerun was required.

| Account | Profile | Personnel subtype | Credential | Base role | Governance | `/auth/login` | `/auth/me` | Readiness |
|---|---|---|---|---|---|---|---|---|
| Arthur Pendelton | PASS | PASS | PASS | PASS | Dean PASS | PASS | PASS | `READY` |
| Cynthia Ramos | PASS | PASS | PASS | PASS | Coordinator PASS | PASS | PASS | `READY` |
| David Villanueva | PASS | PASS | PASS | PASS | Moderator PASS | PASS | PASS | `READY` |
| Demo Coordinator A | PASS | PASS | PASS | PASS | Coordinator PASS | PASS | PASS | `READY` |

## Identity Resolution

The live database contains only the canonical seeded IDs:

| Account | Profile UUID | Live employee ID | Supplied visible ID result | Classification |
|---|---|---|---|---|
| Arthur | `10000000-0000-0000-0000-000000000008` | `9000000008` | `900000008` not found | `SEEDER_VERSION_DIFFERENCE` / display transcription mismatch |
| Cynthia | `10000000-0000-0000-0000-000000000009` | `9000000009` | `900000009` not found | `SEEDER_VERSION_DIFFERENCE` / display transcription mismatch |
| David | `10000000-0000-0000-0000-000000000010` | `9000000011` | `900000011` not found | `SEEDER_VERSION_DIFFERENCE` / display transcription mismatch |
| Demo Coordinator A | `d0000000-0000-0000-0001-000000000008` | `2026-DEMO-008` | Exact match | Canonical demo identity |

No duplicate normalized emails or duplicate candidate employee IDs were found. Credential, personnel subtype, role, and governance rows all reference the same profile UUID for each account.

## Per-Account Findings

### Arthur Pendelton

- Email: `dean.cet01@ndmu.edu.ph`
- Profile UUID: `10000000-0000-0000-0000-000000000008`
- Profile / subtype / active status: PASS
- Canonical credential / non-empty hash / active status: PASS
- Base Personnel role: PASS
- Dean assignment: PASS, one active assignment
- `/auth/login`: PASS; token issued
- `/auth/me`: PASS; roles returned: Personnel and Dean
- Expected route: `/personnel/dashboard`
- Login readiness: `READY`
- Safe log finding: two recent `INVALID_PASSWORD` events, including 2026-09-11. This is the confirmed explanation for the reported failed attempt; the account chain itself is healthy.
- Required fix: none. Use the currently authorized credential or the normal HR reset workflow if the user no longer knows it.
- Risk: Low
- Confidence: Confirmed

### Cynthia Ramos

- Email: `coord.bscs01@ndmu.edu.ph`
- Profile UUID: `10000000-0000-0000-0000-000000000009`
- Profile / subtype / credential / base role: PASS
- Program Coordinator assignment: PASS, one active assignment
- `/auth/login`: PASS; token issued
- `/auth/me`: PASS; roles returned: Personnel and Program Coordinator
- Expected route: `/personnel/dashboard`
- Login readiness: `READY`
- Root cause: no account defect reproduced and no relevant safe failure log found.
- Required fix: none
- Risk: Low
- Confidence: Confirmed

### David Villanueva

- Email: `mod.css01@ndmu.edu.ph`
- Profile UUID: `10000000-0000-0000-0000-000000000010`
- Profile / subtype / credential / base role: PASS
- Organization Moderator assignment: PASS, one active assignment
- `/auth/login`: PASS; token issued
- `/auth/me`: PASS; roles returned: Personnel and Organization Moderator
- Expected route: `/personnel/dashboard`
- Login readiness: `READY`
- Root cause: no account defect reproduced and no relevant safe failure log found.
- Required fix: none
- Risk: Low
- Confidence: Confirmed

### Demo Coordinator A (BSA)

- Email: `demo.coordinator.a@ndmu.edu.ph`
- Profile UUID: `d0000000-0000-0000-0001-000000000008`
- Profile / subtype / credential / base role: PASS
- BSA Program Coordinator assignment: PASS, one active assignment
- `/auth/login`: PASS; token issued
- `/auth/me`: PASS; roles returned: Personnel and Program Coordinator
- Expected route: `/personnel/dashboard`
- Login readiness: `READY`
- Root cause: no account defect reproduced.
- Required fix: none
- Risk: Low
- Confidence: Confirmed

## Implemented Login Readiness Contract

`PersonnelLoginReadinessService` now evaluates the active tables and returns only safe diagnostics:

```json
{
  "status": "READY",
  "can_sign_in": true,
  "must_change_password": false,
  "reason_codes": [],
  "governance_contexts": {
    "dean": { "available": true, "assignment_count": 1 }
  },
  "checked_at": "..."
}
```

Base login readiness requires an active Personnel profile, correct account type, active non-empty canonical credential, and active base Personnel role. Governance assignments are reported separately and do not determine base login readiness.

The active HR directory endpoint computes readiness in its main query and does not expose password hashes. The HR table now shows Login Ready, Password Change Required, Login Not Ready, Login Disabled, Account Conflict, or Readiness Unknown independently of the existing profile status badge. The detail drawer includes safe Account Access diagnostics.

## Repair Decision

No repair was applied. The evidence did not justify mutation:

- identities are unambiguous;
- all canonical foreign-key relationships are present;
- credentials and base roles are valid;
- governance assignments resolve;
- all four authorized login tests pass.
