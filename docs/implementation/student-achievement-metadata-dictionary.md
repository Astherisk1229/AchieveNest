# AchieveNest — Student Achievement Entry & Dynamic Category-Based Structured Forms
## Metadata Dictionary & Controlled Vocabularies

---

### 1. Structured Metadata Fields (JSON Storage)

| Key | Label | Data Type | Controlled Vocabulary / Domain | Primary Categories Used |
|---|---|---|---|---|
| `schema_version` | Schema Version | String | `"1.0"` (Constant) | All Categories |
| `academic_year` | Academic Year | Select | `2025-2026`, `2024-2025`, `2023-2024`, etc. | All Categories |
| `semester` | Semester | Select | `1st_semester`, `2nd_semester`, `summer` | All Categories |
| `position_level` | Officer Level | Select | `executive`, `officer`, `committee_head`, `year_representative` | Leadership Position, Journalism |
| `position_title` | Specific Position | Text | Free text (e.g. "President", "Treasurer") | Leadership Position |
| `organization_name` | Organization Name | Text | Free text (e.g. "Supreme Student Government") | Leadership Position, Org Membership |
| `membership_type` | Membership Type | Select | `charter_member`, `regular_member`, `honorary_member` | Org Membership |
| `contribution_level` | Contribution Tier | Select | `lead_organizer`, `committee_member`, `general_contributor` | Org Membership |
| `service_type` | Service Domain | Select | `direct_outreach`, `advocacy`, `environmental`, `educational` | Community Service |
| `service_scope` | Outreach Scope | Select | `institutional`, `local`, `regional`, `national` | Community Service |
| `hours_rendered` | Volunteer Hours | Number | Integer >= 1 | Community Service |
| `initiated_or_led` | Initiated / Led | Boolean | `true`, `false` | Community Service, Church / Ministry |
| `ministry_context` | Ministry Context | Select | `liturgical`, `youth_ministry`, `parish_based`, `faith_formation` | Church / Ministry |
| `involvement_type` | Role in Ministry | Select | `coordinator`, `active_servant`, `participant` | Church / Ministry |
| `training_type` | Training Domain | Select | `leadership_dev`, `skills_workshop`, `sports_dev`, `socio_cultural_dev`, etc. | Seminar / Training |
| `hours_duration` | Duration (Hours) | Number | Integer >= 1 | Seminar / Training |
| `recognition_level` | Recognition Tier | Select | `institutional`, `local`, `regional`, `national`, `international` | Citation / Recognition |
| `granting_body` | Granting Body | Text | Free text (e.g. "CHED", "City of Koronadal") | Citation / Recognition |
| `event_level` | Event Scope | Select | `institutional`, `local`, `regional`, `national`, `international` | Seminar, Citation, Sports, Socio-Cultural |
| `competition_type` | Tournament Tier | Select | `intramurals`, `prisaa`, `national_meet`, `open_invitational` | Sports |
| `placement` | Placement / Result | Select | `champion`, `first_runner_up`, `second_runner_up`, `finalist`, `participant` | Sports, Socio-Cultural, Citation |
| `individual_team` | Participation Mode | Select | `individual`, `team` | Sports |
| `performance_type` | Art Form | Select | `solo`, `duet`, `ensemble_troupe`, `exhibition` | Socio-Cultural / Performing Arts |
| `publication_type` | Article Type | Select | `news`, `literary`, `column`, `editorial`, `feature` | Campus Journalism |
| `publication_status` | Status | Select | `published`, `draft` | Campus Journalism |
| `authorship_role` | Author Role | Select | `lead_author`, `co_author`, `photographer`, `layout_artist` | Campus Journalism |
| `publication_name` | Publication | Text | Free text (e.g. "The Maroon and Gold") | Campus Journalism |

---

### 2. Controlled Vocabularies Summary

- **Total Synchronized Controlled Sets**: 17.
- **Frontend / Backend Drift**: **0**.
- **Forbidden Injected Keys**: `award_id`, `award_name`, `score`, `points`, `rubric`, `potential_award`.
