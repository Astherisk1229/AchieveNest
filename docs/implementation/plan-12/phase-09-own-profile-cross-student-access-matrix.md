# PLAN 12 — Phase 9 Own-Profile / Cross-Student Access Matrix
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Ownership & Substitution Matrix

| Scenario / Attack Vector | Payload / Request Parameter | Server Action | Observed Result | Security Status |
|---|---|---|---|---|
| **Valid Own Profile** | Valid Bearer Token of Student A | Resolves `Student A` from session | Returns Student A Profile | **PASS (Authorized)** |
| **IDOR via Query Param** | Bearer A + `?student_id=student-B` | Param ignored; derives from Bearer | Returns Student A Profile | **PASS (Protected)** |
| **IDOR via Route Param** | Bearer A + `/student/profile/student-B`| Param ignored / Not accepted | Returns Student A / 404 | **PASS (Protected)** |
| **IDOR via Body Field** | Bearer A + `{ "student_id": "B" }` | Body ignored on GET endpoint | Returns Student A Profile | **PASS (Protected)** |
| **Unauthenticated Call** | Missing Authorization header | Rejects with 401 Unauthorized | Returns 401 Error Envelope | **PASS (Protected)** |
| **Expired Session Call** | Expired Bearer Token | Rejects with 401 Unauthorized | Returns 401 Error Envelope | **PASS (Protected)** |
