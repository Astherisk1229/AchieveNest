# Active Create Personnel Modal Field & Source Matrix — Plan D2 Phase D2-0

| Visible Label | Frontend State Key | Input Type | Source Type | Required? | Submitted Key | Backend Target Column | Source Classification |
|---|---|---|---|---|---|---|---|
| **Employee ID** | `institutionalId` | `text` | User Input | Yes | `institutional_id` | `profiles.institutional_id` | Master User Identity |
| **Institutional Email** | `institutionalEmail` | `email` | User Input | Yes | `institutional_email` | `users.email` / `profiles.institutional_email` | Master Auth Identity |
| **First Name** | `firstName` | `text` | User Input | Yes | `first_name` | `profiles.first_name` | Master User Profile |
| **Middle Name** | `middleName` | `text` | User Input | No | `middle_name` | `profiles.middle_name` | Master User Profile |
| **Last Name** | `lastName` | `text` | User Input | Yes | `last_name` | `profiles.last_name` | Master User Profile |
| **Suffix** | `suffix` | `text` | User Input | No | `suffix` | `profiles.suffix` | Master User Profile |
| **Personnel Group** | `personnelClassification` | Pill toggle (`faculty` / `non_teaching_faculty`) | User Selection | Yes | `personnel_group` | `personnel_profiles.personnel_group` | Master Classification |
| **Organizational Side** | `organizationalSide` | Pill toggle (`academic` / `non_academic`) | User Selection | Yes | `organizational_side` | `personnel_profiles.organizational_side` | Master Classification |
| **College** | `collegeId` | `select` | `collectPersonnelPlacementOptions` | Yes (if Academic) | `college_id` | `personnel_profiles.college_id` | **DISCONNECTED** (Derived from existing personnel list rather than institutional master endpoint) |
| **Department / Unit** | `administrativeUnitId` | `select` | `collectPersonnelPlacementOptions` | Yes (if Non-Academic) | `administrative_unit_id` | `personnel_profiles.administrative_unit_id` | Master Unit FK (derived from existing list) |
| **Faculty Status / Engagement** | `facultyEngagement` | Radio (`full_time_faculty` / `part_time_faculty`) | User Selection | Yes | `faculty_engagement` | `personnel_profiles.faculty_engagement` | Canonical Engagement |
| **Employment Status** | `employmentStatus` | Radio (`permanent` / `probationary`) | User Selection | Yes | `employment_status` | `personnel_profiles.employment_status` | Canonical Employment Status |
| **Qualification Summary** | `qualificationSummary` | `text` | User Input (Free-text) | No | `qualification_summary` | `personnel_profiles.qualification_summary` | Free-text string (Not structured) |
| **Current Academic Rank / Title** | `currentRankTitle` | `text` | User Input (Free-text) | No | `current_rank_title` | `personnel_profiles.current_rank_title` | **DISCONNECTED** (Free-text instead of Plan E catalog dropdown) |
| **Position / Job Title** | `positionTitle` | `text` | User Input (Free-text) | No | `position_title` | `personnel_profiles.position_title` | **UNRESOLVED** (No authoritative institutional catalog) |
