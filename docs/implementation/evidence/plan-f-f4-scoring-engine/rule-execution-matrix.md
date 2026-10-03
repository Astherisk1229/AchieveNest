# Rule Execution Matrix — Plan F Canonical Scales

| Scale Code | Area | Criterion Code | Rule Type | Calculation / Lookup Logic | Sub-Ceiling |
|---|---|---|---|---|---|
| `ADMINISTRATORS` | A | `A1_DEGREES` | `DEGREE_AND_UNITS` | Ph.D. = 40, MA = 20, Ph.D. units = `floor(u/3)*2`, MA units = `floor(u/3)*1` | Units: 10.0 pts |
| `ADMINISTRATORS` | A | `A2_PROFESSIONAL_ORGANIZATION_MEMBERSHIP` | `FIXED_POINTS` | Member = 5, Officer = 10 (requires position) | None |
| `ADMINISTRATORS` | A | `A3_SEMINARS_TRAININGS` | `FIXED_BY_SCOPE` | In-house: 3, Provincial: 4, Regional: 6, National: 8, Intl: 10 | 20.0 pts |
| `ADMINISTRATORS` | B | `B1_GUEST_LECTURER_CONSULTANT_JUDGE` | `SUM_COMPONENTS` | `Org (1..2) + Extent (1..5) + Reach (1..4) + Role (3..5)` | None |
| `ADMINISTRATORS` | B | `B2_PUBLICATION` | `SUM_COMPONENTS` | `Scope (3..8) + Publication_Type (2..10)` | None |
| `ADMINISTRATORS` | B | `B3_CONDUCT_OF_RESEARCH` | `EVALUATOR_JUDGMENT_MAX_ONLY` | Evaluator assigns score (0 <= score <= 40) | 40.0 pts |
| `ADMINISTRATORS` | B | `B4_PROFESSIONAL_RECOGNITION_AWARDS` | `FIXED_BY_MATRIX` | 8-cell Nominee / Awardee x Scope matrix (5..40 pts) | 40.0 pts |
| `ADMINISTRATORS` | B | `B5_INSTRUCTIONAL_MATERIALS` | `FIXED_POINTS` | Audio-Visual/Modules/Reviewers = 10, Others = 20 | 20.0 pts |
| `ADMINISTRATORS` | B | `B6_CREATIVE_WORK` | `EVALUATOR_JUDGMENT_MAX_ONLY` | Evaluator assigns score (0 <= score <= 20) | 20.0 pts |
| `ADMINISTRATORS` | C | `C1_EXTRA_CURRICULAR_ORGANIZATIONS` | `FIXED_POINTS` | Moderator = 20, Coach = 20, Committee = 20, Service = 10 | 30.0 pts |
| `ADMINISTRATORS` | C | `C2_COMMUNITY_INVOLVEMENT` | `FIXED_POINTS` | Church = 25, Civic = 25, Charity = 5 | 30.0 pts |
| `ADMINISTRATORS` | C | `C3_YEARS_OF_SERVICE` | `SERVER_DERIVED` | `floor(completed_years / 2) * 1` | 10.0 pts |
| `NON_TEACHING` | A | `A1_A2_A3_INDICATORS` | `EVALUATOR_OFFICIAL_RATING` | Performance (50 / .50), Attitudes (10 / .10), Efficiency (30 / .30) | 90.0 pts (Eval only) |
| `NON_TEACHING` | B | `B1_SCHOOL_ACTIVITIES` | `FIXED_POINTS` | Moderator/Officer = 30, Trainer = 20, Committee = 20, Service = 10 | 30.0 pts |
| `NON_TEACHING` | B | `B2_COMMUNITY_INVOLVEMENT` | `FIXED_POINTS` | Church = 25, Civic = 25, Charity = 5 | 30.0 pts |
| `NON_TEACHING` | B | `B3_YEARS_AT_NDMU` | `SERVER_DERIVED` | `floor(completed_years / 2) * 1` | 10.0 pts |
| `NON_TEACHING` | B | `B4_INVITED_JUDGE_LECTURER` | `POINTS_PER_OCCURRENCE` | `qualifying_invitations * 5.0` | 30.0 pts |
| `NON_TEACHING` | B | `B5_RECOGNITION_MERITORIOUS_AWARD` | `EVALUATOR_JUDGMENT_MAX_ONLY` | Evaluator assigns score (0 <= score <= 30) | 30.0 pts |
