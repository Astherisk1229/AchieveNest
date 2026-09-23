# PLAN 09 — Phase 4 API Response Mapping Reference
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Authoritative Response Schema

The canonical listing endpoint `GET /api/v1/osad/students` emits the following JSON structure:

```json
{
  "data": {
    "students": [
      {
        "id": "e8d4bde1-a83a-4d87-928d-006f78ee6efd",
        "institutional_id": "2026315391",
        "student_id": "2026315391",
        "full_name": "Juan Dela Cruz",
        "first_name": "Juan",
        "middle_name": "Protacio",
        "last_name": "Dela Cruz",
        "email": "juan.delacruz@ndmu.edu.ph",
        "sex": "Male",
        "college": "CET",
        "college_id": "20000000-0000-0000-0000-000000000001",
        "college_name": "College of Engineering and Technology",
        "program": "Bachelor of Science in Computer Science",
        "program_code": "BSCS",
        "academic_program_id": "30000000-0000-0000-0000-000000000001",
        "year_level": "1st Year",
        "enrollment_status": "enrolled",
        "status": "active",
        "administrative_status": "active",
        "account_lifecycle_status": "pending_first_login",
        "credential_integrity_status": "valid",
        "must_change_password": true,
        "required_next_action": "change_password"
      }
    ]
  }
}
```

---

# 2. Key Mapping Rules for Frontend Consumption (Phase 5 Input)

| Field Name | Type | Value Format | Fallback Behavior |
|---|---|---|---|
| `id` | String (UUID) | Canonical profile ID | Mandatory; used as React key |
| `institutional_id` | String | Digits | Fallback to `student_id` if present |
| `student_id` | String | Digits | Alias for `institutional_id` |
| `full_name` | String | Standard display name | Computed server-side |
| `email` | String | `@ndmu.edu.ph` | Mandatory |
| `sex` | String / Null | `"Male"` \| `"Female"` \| `"Prefer not to say"` \| `null` | Display as `"Not specified"` if `null` |
| `college` | String / Null | College short code (e.g. `"CET"`) | Display as `"Unassigned"` if null |
| `program` | String / Null | Degree program title | Display as `"Unassigned"` if null |
| `year_level` | String / Null | `"1st Year"` to `"5th Year"` | Display as `"Unassigned"` if null |
| `status` | String | `"active"` \| `"suspended"` \| `"archived"` | Drives status badge |
| `must_change_password` | Boolean | `true` \| `false` | Drives pending credential warning badge |
