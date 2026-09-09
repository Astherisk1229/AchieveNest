# PLAN 10 — Phase 10 Canonical API & Mapping Contract
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Endpoint & Envelope Specifications

- **Route**: `GET /api/v1/osad/students`
- **Method**: `TargetProvisioningController::listStudents`
- **Envelope**:
```json
{
  "status": "success",
  "data": {
    "students": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "institutional_id": "2026315391",
        "student_id": "2026315391",
        "full_name": "Sean Asther Faderes",
        "email": "s.faderes.2026315391@ndmu.edu.ph",
        "sex": "Male",
        "college": "CEAC",
        "college_id": "5f427d0d-284d-438c-8a59-a04abec04de9",
        "college_name": "College of Engineering, Architecture, and Computing",
        "college_color": "#371683",
        "program": "BS Computer Science",
        "program_code": "BSCS",
        "academic_program_id": "8f8b0569-fa38-4e89-9372-6804a11f2a33",
        "year_level": "3rd Year",
        "enrollment_status": "enrolled",
        "status": "active",
        "administrative_status": "active",
        "account_lifecycle_status": "active",
        "must_change_password": true
      }
    ],
    "total": 103,
    "page": 1,
    "limit": 50
  }
}
```

---

# 2. Security & Zero-Leak Guarantee
- **Selected Columns**: 21 non-sensitive attributes.
- **Plaintext Passwords**: `0`
- **Password Hashes**: `0`
- **Session Tokens**: `0`
