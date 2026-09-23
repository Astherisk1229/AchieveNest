# Phase 3 — Security and Authorization Test Report
## Server-Side Policy Enforcement, Self-Verification Defense, and Tampering Tests

**Domain:** Verification Security & Access Control  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Execution Timestamp:** 2026-08-31 22:40:00 UTC+08:00  
**Overall Security Status:** **ALL GUARDS ACTIVE / PASS**  

---

## 1. Security Attack Vector & Defense Matrix

| Attack Vector / Security Test | Threat Scenario | Expected Server-Side Defense | Test Result |
|---|---|---|:---:|
| **Student Self-Verification** | Submitting student attempts to call `POST /portfolio/{id}/verify` on their own record. | Rejected with HTTP 403 `SELF_VERIFICATION_FORBIDDEN`. No status change. | **PASS** |
| **Unauthorized Personnel** | Personnel without Program Coordinator or OSAD role attempts verification. | Rejected with HTTP 403 `FORBIDDEN`. | **PASS** |
| **Cross-Program Coordinator** | Program Coordinator for BS Information Technology attempts to verify a BS Nursing student's record. | Scoped query blocks record retrieval / update with HTTP 403 `FORBIDDEN`. | **PASS** |
| **Direct Status Payload Tampering** | Client attempts `PUT /portfolio/{id}` sending `{"status": "verified", "verified_by": "attacker"}`. | Update endpoint ignores / strips verifier fields; only `decideRecord` can transition to `verified`. | **PASS** |
| **Unauthenticated Request** | Unauthenticated request sent without Bearer token. | Rejected with HTTP 401 `UNAUTHORIZED`. | **PASS** |
| **Verification Without Evidence** | Verifier attempts to verify a record that has 0 active evidence files. | Blocked with HTTP 422 `MISSING_EVIDENCE_FOR_VERIFICATION`. | **PASS** |
| **Direct Draft Verification** | Verifier attempts to verify an unsubmitted `draft` record. | Blocked with HTTP 422 `INVALID_STATE_TRANSITION`. | **PASS** |

---

## 2. Server Defense Verification Output

```text
========================================================================
AchieveNest — Phase 3: Security & Authorization Test Output
========================================================================
  SEC-001  Student self-verification blocked (HTTP 403)              [PASS]
  SEC-002  Unauthorized personnel verification blocked (HTTP 403)     [PASS]
  SEC-003  Cross-program coordinator verification blocked (HTTP 403)  [PASS]
  SEC-004  Direct verifier field injection blocked                    [PASS]
  SEC-005  Unauthenticated requests rejected (HTTP 401)               [PASS]
  SEC-006  Verification without evidence blocked (HTTP 422)           [PASS]
  SEC-007  Draft state verification transition blocked (HTTP 422)     [PASS]
========================================================================
Security Summary: 7 / 7 Attack Vectors Neutralized
========================================================================
```
