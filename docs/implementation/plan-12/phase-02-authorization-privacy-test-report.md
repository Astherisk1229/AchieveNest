# PLAN 12 — Phase 2 Authorization & Privacy Test Report
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Verification Test Matrix

| Test Case | Scenario / Assertion | Expected Result | Observed Result | Verdict |
|---|---|---|---|---|
| **Session Ownership** | Derives student from auth session | Session ID matches | Verified | **PASS** |
| **Client ID Tampering** | Client supplies other student's ID | Ignored; returns own profile | Verified | **PASS** |
| **Unauthenticated Request**| No Bearer token provided | 401 Unauthorized | Verified | **PASS** |
| **Credential Exclusion** | Payload scanned for passwords/tokens | 0 matches | 0 Matches | **PASS** |
| **Personnel Privacy** | Payload scanned for personal phone/address| 0 matches | 0 Matches | **PASS** |
| **Master College Color**| Asserts `acronym_badge_color` returned | Matches DB master color | Verified | **PASS** |
| **Unassigned Nullability** | Student with no organization/moderator | `null` with availability `false` | Verified | **PASS** |
