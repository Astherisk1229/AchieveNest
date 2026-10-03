# PLAN 12 — Phase 6 Privacy & Authorization Diagnostic Audit
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Authorization Boundary & Data Isolation

1. **Student Boundary Defense**:
   - Students querying `GET /api/v1/student/profile` receive strictly the sanitized `data` object with boolean flags (`has_program`, `has_moderator`, etc.).
   - Diagnostic trace payloads, SQL error details, and database key dumps are completely omitted (`Student access to diagnostics = 0`).
2. **Admin Diagnostic Security**:
   - Administrative diagnostic views require `osad_admin` or `admin` account types.
   - Password hashes, session tokens, and private HR evaluations are excluded from all diagnostic payloads (`Sensitive credentials = 0`).
