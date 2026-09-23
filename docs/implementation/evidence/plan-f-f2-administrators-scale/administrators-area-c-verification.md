# Administrators Scale — Area C Verification (`AREA_C_SERVICE_LEADERSHIP`)

## Area Overview
- **Area Code**: `AREA_C_SERVICE_LEADERSHIP`
- **Area Label**: `Area C: Service and Leadership`
- **Area Cap**: `40.0 points`

---

## C.1 Involvement in Extra-Curricular Activities / Recognized School Organizations (`C1_EXTRA_CURRICULAR_ORGANIZATIONS`)
Deterministic subcategory schedule with 30.0 point sub-ceiling:

| Subcategory Key | Subcategory Label | Points | Ceiling | Required Fields |
|---|---|---|---|---|
| `moderator` | Moderator of Clubs/Organizations | 20.0 pts | 30.0 pts (Category sub-ceiling) | `title`, `c1_subcategory`, `period`, `proof` |
| `coach_trainer` | Coach/Trainer | 20.0 pts | 30.0 pts | `title`, `c1_subcategory`, `period`, `proof` |
| `working_committee` | Membership in Working Committees | 20.0 pts | 30.0 pts | `title`, `c1_subcategory`, `period`, `proof` |
| `rendered_service` | Rendered Service during intramurals, etc., others | 10.0 pts | 30.0 pts | `title`, `c1_subcategory`, `period`, `proof` |

---

## C.2 Community Involvement (`C2_COMMUNITY_INVOLVEMENT`)
Deterministic community involvement schedule with 30.0 point sub-ceiling:

| Category Key | Category Label | Points | Ceiling | Required Fields |
|---|---|---|---|---|
| `church_activities` | Active involvement in church activities | 25.0 pts | 30.0 pts (Category sub-ceiling) | `title`, `c2_category`, `period`, `proof` |
| `community_civic` | Active involvement in community/civic activities | 25.0 pts | 30.0 pts | `title`, `c2_category`, `period`, `proof` |
| `charity_projects` | Support to charity and community projects | 5.0 pts | 30.0 pts | `title`, `c2_category`, `period`, `proof` |

---

## C.3 Number of Years of Service at NDMU (`C3_YEARS_OF_SERVICE`)
- **Calculation Formula**: `1 point per 2 completed years of service`
- **Mathematical Expression**: `Math.floor(years / 2) * 1`
- **Maximum Ceiling**: `10.0 points` (achieved at 20 completed years)
- **Authority Type**: `server_derived = true`
- **Personnel Constraint**: Completely read-only / server-derived; Personnel cannot type, edit, or claim custom point values.
- **Verification Thresholds**:
  - 0 years = 0 pts
  - 1 year = 0 pts
  - 2 years = 1 pt
  - 3 years = 1 pt
  - 4 years = 2 pts
  - 10 years = 5 pts
  - 20 years = 10 pts
  - 25 years = 10 pts (capped)
