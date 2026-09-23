# PLAN 10 — Phase 10 Final Column Dictionary
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Authoritative 4-Column Dictionary

| Column Header | Core Purpose | Primary Display Element | Secondary Display Element | Authoritative Backend Source | Sortable? | Responsive Priority |
|---|---|---|---|---|---|---|
| **Student** | Identity (`Who?`) | Full Name (Bold text) | Institutional ID (Mono font) | `profiles.first_name`, `profiles.last_name`, `profiles.institutional_id` | **Yes (Name / ID)** | **Highest (All Viewports)** |
| **Academic Placement** | Academic Unit (`Where?`) | Program Name (`BS Computer Science`) | Year Level (`3rd Year`) + College Badge (`[CEAC]`) | `academic_programs.name`, `student_profiles.year_level`, `colleges.code`, `colleges.acronym_badge_color` | **No** | **Highest (All Viewports)** |
| **Account Status** | Access Usability (`Can use?`) | Status Pill (`ACTIVE`, `LOCKED`, etc.) | Sub-badge (`Pending First Login`) | `profiles.status`, `local_auth_credentials.must_change_password` | **No** | **Highest (All Viewports)** |
| **Actions** | Management (`What action?`) | "View Details" (Inline Button) | Overflow Menu (`⋯`) | Action handlers (`setViewingStudent`, `setResetPasswordStudent`) | **No** | **Highest (All Viewports)** |
