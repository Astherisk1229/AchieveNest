# PLAN 10 — Phase 1 Current Column Dictionary
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Current Table Column Inventory (10 Columns)

| Column Header | Cell Content Description | Source Field(s) | Width (approx) | Sortable? | Filterable? | Primary OSAD Question Answered | Preliminary Recommendation |
|---|---|---|---:|---|---|---|---|
| **Name** | Full Name formatted `Last, First` | `p.full_name` / `p.first_name`, `p.last_name` | 180px | Yes (Name) | Yes (Search) | Who is the student? | **KEEP AS PRIMARY** |
| **Student ID** | Mono institutional ID (e.g. `202610001`) | `p.institutional_id` | 120px | Yes (ID) | Yes (Search) | Who is the student? | **KEEP AS PRIMARY (Merge with Name candidate)** |
| **Email** | Institutional email (`@ndmu.edu.ph`) | `p.email` | 180px | No | Yes (Search) | Secondary Identity | **DETAIL-SURFACE CANDIDATE** |
| **Sex** | Display text ('Male' / 'Female' / '—') | `p.sex` | 80px | No | Yes (Filter) | Secondary Attribute | **DETAIL-SURFACE CANDIDATE** |
| **College** | Text/Badge acronym (`CEAC`, `CBA`, etc.) | `c.code` | 90px | No | Yes (Filter) | What academic unit? | **KEEP AS PRIMARY (Enhance with Color Badge)** |
| **Academic Program**| Full program title or code | `ap.name` / `spe.academic_program_id` | 220px | No | Yes (Filter) | What academic unit? | **KEEP AS PRIMARY** |
| **Year Level** | Year string ('1st Year' - '5th Year') | `sp.year_level` | 90px | No | Yes (Filter) | Academic progress | **KEEP AS PRIMARY** |
| **Enrollment** | Badge: 'Enrolled' (100% constant) | `sp.enrollment_status` | 100px | No | No | Redundant status | **REMOVE FROM DEFAULT TABLE (Move to Details)** |
| **Account Status** | Status badge ('ACTIVE' + Pending Login) | `p.status`, `lac.must_change_password` | 120px | No | Yes (Filter) | Can student use account? | **KEEP AS PRIMARY (Streamline Status UX)** |
| **Actions** | 3-dots popup menu (Portfolio, Reset PWD) | Action triggers | 70px | No | No | What action to take? | **KEEP AS PRIMARY** |
