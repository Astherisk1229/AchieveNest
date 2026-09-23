# Phase 2 — OSAD Student Account Field Source Matrix
**Plan 03 Field-to-Source Mapping & Projection Specification**

---

### 1. Authoritative Field Ownership & Projection Mapping

| Table Column Header | Canonical API Key | Authoritative DB Source Table & Column | Justified Cache / Fallback Source | Data Type | Nullable / Empty Rule | Searchable / Filterable |
|---|---|---|---|---|---|---|
| Student ID | `institutional_id` | `profiles.institutional_id` | N/A | `string (varchar 50)` | NOT NULL | Searchable (Exact / Substring) |
| Student Name | `full_name` | `profiles.full_name` | `profiles.first_name + profiles.last_name` | `string (varchar 255)` | NOT NULL | Searchable (Last Name First) |
| Email | `email` | `profiles.email` | N/A | `string (varchar 255)` | NOT NULL (`@ndmu.edu.ph`) | Searchable |
| Sex | `sex` | `profiles.sex` (*Target Schema*) | `null` (*Until Phase 5 DB Remediation*) | `string (varchar 10)` | NULLABLE (`—`) | Filterable (Once Remediated) |
| College | `college_code` | `colleges.code` | Joined via `academic_programs.college_id` | `string (varchar 20)` | NULLABLE (`—`) | Filterable (Dropdown) |
| Academic Program | `program` / `academic_program` | `academic_programs.name` | Joined via active `student_program_enrollments` | `string (varchar 255)` | `No active enrollment` | Searchable & Filterable |
| Year Level | `year_level` | `student_program_enrollments.year_level` (*Historical*) | `student_profiles.year_level` (*Current Cache*) | `string (varchar 20)` | `—` | Filterable |
| Enrollment Status | `enrollment_status` | `student_profiles.enrollment_status` | N/A | `string (varchar 30)` | `unassigned` | Filterable |
| Account Status | `account_status` / `status` | `profiles.status` | N/A | `string (varchar 20)` | NOT NULL (`active`) | Filterable |
| Actions | N/A | UI action handlers | N/A | Component | N/A | N/A |

---

### 2. Normalized API Row Projection Schema

```json
{
  "id": "01214801-9565-4224-a46d-3b6c7a3665d0",
  "institutional_id": "202310492",
  "full_name": "Juan Dela Cruz",
  "email": "juan.delacruz@ndmu.edu.ph",
  "sex": null,
  "college": "CEAC",
  "college_id": "col-ceac",
  "program": "BS Computer Science",
  "academic_program_id": "30000000-0000-0000-0000-000000000001",
  "year_level": "3rd Year",
  "enrollment_status": "enrolled",
  "status": "active"
}
```
