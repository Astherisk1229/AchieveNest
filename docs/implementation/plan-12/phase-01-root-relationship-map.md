# PLAN 12 — Phase 1 Root Relationship Map
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Authoritative Relational Hierarchy

```text
Authenticated Student Session (Bearer Token)
        │
        ▼
   profiles (id, institutional_id, full_name, email, sex, status, avatar_url)
        │
        ├─► student_profiles (profile_id, enrollment_status)
        │
        ├─► student_program_enrollments (is_active = 1, year_level, academic_year)
        │        │
        │        ▼
        │   academic_programs (id, code, name, degree_level)
        │        │
        │        ├─► colleges (id, code, name, acronym_badge_color)
        │        │
        │        └─► program_coordinator_assignments (is_active = 1)
        │                 │
        │                 ▼
        │            personnel_profiles -> profiles (Coordinator Name, Email, Title)
        │
        └─► organization_program_affiliations / organizations (id, code, name, category, scope)
                 │
                 └─► organization_moderator_assignments (is_active = 1)
                          │
                          ▼
                     personnel_profiles -> profiles (Moderator Name, Email, Title)
```
