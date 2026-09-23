# PLAN 10 — Phase 1 Canonical Field Source Map
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Field-to-Source Mapping

| Displayed Field | API JSON Key | Database Column | Master Entity | Transformation / Formatting |
|---|---|---|---|---|
| **Student Name** | `full_name`, `first_name`, `last_name` | `profiles.first_name`, `profiles.last_name` | `profiles` | `formatLastNameFirst(full_name)` |
| **Student ID** | `student_id`, `institutional_id` | `profiles.institutional_id` | `profiles` | Mono text |
| **Email** | `email` | `profiles.email` | `profiles` | Plaintext |
| **Sex** | `sex` | `profiles.sex` | `profiles` | `formatStudentSexDisplay(sex, '—')` |
| **College Code** | `college`, `college_code` | `colleges.code` | `colleges` | Uppercase badge text |
| **College Color** | `college_color` *(Missing in API)* | `colleges.acronym_badge_color` | `colleges` | Hex color code (`#RRGGBB`) with fallback `#16834A` |
| **Academic Program** | `program`, `program_name`, `program_code` | `academic_programs.name` | `academic_programs` | Plaintext |
| **Year Level** | `year_level` | `student_profiles.year_level` | `student_profiles` | Canonical string |
| **Enrollment Status** | `enrollment_status` | `student_profiles.enrollment_status` | `student_profiles` | Capitalized badge text |
| **Account Status** | `status` | `profiles.status` | `profiles` | Uppercase badge text |
| **Pending First Login** | `must_change_password` | `local_auth_credentials.must_change_password` | `local_auth_credentials` | Amber badge when `must_change_password === 1` |
