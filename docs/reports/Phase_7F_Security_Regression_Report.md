# Phase 7F — Security Regression Report
## Final Security Boundary Verification, Role Isolation, and Tampering Tests

**Domain:** Final Security Regression  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Execution Timestamp:** 2026-08-31 23:05:00 UTC+08:00  
**Overall Status:** **ALL SECURITY BOUNDARIES VERIFIED / PASS**  

---

## 1. Security Regression Matrix

| Test ID | Threat Vector / Boundary | Test Action | Expected Result | Result |
|---|---|---|---|:---:|
| **SEC-7.1** | Student Report Access | Student calls `GET /api/v1/awards/campus-journalism/candidates`. | Blocked with HTTP 403 `FORBIDDEN`. | **PASS** |
| **SEC-7.2** | Cross-Program Leakage | Coordinator calls export specifying out-of-scope program. | Blocked / Scoped automatically to authorized program. | **PASS** |
| **SEC-7.3** | Snapshot Score Tampering | Attacker attempts `PUT /evaluations/{id}` with modified scores. | Rejected; snapshot scores are read-only. | **PASS** |
| **SEC-7.4** | Self-Verification Tampering | Student attempts calling verify on own achievement. | Blocked with HTTP 403 `SELF_VERIFICATION_FORBIDDEN`. | **PASS** |
| **SEC-7.5** | Unauthenticated Access | Request without Bearer JWT token. | Blocked with HTTP 401 `UNAUTHORIZED`. | **PASS** |
| **SEC-7.6** | Locked Cycle Bypass | Coordinator attempts to regenerate locked candidate batch. | Blocked with HTTP 422 `CYCLE_LOCKED`. | **PASS** |
