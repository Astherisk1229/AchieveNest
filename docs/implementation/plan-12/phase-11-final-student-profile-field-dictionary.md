# PLAN 12 — Final Student Profile Field Dictionary
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Authoritative Student-Visible Field Dictionary

| Section | Field Property | Canonical DB Source | Data Type | Nullable? | Student Editable? | Description |
|---|---|---|---|---:|---:|---|
| `identity` | `student_id` | `profiles.institutional_id` | String | No | **No (0)** | Official Student ID Number |
| `identity` | `full_name` | `profiles.full_name` | String | No | **No (0)** | Full Legal Name |
| `identity` | `first_name` | `profiles.first_name` | String | No | **No (0)** | First Name |
| `identity` | `last_name` | `profiles.last_name` | String | No | **No (0)** | Last Name |
| `identity` | `sex` | `profiles.sex` | String | Yes | **No (0)** | Sex / Gender |
| `identity` | `institutional_email`| `profiles.email` | String | No | **No (0)** | Official `@ndmu.edu.ph` email |
| `identity` | `avatar_url` | `profiles.avatar_url` | String | Yes | **No (0)** | Avatar image URL |
| `academic` | `program_code` | `academic_programs.code` | String | Yes (Unassigned) | **No (0)** | Academic Program Code |
| `academic` | `program_name` | `academic_programs.name` | String | Yes (Unassigned) | **No (0)** | Degree Program Title |
| `academic` | `year_level` | `student_program_enrollments.year_level` | String | Yes (Unassigned) | **No (0)** | Current Year Level |
| `academic` | `academic_year`| `student_program_enrollments.academic_year` | String | Yes (Unassigned) | **No (0)** | Active Academic Year |
| `college` | `college_code` | `colleges.code` | String | Yes (Unassigned) | **No (0)** | College Acronym |
| `college` | `college_name` | `colleges.name` | String | Yes (Unassigned) | **No (0)** | Full College Name |
| `college` | `acronym_badge_color`| `colleges.acronym_badge_color` | Hex Color | Yes (Unassigned) | **No (0)** | Master Data College Hex Color |
| `organization` | `organization_name`| `organizations.name` | String | Yes (Unassigned) | **No (0)** | Affiliated Organization Name |
| `organization` | `organization_code`| `organizations.code` | String | Yes (Unassigned) | **No (0)** | Organization Code |
| `organization` | `scope` | `organizations.scope` | String | Yes (Unassigned) | **No (0)** | Organization Scope (`college`/`university`) |
| `coordinator` | `full_name` | `profiles.full_name` via `program_coordinator_assignments` | String | Yes (Unassigned) | **No (0)** | Active Program Coordinator Name |
| `coordinator` | `designation_title` | `profiles.designation_title` | String | Yes (Unassigned) | **No (0)** | Coordinator Title |
| `coordinator` | `institutional_email`| `profiles.email` | String | Yes (Unassigned) | **No (0)** | Coordinator Email |
| `coordinator` | `avatar_url` | `profiles.avatar_url` | String | Yes (Unassigned) | **No (0)** | Coordinator Avatar |
| `moderator` | `full_name` | `profiles.full_name` via `organization_moderator_assignments` | String | Yes (Unassigned) | **No (0)** | Active Org Moderator Name |
| `moderator` | `designation_title` | `profiles.designation_title` | String | Yes (Unassigned) | **No (0)** | Moderator Title |
| `moderator` | `institutional_email`| `profiles.email` | String | Yes (Unassigned) | **No (0)** | Moderator Email |
| `moderator` | `avatar_url` | `profiles.avatar_url` | String | Yes (Unassigned) | **No (0)** | Moderator Avatar |
| `account` | `status` | `profiles.status` | String | No | **No (0)** | Safe Account Lifecycle Status |
| `availability` | `has_program` | Relational join presence | Boolean | No | **No (0)** | Program Enrollment Flag |
| `availability` | `has_college` | Relational join presence | Boolean | No | **No (0)** | College Association Flag |
| `availability` | `has_coordinator`| Relational join presence | Boolean | No | **No (0)** | Coordinator Assignment Flag |
| `availability` | `has_organization`| Relational join presence | Boolean | No | **No (0)** | Organization Affiliation Flag |
| `availability` | `has_moderator` | Relational join presence | Boolean | No | **No (0)** | Moderator Assignment Flag |
