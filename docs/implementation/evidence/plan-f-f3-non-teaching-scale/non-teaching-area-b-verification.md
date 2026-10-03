# Non-Teaching Scale — Area B Verification (`AREA_B_SERVICE_LEADERSHIP`)

## Area Overview
- **Area Code**: `AREA_B_SERVICE_LEADERSHIP`
- **Area Label**: `Area B: Service to School and Community`
- **Category Allocation**: `60.0 points`
- **Entry Policy**: `personnel_entry_allowed` (`is_personnel_entry_allowed = true`)

---

## Criterion Breakdown & Schedules

### B.1 Involvement in School Activities / Recognized School Organizations (`B1_SCHOOL_ACTIVITIES_RECOGNIZED_ORGANIZATIONS`)
- **Sub-ceiling**: `30.0 points`
- **Point Schedule**:
  - `moderator_officer`: Moderator or Officer of Clubs = `30.0 pts`
  - `trainer_coach`: Trainer/Coach = `20.0 pts`
  - `working_committee`: Membership in Working Committees = `20.0 pts`
  - `rendered_service`: Rendered Service in School Activities = `10.0 pts`
- **Required Fields**: `title`, `b1_subcategory`, `period`, `proof`.

---

### B.2 Community Involvement (`B2_COMMUNITY_INVOLVEMENT`)
- **Sub-ceiling**: `30.0 points`
- **Point Schedule**:
  - `church_activities`: Active Involvement in Church Activities = `25.0 pts`
  - `community_civic`: Active Involvement in Community/Civic Activities = `25.0 pts`
  - `charity_projects`: Support to Charity and Community Projects = `5.0 pts`
- **Required Fields**: `title`, `b2_subcategory`, `period`, `proof`.

---

### B.3 Number of Years at NDMU (`B3_YEARS_AT_NDMU`)
- **Calculation Formula**: `1 point per 2 completed years of service`
- **Sub-ceiling**: `10.0 points` (achieved at 20 completed years)
- **Authority Type**: `server_derived = true` (Read-only for Personnel).

---

### B.4 Invited as Judge, Lecturer, Resource Person (`B4_INVITED_JUDGE_LECTURER_RESOURCE_PERSON`)
- **Calculation Rule**: `5.0 points per qualifying invitation`
- **Sub-ceiling**: `30.0 points` (reached at 6 qualifying invitations)
- **Required Fields**: `event_title`, `invitation_role`, `organizer`, `date_completed`, `proof`.
- **Note**: Simple per-qualifying-invitation rule without 4-factor Administrator matrix.

---

### B.5 Recognition / Meritorious Award (`B5_RECOGNITION_MERITORIOUS_AWARD`)
- **Maximum Ceiling**: `30.0 points`
- **Evaluation Mechanism**: `evaluator_judgment_required = true`
- **Required Fields**: `award_title`, `issuing_body`, `date_completed`, `proof`.
- **Rule Boundary**: No unconfirmed lower-level scoring formula or scope multipliers are inferred. Evaluator determines official score during deliberation.
