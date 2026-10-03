# Personnel domain mapping

| Concept | Current authority | UI treatment |
|---|---|---|
| Classification | `personnel_profiles.personnel_group`, `organizational_side`, legacy `personnel_classification` | Teaching Faculty, Non-Teaching Faculty, or supported personnel classification |
| Employment | `personnel_profiles.faculty_engagement`, `employment_status` | Separate employment values |
| Job title | `personnel_profiles.position_title` (mirrored to `profiles.designation_title`) | Job Title only; Department Secretary lives here |
| Rank | `personnel_profiles.current_rank_title`, legacy `rank_level` | Academic Rank, separate from job title |
| College placement | active `personnel_college_affiliations` row | Organizational placement |
| Department/unit placement | active `personnel_administrative_unit_affiliations` row | Organizational placement |
| Dean appointment | existing Dean assignment service and assignment/history records | Formal appointment in College Leadership and personnel Assignments |
| Functional responsibility | active `profile_roles` / directory `assigned_roles` values | Program Coordinator and Organization Moderator only |
| Portfolio | `personnel_accomplishments`, evidence, and portfolio submission/evaluation tables | Portfolio tab; accomplishments stay within Portfolio |
| Evaluation | personnel evaluation/submission records | Read-only summary; explicit link to full evaluation workflow |
| Audit | existing audit/lifecycle and Dean history writes | Administrative history; no history rows overwritten |

## Department Secretary occupancy

`DepartmentSecretaryOccupancyService` treats `Department Secretary` as the sole approved restricted job title. Its scope is the active College or administrative-unit affiliation. A placement row is locked inside the caller transaction before checking for another active profile, which prevents simultaneous create/edit requests from both succeeding. The service excludes the current profile during edits and returns `POSITION_OCCUPIED` with the current holder and placement.

No schema migration was introduced because the current database has no job-title catalog. A future catalog can replace the service constant with `single_occupancy` and `occupancy_scope` metadata without changing controller behavior.
