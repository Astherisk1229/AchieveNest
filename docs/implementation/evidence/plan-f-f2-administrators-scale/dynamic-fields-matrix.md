# Dynamic Fields Matrix — Administrators Scale

| Area | Criterion Code | Criterion Display Label | Dynamic Fields Rendered |
|---|---|---|---|
| **Area A** | `A1_DEGREES` | Degree/s | `classification` (select), `degree_name` (text, for degree holders), `units_completed` (number, for unit earners), `institution` (text), `proof` (file) |
| **Area A** | `A2_PROFESSIONAL_ORGANIZATION_MEMBERSHIP` | Active Membership to Professional Organizations | `organization_name` (text), `membership_role` (select: Member, Officer), `officer_position` (text, required if Officer), `period` (text), `proof` (file) |
| **Area A** | `A3_SEMINARS_TRAININGS` | Attendance to Seminars/Trainings | `title` (text), `venue` (text), `seminar_scope` (select: In-house, City/Provincial, Regional, National, International), `date_completed` (date), `proof` (file) |
| **Area B** | `B1_GUEST_LECTURER_CONSULTANT_JUDGE_RESOURCE_PERSON` | Guest Lecturer / Consultant / Judge / Resource Person | `title` (text), `sponsoring_org_type` (select: NDMU, External), `extent_of_talk` (select: 1 hr, Half day, 1 day, 2 days, >2 days), `participant_reach` (select: Local, Regional, National, International), `activity_role` (select: Judge, Reactor, Resource Person, Facilitator, Consultant, Speaker, Organizer), `date_completed` (date), `proof` (file) |
| **Area B** | `B2_PUBLICATION` | Publication | `title` (text), `publication_scope` (select: Local, Regional, National, International), `publication_type` (select: Commentary, Reviews, Compilation, Article, Scholarly Paper, Monograph, Research Output, Book), `date_completed` (date), `proof` (file) |
| **Area B** | `B3_CONDUCT_OF_RESEARCH` | Conduct of Research | `title` (text), `proof` (file) *(Evaluator judgment required — points field omitted)* |
| **Area B** | `B4_PROFESSIONAL_RECOGNITION_AWARDS` | Professional Recognition or Awards | `title` (text), `recognition_status` (select: Nominee, Awardee), `award_scope` (select: Local, Provincial/Regional, National, International), `date_completed` (date), `proof` (file) |
| **Area B** | `B5_INSTRUCTIONAL_MATERIALS` | Production of Instructional Materials | `title` (text), `material_type` (select: Audio-Visual Aids, Modules, Reviewers, Others), `date_completed` (date), `proof` (file) |
| **Area B** | `B6_CREATIVE_WORK` | Creative Work | `title` (text), `date_completed` (date), `proof` (file) *(Evaluator judgment required — points field omitted)* |
| **Area C** | `C1_EXTRA_CURRICULAR_ORGANIZATIONS` | Involvement in Extra-Curricular Activities | `title` (text), `c1_subcategory` (select: Moderator, Coach/Trainer, Working Committees, Rendered Service), `period` (text), `proof` (file) |
| **Area C** | `C2_COMMUNITY_INVOLVEMENT` | Community Involvement | `title` (text), `c2_category` (select: Church activities, Community/civic, Charity/community projects), `period` (text), `proof` (file) |
| **Area C** | `C3_YEARS_OF_SERVICE` | Years of Service at NDMU | *Server-derived / Read-only display of verified service record* |
