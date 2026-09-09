# AchieveNest — Phase F: Duplicate Attribute Classification Report

> **Database:** `achievenest_local`  

---

| Attribute / Domain | Location(s) | Semantic Classification | Authoritative Source | Justification & Policy |
|---|---|---|---|---|
| `sex` | `profiles.sex` | **AUTHORITATIVE** | `profiles.sex` | Sole authoritative source for all award sex eligibility gates. Zero duplicate columns in subtype tables. |
| `full_name` | `profiles.full_name` | **DERIVED_CACHE** | `first_name`, `middle_name`, `last_name` | Concatenated display name maintained for high-performance indexing and fast UI search. |
| `year_level` (Historical) | `student_program_enrollments.year_level` | **AUTHORITATIVE** | `student_program_enrollments` | Immutable record of student year level during a specific academic enrollment term. |
| `year_level` (Current) | `student_profiles.year_level` | **DERIVED_CACHE** | `student_program_enrollments.year_level` | Current active term year level cached on profile to prevent deep enrollment joins. |
| `designation_title` | `profiles.designation_title` | **AUTHORITATIVE** | `profiles.designation_title` | Shared display attribute across all institutional portals. |
| `password_hash` | `profiles.password_hash` | **AUTHORITATIVE** | `profiles.password_hash` | Active primary password hash for application authentication. |
