# Server-Side Validation Matrix

| Payload Condition | Validation Rule | Backend Response | Status |
|---|---|---|---|
| Invalid/Unseeded Rank Code | Must match canonical Plan E rank catalog | HTTP 422 `INVALID_RANK_LEVEL` | PASSED |
| Full-Time / Part-Time Crossover | FT cannot receive PT title; PT cannot receive FT rank | HTTP 422 `INVALID_ENGAGEMENT_RANK_PAIR` | PASSED |
| Invalid College UUID | Must exist in `colleges` table | HTTP 422 `INVALID_COLLEGE_ID` | PASSED |
| Invalid Department UUID | Must exist in `administrative_units` table | HTTP 422 `INVALID_ADMINISTRATIVE_UNIT_ID` | PASSED |
| Faculty + Non-Academic Pairing | Faculty must belong to Academic organizational side | HTTP 422 `INVALID_CLASSIFICATION_PAIR` | PASSED |
| Missing Program Affiliation for Academic | Academic placement requires >= 1 valid program | HTTP 422 `MISSING_PROGRAM_AFFILIATIONS` | PASSED |
| Non-HR Actor Request | Only actors with `hr_staff` / `hr_admin` permitted | HTTP 403 `FORBIDDEN` | PASSED |

## Test Proof
- `PersonnelPlanD2FinalClosureD2Phase5.test.jsx` (Tests 28–32) — PASSED
