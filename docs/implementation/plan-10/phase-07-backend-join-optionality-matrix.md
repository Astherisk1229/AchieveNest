# PLAN 10 — Phase 7 Backend Join & Optionality Matrix
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. SQL Join & Optionality Specifications

| Table & Alias | Join Type | Join Predicate | Cardinality | Safety / Optionality Rule |
|---|---|---|---|---|
| `profiles p` | **FROM** | `p.account_type = 'student'` | 1:1 Base | Base student account entity |
| `student_profiles sp` | **INNER JOIN** | `sp.profile_id = p.id` | 1:1 Mandatory | Student profile record |
| `local_auth_credentials lac` | **LEFT JOIN** | `lac.profile_id = p.id` | 1:1 Optional | Accesses `must_change_password` for lifecycle |
| `student_program_enrollments spe` | **LEFT JOIN** | `spe.student_profile_id = sp.profile_id AND spe.is_active = 1` | 1:1 Optional | Active program enrollment (doesn't drop unassigned) |
| `academic_programs ap` | **LEFT JOIN** | `ap.id = spe.academic_program_id` | 1:1 Optional | Academic program title and code |
| `colleges c` | **LEFT JOIN** | `c.id = ap.college_id` | 1:1 Optional | College code and master `acronym_badge_color` |
