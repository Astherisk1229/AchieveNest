# PLAN 10 — Phase 10 Keep/Remove Rationale Matrix
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Field Allocation & Rationale

| Student Account Field | Final Presentation Location | Rationale & Evidence |
|---|---|---|
| **Full Name** | `Student` Column (Primary) | Essential primary identity attribute for OSAD administration. |
| **Student ID** | `Student` Column (Secondary) | Essential scannable institutional identifier. |
| **Institutional Email** | **View Details Modal** | Searchable via toolbar; moving from default table reclaims 180px width. |
| **Academic Program** | `Academic Placement` Column (Primary) | Primary institutional unit context. |
| **Year Level** | `Academic Placement` Column (Secondary)| Primary academic progression context. |
| **College Code & Color**| `Academic Placement` Badge | Compact master-data pill badge; reclaims 90px standalone column. |
| **Enrollment Status** | **View Details Modal** | 100% constant (`'enrolled'`) across 103/103 rows; zero default table utility. |
| **Sex** | **View Details Modal** | Secondary demographic; remains filterable in toolbar. |
| **Organization** | **View Details Modal** | Optional extracurricular data; not required for core account administration. |
| **Account Status** | `Account Status` Column | Critical operational status indicating account usability and password change state. |
| **Actions** | `Actions` Column | Essential row management controls (View Details + Reset Password). |
