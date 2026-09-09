# Required Fields Validation Matrix

| Criterion Code | Required Input Fields | Missing Field Consequence |
|---|---|---|
| `A1_DEGREES` (Degree) | `title`, `sub_category` (degree type) | HTTP 422: Title / classification required |
| `A1_DEGREES` (Units) | `title`, `units_completed` (integer) | HTTP 422: Valid units count required |
| `A2_PROFESSIONAL_ORGANIZATIONS` (Officer) | `title`, `sub_category: 'officer'`, `officer_position` | HTTP 422: Officer position title required |
| `A3_SEMINARS_TRAININGS` | `title`, `scope` | HTTP 422: Scope level required |
| `B1_GUEST_LECTURER_CONSULTANT` | `title`, `sponsoring_org_type`, `extent_of_talk`, `participant_reach`, `activity_role` | HTTP 422: 4-factor parameters required |
| `B2_PUBLICATION` | `title`, `location_scope`, `publication_type` | HTTP 422: Scope & Publication type required |
| `B3_CONDUCT_OF_RESEARCH` | `title`, `proof` | HTTP 422: Research title and proof required |
| `B4_RECOGNITION_AWARDS` | `title`, `recognition_status`, `award_scope` | HTTP 422: Status & Scope required |
| `B5_INSTRUCTIONAL_MATERIALS` | `title`, `material_type` | HTTP 422: Material type required |
| `B6_CREATIVE_WORK` | `title`, `proof` | HTTP 422: Description & proof required |
| `C1_EXTRA_CURRICULAR` | `title`, `sub_category` | HTTP 422: Subcategory required |
| `C2_COMMUNITY_INVOLVEMENT` | `title`, `sub_category` | HTTP 422: Category required |
| `C3_YEARS_OF_SERVICE` | `years_of_service` (server-derived) | Derived from authoritative DB record |
