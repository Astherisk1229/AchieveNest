# PLAN 10 — Phase 2 Final Column Dictionary
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Final 4-Column Dictionary

| Column Header | Purpose & Question | Primary Display Element | Secondary Display Element | Source Data | Sortable? | Responsive Priority |
|---|---|---|---|---|---|---|
| **Student** | Identity (`Who is the student?`) | Full Name (Bold text) | Institutional ID (Mono sub-text) | `profiles.first_name`, `profiles.last_name`, `profiles.institutional_id` | **Yes (Name / ID)** | **Highest (All Screens)** |
| **Academic Placement** | Unit (`What academic unit?`) | Academic Program Title | Year Level + College Acronym Pill | `academic_programs.name`, `student_profiles.year_level`, `colleges.code`, `colleges.acronym_badge_color` | **No** | **Highest (All Screens)** |
| **Account Status** | Usability (`Can student use account?`) | Lifecycle Badge (`ACTIVE`, etc.) | Pending First Login (Amber sub-badge) | `profiles.status`, `local_auth_credentials.must_change_password` | **No** | **Highest (All Screens)** |
| **Actions** | Workflow (`What action to take?`) | View Details Button / Click | Overflow Menu (`...`) with Reset PWD | Action handlers | **No** | **Highest (All Screens)** |
