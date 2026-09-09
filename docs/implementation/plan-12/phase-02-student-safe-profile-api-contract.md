# PLAN 12 — Phase 2 Student-Safe Profile API Contract
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Executive Summary

This document specifies the normalized, student-safe profile endpoint `GET /api/v1/student/profile` established under **Plan 12 Phase 2 — Student-Safe Profile API Contract**.

### Key Contract Highlights
1. **Server-Side Session Ownership**:
   - The profile owner is derived strictly from the authenticated student session token (`Bearer <token>`).
   - `Client-submitted student ID used for ownership`: **0**.
2. **Normalized Response Envelope**:
   - The response payload delivers 8 distinct logical sections: `identity`, `academic`, `college`, `organization`, `moderator`, `coordinator`, `account`, and `availability`.
3. **Master-Data College Color**:
   - College color is sourced dynamically from `colleges.acronym_badge_color`. `Hard-coded color mappings`: **0**.
4. **Strict Field Minimization & Privacy**:
   - Prohibited private fields (`password_hash`, personal phone, home address, HR evaluation records) are strictly excluded.
5. **Deterministic Availability Semantics**:
   - Unassigned relationships return explicit `null` with corresponding boolean indicators (`has_organization = false`, `has_moderator = false`, `has_coordinator = false`).

---

# 2. Endpoint Specification

```http
GET /api/v1/student/profile
Authorization: Bearer <access_token>
```

### Response Payload Schema (`200 OK`)
```json
{
  "data": {
    "identity": {
      "student_id": "2024-01234",
      "full_name": "Maria Clara Santos",
      "first_name": "Maria Clara",
      "last_name": "Santos",
      "middle_name": null,
      "sex": "Female",
      "institutional_email": "maria.santos@ndmu.edu.ph",
      "avatar_url": null
    },
    "academic": {
      "program_id": "4e1a0b5a-...",
      "program_code": "BSCS",
      "program_name": "Bachelor of Science in Computer Science",
      "degree_level": "Undergraduate",
      "year_level": "3rd Year",
      "academic_year": "2025-2026"
    },
    "college": {
      "college_id": "7b8c9d0e-...",
      "college_code": "CITE",
      "college_name": "College of Information Technology Education",
      "acronym_badge_color": "#15803d"
    },
    "organization": {
      "organization_id": "9f8e7d6c-...",
      "organization_code": "JPCS",
      "organization_name": "Junior Philippine Computer Society",
      "scope": "college",
      "category": "academic_college",
      "logo_storage_key": null
    },
    "moderator": {
      "full_name": "Prof. Juan Luna",
      "institutional_email": "juan.luna@ndmu.edu.ph",
      "designation_title": "Organization Moderator",
      "avatar_url": null
    },
    "coordinator": {
      "full_name": "Dr. Jose Rizal",
      "institutional_email": "jose.rizal@ndmu.edu.ph",
      "designation_title": "Program Coordinator",
      "avatar_url": null
    },
    "account": {
      "status": "active",
      "account_type": "student",
      "created_at": "2026-08-27T00:00:00Z"
    },
    "availability": {
      "has_program": true,
      "has_college": true,
      "has_coordinator": true,
      "has_organization": true,
      "has_moderator": true
    }
  }
}
```
