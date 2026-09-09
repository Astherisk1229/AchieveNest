# AchieveNest — Plan 04 Phase 2
## Evidence: Canonical Metadata Field Dictionary

| Metadata Key | User-Facing Label | Input Type | Allowed Values / Controlled Vocab | Requiredness | Target Storage | Used By Award Engine |
|---|---|---|---|---|---|---|
| `organization_name` | Organization / Body Name | `text` | Free text string | Required | `structured_metadata.organization_name` | Leadership & Member Awards |
| `position_level` | Leadership / Officer Level | `select` | `executive`, `officer`, `committee_head`, `year_representative` | Required | `structured_metadata.position_level` | Leadership & Notre Dame Awards |
| `position_title` | Specific Position / Title | `text` | Free text (e.g. "SSG President") | Required | `structured_metadata.position_title` | Leadership & Notre Dame Awards |
| `tenure_start` | Term Start Date | `date` | YYYY-MM-DD | Optional | `structured_metadata.tenure_start` | Leadership Awards |
| `tenure_end` | Term End Date | `date` | YYYY-MM-DD | Optional | `structured_metadata.tenure_end` | Leadership Awards |
| `membership_type` | Membership Classification | `select` | `charter_member`, `regular_member`, `honorary_member` | Required | `structured_metadata.membership_type` | Member of the Year |
| `contribution_level` | Level of Contribution | `select` | `lead_organizer`, `committee_member`, `general_contributor` | Required | `structured_metadata.contribution_level` | Member of the Year |
| `service_type` | Type of Community Service | `select` | `direct_outreach`, `advocacy`, `environmental`, `educational` | Required | `structured_metadata.service_type` | Volunteer of the Year |
| `beneficiary_type` | Target Beneficiary Community | `text` | Free text (e.g. "Indigenous Youth") | Required | `structured_metadata.beneficiary_type` | Volunteer of the Year |
| `service_scope` | Scope of Service Initiative | `select` | `institutional`, `local`, `regional`, `national` | Required | `structured_metadata.service_scope` | Volunteer of the Year |
| `hours_rendered` | Documented Service Hours | `number` | Positive integer (e.g. 20) | Optional | `structured_metadata.hours_rendered` | Volunteer of the Year |
| `leadership_role` | Was this initiative self-led or organized? | `boolean` | `true`, `false` | Required | `structured_metadata.leadership_role` | Leadership & Volunteer Awards |
| `ministry_context` | Ministry Setting / Context | `select` | `campus_ministry`, `parish_ministry`, `diocesan_ministry` | Required | `structured_metadata.ministry_context` | SMC & Notre Dame Awards |
| `involvement_type` | Involvement Role | `select` | `liturgical_minister`, `youth_animator`, `choir_member`, `catechist` | Required | `structured_metadata.involvement_type` | SMC & Notre Dame Awards |
| `training_type` | Focus Area of Seminar/Training | `select` | `leadership_dev`, `sports_dev`, `socio_cultural_dev`, `journalism_dev`, `professional_dev` | Required | `structured_metadata.training_type` | All Award Rubrics (Zero or standard) |
| `hours_duration` | Duration / Hours | `number` | Positive integer | Optional | `structured_metadata.hours_duration` | Training Records |
| `recognition_type` | Recognition Classification | `select` | `individual_award`, `group_award`, `special_citation` | Required | `structured_metadata.recognition_type` | Citation & Leadership Awards |
| `recognition_level` | Scope / Level of Recognition | `select` | `institutional`, `local`, `regional`, `national`, `international` | Required | `structured_metadata.recognition_level` | Citation & Leadership Awards |
| `granting_body` | Granting Institution / Organization | `text` | Free text (e.g. "DOST Region XII") | Required | `structured_metadata.granting_body` | Citation Awards |
| `competition_type` | Competition / Event Format | `select` | `tournament`, `league`, `meet`, `invitational` | Required | `structured_metadata.competition_type` | Sports Awards |
| `event_level` | Geographic Scope / Event Level | `select` | `institutional`, `local`, `regional`, `national`, `international` | Required | `structured_metadata.event_level` | Sports & Socio-Cultural Awards |
| `placement` | Placement / Conferred Result | `select` | `champion`, `first_runner_up`, `second_runner_up`, `finalist`, `participant` | Required | `structured_metadata.placement` | Sports & Socio-Cultural Awards |
| `individual_team` | Participation Format | `select` | `individual`, `team` | Required | `structured_metadata.individual_team` | Sports Awards |
| `team_role` | Role in Team | `select` | `team_captain`, `core_player`, `reserve_player` | Conditional | `structured_metadata.team_role` | Sports Awards |
| `performance_type` | Nature of Performance | `select` | `solo_performance`, `ensemble_lead`, `ensemble_member`, `exhibition` | Required | `structured_metadata.performance_type` | Socio-Cultural Awards |
| `individual_group` | Performance Grouping | `select` | `individual`, `group` | Required | `structured_metadata.individual_group` | Socio-Cultural Awards |
| `publication_type` | Publication Format | `select` | `news`, `literary`, `column`, `editorial`, `feature` | Required | `structured_metadata.publication_type` | Campus Journalism Award |
| `publication_status` | Publication Circulation Status | `select` | `published`, `draft` | Required | `structured_metadata.publication_status` | Campus Journalism Award |
| `authorship_role` | Authorship / Byline Role | `select` | `lead_author`, `co_author`, `contributing_writer`, `illustrator_photographer` | Required | `structured_metadata.authorship_role` | Campus Journalism Award |
| `publication_name` | Official Publication Title | `text` | Free text (e.g. "The Maroon and Gold") | Required | `structured_metadata.publication_name` | Campus Journalism Award |
| `publication_date` | Date of Circulation / Release | `date` | YYYY-MM-DD | Conditional (Required if published) | `structured_metadata.publication_date` | Campus Journalism Award |
| `academic_year` | Academic Year | `select` | `2025-2026`, `2024-2025`, `2023-2024` | Required | `structured_metadata.academic_year` | All Awards |
| `semester` | Academic Term / Semester | `select` | `1st_semester`, `2nd_semester`, `summer` | Required | `structured_metadata.semester` | All Awards |
