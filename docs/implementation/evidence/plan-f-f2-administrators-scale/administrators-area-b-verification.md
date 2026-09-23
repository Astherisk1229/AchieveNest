# Administrators Scale — Area B Verification (`AREA_B_PRODUCTIVITY_CREATIVE_WORK`)

## Area Overview
- **Area Code**: `AREA_B_PRODUCTIVITY_CREATIVE_WORK`
- **Area Label**: `Area B: Productivity and Creative Work`
- **Area Cap**: `50.0 points`

---

## B.1 Guest Lecturer / Consultant / Judge / Resource Person (`B1_GUEST_LECTURER_CONSULTANT_JUDGE_RESOURCE_PERSON`)
Per-entry 4-factor additive formula:
`Points = Organization_Type_Points + Extent_Points + Participant_Reach_Points + Role_Points`

### Factor Schedules:
1. **Sponsoring Organization Type (`sponsoring_org_type`)**:
   - `ndmu` (NDMU): 1.0 pt
   - `external` (External Agencies/Other Schools): 2.0 pts
2. **Extent of Talk (`extent_of_talk`)**:
   - `one_hour` (1 hour): 1.0 pt
   - `half_day` (Half day): 2.0 pts
   - `one_day` (1 day): 3.0 pts
   - `two_days` (2 days): 4.0 pts
   - `more_days` (More days): 5.0 pts
3. **Participant Reach (`participant_reach`)**:
   - `local` (Local): 1.0 pt
   - `regional` (Regional): 2.0 pts
   - `national` (National): 3.0 pts
   - `international` (International): 4.0 pts
4. **Role (`activity_role`)**:
   - `judge` (Judge): 3.0 pts
   - `reactor` (Reactor): 5.0 pts
   - `resource_person` (Resource Person): 5.0 pts
   - `facilitator` (Facilitator): 5.0 pts
   - `consultant` (Consultant): 5.0 pts
   - `speaker` (Speaker): 5.0 pts
   - `organizer` (Organizer): 5.0 pts

- **Calculated Range**: Min = 1 + 1 + 1 + 3 = 6 pts; Max = 2 + 5 + 4 + 5 = 16 pts.
- **Required Fields**: `title`, `sponsoring_org_type`, `extent_of_talk`, `participant_reach`, `activity_role`, `date_completed`, `proof`.

---

## B.2 Publication (`B2_PUBLICATION`)
Per-entry 2-factor additive formula:
`Points = Location_Scope_Points + Publication_Type_Points`

### Factor Schedules:
1. **Location / Scope (`publication_scope`)**:
   - `local` (Local): 3.0 pts
   - `regional` (Regional): 4.0 pts
   - `national` (National): 6.0 pts
   - `international` (International): 8.0 pts
2. **Publication Type (`publication_type`)**:
   - `commentary` (Commentary): 2.0 pts
   - `reviews` (Reviews): 4.0 pts
   - `compilation` (Compilation): 5.0 pts
   - `article` (Article): 5.0 pts
   - `scholarly_paper` (Scholarly Paper): 8.0 pts
   - `monograph` (Monograph): 8.0 pts
   - `research_output` (Research Output): 10.0 pts
   - `book` (Book): 10.0 pts

- **Calculated Range**: Min = 3 + 2 = 5 pts; Max = 8 + 10 = 18 pts.
- **Required Fields**: `title`, `publication_scope`, `publication_type`, `date_completed`, `proof`.

---

## B.3 Conduct of Research (`B3_CONDUCT_OF_RESEARCH`)
- **Maximum Accepted Ceiling**: `40.0 points`
- **Evaluation Mechanism**: `evaluator_judgment_required = true`
- **Rule Boundary**: No lower-level scoring formula is inferred or invented. Personnel submits title and evidence; authoritative scoring occurs during evaluator review (Plan G) within the 40-point ceiling (Plan F4).
- **Required Fields**: `title`, `proof`.

---

## B.4 Professional Recognition or Awards (`B4_PROFESSIONAL_RECOGNITION_AWARDS`)
Deterministic 8-cell status/scope matrix:

| Status | Local (`local`) | Provincial/Regional (`provincial_regional`) | National (`national`) | International (`international`) |
|---|---|---|---|---|
| **Nominee (`nominee`)** | 5.0 pts | 15.0 pts | 20.0 pts | 20.0 pts |
| **Awardee (`awardee`)** | 10.0 pts | 30.0 pts | 40.0 pts | 40.0 pts |

- **Required Fields**: `title`, `recognition_status`, `award_scope`, `date_completed`, `proof`.

---

## B.5 Production of Instructional Materials (`B5_INSTRUCTIONAL_MATERIALS`)
Deterministic material type schedule:

| Material Type Key | Material Type Label | Points | Required Fields |
|---|---|---|---|
| `audio_visual` | Audio-Visual Aids | 10.0 pts | `title`, `material_type`, `date_completed`, `proof` |
| `modules` | Modules | 10.0 pts | `title`, `material_type`, `date_completed`, `proof` |
| `reviewers` | Reviewers (Bound) | 10.0 pts | `title`, `material_type`, `date_completed`, `proof` |
| `others` | Others (Bound Workbook, Exercises, Lectures) | 20.0 pts | `title`, `material_type`, `date_completed`, `proof` |

---

## B.6 Creative Work (`B6_CREATIVE_WORK`)
- **Maximum Accepted Ceiling**: `20.0 points`
- **Evaluation Mechanism**: `evaluator_judgment_required = true`
- **Rule Boundary**: No lower-level scoring formula is inferred. Personnel submits title/description and proof; evaluator assigns points within the 20-point ceiling.
- **Required Fields**: `title`, `date_completed`, `proof`.
