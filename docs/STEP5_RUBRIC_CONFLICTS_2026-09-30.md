# Step 5 — Rubric conflicts for OSAD / adviser decision (2026-09-30)

Source: `php spark inspect:step5` (`backend/writable/step5-inspection.json`, database `achievenest_phase2_restore_test`)
compared with the constants in `backend/app/Services/AwardScoringService.php` and the student form validator
(`PortfolioStructuredMetadataValidator`). Nothing below was changed or remapped in code. The engine
(`AwardScoringService`) remains authoritative until OSAD decides.

Duplicate `student_award_evaluations` per (cycle, award, student): **0** (6 rows total).

## A. Point values: DB rule_config vs engine constant

| Award | Rule | DB (`award_scoring_rules.rule_config`) | Engine (`AwardScoringService`) |
|---|---|---|---|
| LEADERSHIP_AWARD | RULE_LEAD_CIVIC | national = 8 | NATIONAL = 0 (only barangay 10, municipal 8, provincial 8) |
| LEADERSHIP_AWARD | RULE_LEAD_CHURCH_MINISTRY | school 4 / community 3 / **organization** 3 | school 4 / community 3 / **church** 3 |
| SMC_AWARD | RULE_SMC_COMM_INVOLVE | count matrix 1→3, 2→6, 3→9, 4→12, 5→15 | fixed presence: school 5 + community 5 + church 5 (cap 15) |
| SMC_AWARD | RULE_SMC_COMM_INITIATED | role points head 6 / initiator 8 / facilitator 4 / organizer 3 | initiated scope: school 10 / community 5 (cap 15) |
| CAMPUS_JOURNALISM_AWARD | RULE_JOURN_LEAD_ROLE | member 2 / officer 3 / contributor 2 | officer/editor 3 / contributor 2; **member = unscorable (0)** |
| CAMPUS_JOURNALISM_AWARD | RULE_JOURN_LEAD_AWARDS | award_national 3 | national scope unsupported (only INTERNATIONAL 3, LOCAL 2) |
| MEMBER_OF_THE_YEAR, VOLUNTEER_OF_THE_YEAR | *_LEAD_AWARDS | international_national_award 3 | only scope INTERNATIONAL scores; NATIONAL = 0 |
| STUDENT_LEADER_OF_THE_YEAR | RULE_LEADER_YR_AWARDS_SEMINARS | international_national_award 4; leadership_citation 2 | only INTERNATIONAL scores 4; no separate leadership-citation value (LOCAL = 2) |
| SOCIO_CULTURAL_AWARD_F/M | *_PARTICIPATION, *_AWARDS | intramurals 2 / medal 2-1-1 | no intramurals level (0) |

All other compared values match (leadership involvement 10/8/6/4, NDA/SMC/Leadership awards-seminars,
NDA church schedule and initiated roles, citations 2/item cap 10, journalism publications, sports and
athlete participation/medals, socio-cultural national/regional/local/NDEA/university, Student Leader
involvement 12/8/6/4, Member involvement/contribution, Volunteer buckets).

## B. Component codes: DB vs engine (component identity never binds)

`attachAuthoritativeComponentIdentity()` looks up `award_criterion_components.code` by the engine code, and
no engine code exists in the DB, so every persisted contribution has `component_id = NULL` and
`scoring_rule_id = NULL`.

| Engine code | DB codes (examples) |
|---|---|
| COMP_LEADERSHIP_INVOLVEMENT | COMP_NDA_LEAD_INVOLVE, COMP_SMC_LEAD_INVOLVE, COMP_LEAD_INVOLVE, COMP_LEADER_YR_INVOLVEMENT, COMP_MEMBER_YR_LEAD_INVOLVEMENT, COMP_VOLUNTEER_YR_LEAD_INVOLVEMENT |
| COMP_AWARDS_CITATIONS_SEMINARS | COMP_NDA_LEAD_AWARDS, COMP_SMC_LEAD_AWARDS, COMP_LEAD_AWARDS, COMP_LEADER_YR_AWARDS_SEMINARS, … |
| COMP_CIVIC_INVOLVEMENT | COMP_LEAD_CIVIC |
| COMP_FIXED_INVOLVEMENT / COMP_INITIATED_ACTIVITIES | COMP_SMC_COMM_*, COMP_LEAD_CHURCH_*, COMP_LEADER_YR_COMMUNITY, COMP_VOLUNTEER_YR_* |
| COMP_CHURCH_MINISTRY_SCHEDULE / COMP_INITIATED_CHURCH_ACTIVITIES | COMP_NDA_CHURCH_MINISTRY / COMP_NDA_CHURCH_INITIATED |
| COMP_PER_RECORD_CAPPED | (NDA/SMC citations have no DB component) |
| COMP_SPORTS_SKILLS / _PARTICIPATION / _AWARDS_MATRIX | COMP_SPORTS_M_INDIV_SKILLS + _TEAM_SKILLS, COMP_SPORTS_M_PARTICIPATION, COMP_SPORTS_M_AWARDS (and F, ATHLETE_F/M) |
| COMP_SOCIO_* | COMP_SOCIO_F/M_*, COMP_PERFORMER_F/M_* |
| COMP_DISTINCT_LEADERSHIP | COMP_LEADER_YR_INVOLVEMENT |
| COMP_JOURN_* | match (COMP_JOURN_NEWS, …) — only Campus Journalism binds |

## C. Metadata vocabulary: student form validator vs engine

A record submitted through the student form cannot score on these components today.

| Area | Engine reads | Form validator produces |
|---|---|---|
| Leadership | `position_level` ∈ executive, officer, committee_head, **member** | includes year_representative; no member |
| Citations / awards | `scope` = INTERNATIONAL / LOCAL | `recognition_level` |
| Civic (Leadership Award) | `civic_level` or `scope` = BARANGAY / MUNICIPAL / PROVINCIAL | `service_scope` |
| Sports | `event_level` = PRISAA NATIONAL / PRISAA REGIONAL / PRISAA LOCAL / NDEA / INTRAMS; `placement` = GOLD / SILVER / BRONZE; `competition_type` containing TEAM / INDIVIDUAL | event_level institutional/local/regional/national/international; placement champion/first_runner_up/…; competition_type tournament/league/meet/invitational |
| Socio-cultural | `event_level` NATIONAL / REGIONAL / LOCAL / NDEA / UNIVERSITY-LEVEL; `performance_type` GROUP/ENSEMBLE/INDIVIDUAL | different keys/values |
| Other keys read by the engine but not allowed by the validator | `role`, `result`, `contribution_type`, `citation_type`, `activity_type`, `participation_type`, `period` | — |

The DB rule_config keys use a third vocabulary (`prisaa_regional`, `university`, `club`, …).

## D. Other open items found in Step 5

- `AwardReviewService` loads saved review state by (award, student) without the cycle; its writes are now
  cycle-scoped and the hardcoded fallback cycle id `50000000-0000-0000-0000-000000000001` was removed
  (no active cycle → error).
- The duplicate guard uses `source_record_id` when present, otherwise the record id (no title-based merging).
