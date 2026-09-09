# PLAN 10 — Phase 3 College Color API & Mapping Contract
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. API Response Envelope

The canonical `GET /api/v1/osad/students` endpoint emits `college_color` directly within each student object:

```json
{
  "status": "success",
  "data": {
    "students": [
      {
        "id": "student-uuid-001",
        "institutional_id": "2026315391",
        "full_name": "Sean Asther Faderes",
        "college": "CEAC",
        "college_name": "College of Engineering, Architecture, and Computing",
        "college_color": "#371683",
        "program": "BS Computer Science",
        "program_code": "BSCS",
        "year_level": "3rd Year",
        "status": "active",
        "must_change_password": true
      }
    ]
  }
}
```

---

# 2. Database Projection Query

```sql
SELECT 
    p.id,
    p.institutional_id,
    p.full_name,
    c.id AS college_id,
    c.code AS college_code,
    c.name AS college_name,
    c.acronym_badge_color AS college_color
FROM profiles p
JOIN student_profiles sp ON sp.profile_id = p.id
LEFT JOIN student_program_enrollments spe ON spe.student_profile_id = sp.profile_id AND spe.is_active = 1
LEFT JOIN academic_programs ap ON ap.id = spe.academic_program_id
LEFT JOIN colleges c ON c.id = ap.college_id
WHERE p.account_type = 'student';
```
