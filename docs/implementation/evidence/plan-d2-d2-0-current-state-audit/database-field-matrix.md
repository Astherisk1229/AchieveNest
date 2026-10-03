# Database Field & Schema Audit Matrix — Plan D2 Phase D2-0

| Business Concept | Target Table | Column / FK Name | Data Type | Nullable | Canonical Source? | Audit Notes |
|---|---|---|---|---|---|---|
| **User Identity** | `users` | `id` | `UUID` / `BIGINT` | No | Yes | Primary auth identifier |
| **Employee ID** | `profiles` | `institutional_id` | `VARCHAR(100)` | No | Yes | Unique institutional employee number |
| **Institutional Email** | `users` / `profiles` | `email` / `institutional_email` | `VARCHAR(255)` | No | Yes | University domain email |
| **Personnel Group** | `personnel_profiles` | `personnel_group` | `VARCHAR(50)` | No | Yes | `faculty` or `non_teaching_faculty` |
| **Organizational Side** | `personnel_profiles` | `organizational_side` | `VARCHAR(50)` | No | Yes | `academic` or `non_academic` |
| **College FK** | `personnel_profiles` | `college_id` | `BIGINT` / `INT` | Yes | Yes (Relation) | References `colleges.id` |
| **Administrative Unit FK** | `personnel_profiles` | `administrative_unit_id` | `BIGINT` / `INT` | Yes | Yes (Relation) | References `administrative_units.id` |
| **Faculty Engagement** | `personnel_profiles` | `faculty_engagement` | `VARCHAR(50)` | Yes | Yes | `full_time_faculty` or `part_time_faculty` |
| **Employment Status** | `personnel_profiles` | `employment_status` | `VARCHAR(50)` | Yes | Yes | `permanent` or `probationary` |
| **Current Rank Title** | `personnel_profiles` | `current_rank_title` | `VARCHAR(255)` | Yes | No (Free-text) | Currently stores free-text display string |
| **Qualification Summary** | `personnel_profiles` | `qualification_summary` | `VARCHAR(255)` | Yes | Partial (Free-text) | Free-text string description |
| **Position / Job Title** | `personnel_profiles` | `position_title` | `VARCHAR(255)` | Yes | No | **UNRESOLVED** source |
