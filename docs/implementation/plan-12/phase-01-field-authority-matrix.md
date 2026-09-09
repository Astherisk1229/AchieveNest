# PLAN 12 — Phase 1 Field Authority Matrix
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Student-Visible Field Authority

| Field Label | Authoritative Database Source | Relationship Path | Optional? | Privacy Scope |
|---|---|---|---|---|
| **Student ID** | `profiles.institutional_id` | Authenticated `profiles` record | **No** | Student-Visible |
| **Full Name** | `profiles.full_name` (or `first/last`) | Authenticated `profiles` record | **No** | Student-Visible |
| **Sex** | `profiles.sex` | Authenticated `profiles` record | **No** | Student-Visible |
| **Institutional Email**| `profiles.email` | Authenticated `profiles` record | **No** | Student-Visible |
| **Year Level** | `student_program_enrollments.year_level`| Active enrollment row | **No** | Student-Visible |
| **Academic Year** | `student_program_enrollments.academic_year`| Active enrollment row | **No** | Student-Visible |
| **Academic Program** | `academic_programs.name` / `.code` | `enrollments` -> `academic_programs` | **No** | Student-Visible |
| **College Name / Acronym**| `colleges.name` / `.code` | `academic_programs` -> `colleges` | **No** | Student-Visible |
| **College Brand Color**| `colleges.acronym_badge_color` | `colleges` master data | **No** | Student-Visible |
| **Student Organization**| `organizations.name` / `.code` | `organization_program_affiliations` | **Yes** | Student-Visible |
| **Org Moderator** | `profiles.full_name`, `email` | `organization_moderator_assignments`| **Yes** | Approved Contact |
| **Program Coordinator**| `profiles.full_name`, `email` | `program_coordinator_assignments` | **Yes** | Approved Contact |
| **Account Status** | `profiles.status` | Authenticated `profiles` record | **No** | Lifecycle Status |
