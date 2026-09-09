# PLAN 12 — Phase 2 Field Dictionary & Nullability Matrix
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Field Dictionary

| Section | Property | Type | Nullable? | Description |
|---|---|---|---|---|
| `identity` | `student_id` | String | No | Official Student Identification ID |
| `identity` | `full_name` | String | No | Formatted Full Name |
| `identity` | `first_name` | String | No | First Name |
| `identity` | `last_name` | String | No | Last Name |
| `identity` | `middle_name` | String | Yes | Middle Name (Optional) |
| `identity` | `sex` | String | Yes | Student Sex (e.g. `Male`, `Female`) |
| `identity` | `institutional_email`| String | No | Official `@ndmu.edu.ph` email |
| `identity` | `avatar_url` | String | Yes | Public Avatar image URL |
| `academic` | `program_id` | UUID | Yes (Object null) | Academic Program UUID |
| `academic` | `program_code` | String | Yes (Object null) | Program Code (e.g. `BSCS`) |
| `academic` | `program_name` | String | Yes (Object null) | Program Title |
| `academic` | `degree_level` | String | Yes (Object null) | Degree Classification |
| `academic` | `year_level` | String | Yes (Object null) | Current Year Level |
| `academic` | `academic_year` | String | Yes (Object null) | Active Academic Year |
| `college` | `college_id` | UUID | Yes (Object null) | College UUID |
| `college` | `college_code` | String | Yes (Object null) | College Code (e.g. `CITE`) |
| `college` | `college_name` | String | Yes (Object null) | College Name |
| `college` | `acronym_badge_color`| String | Yes (Object null) | Hex brand color from master data |
| `organization` | `organization_id` | UUID | Yes (Object null) | Organization UUID |
| `organization` | `organization_code` | String | Yes (Object null) | Organization Code |
| `organization` | `organization_name` | String | Yes (Object null) | Organization Name |
| `organization` | `scope` | String | Yes (Object null) | Scope (`college` / `university`) |
| `organization` | `category` | String | Yes (Object null) | Organization Classification |
| `moderator` | `full_name` | String | Yes (Object null) | Active Moderator Name |
| `moderator` | `institutional_email`| String | Yes (Object null) | Active Moderator Email |
| `moderator` | `designation_title` | String | Yes (Object null) | Active Moderator Role Title |
| `coordinator` | `full_name` | String | Yes (Object null) | Active Coordinator Name |
| `coordinator` | `institutional_email`| String | Yes (Object null) | Active Coordinator Email |
| `coordinator` | `designation_title` | String | Yes (Object null) | Active Coordinator Role Title |
| `account` | `status` | String | No | Safe account lifecycle state |
| `availability` | `has_program` | Boolean | No | Boolean flag |
| `availability` | `has_college` | Boolean | No | Boolean flag |
| `availability` | `has_coordinator` | Boolean | No | Boolean flag |
| `availability` | `has_organization` | Boolean | No | Boolean flag |
| `availability` | `has_moderator` | Boolean | No | Boolean flag |
