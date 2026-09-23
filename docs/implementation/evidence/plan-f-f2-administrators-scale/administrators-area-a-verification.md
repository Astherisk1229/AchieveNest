# Administrators Scale — Area A Verification (`AREA_A_PROFESSIONAL_DEVELOPMENT`)

## Area Overview
- **Area Code**: `AREA_A_PROFESSIONAL_DEVELOPMENT`
- **Area Label**: `Area A: Professional Development`
- **Area Cap**: `70.0 points`

---

## A.1 Degree/s (`A1_DEGREES`)
Deterministic qualification/degree and earned units schedule:

| Classification Key | Classification Label | Point Calculation | Ceiling | Required Fields |
|---|---|---|---|---|
| `phd_degree` | Ph.D. Degree Holder | 40.0 pts flat | N/A | `degree_name`, `institution`, `proof` |
| `phd_units` | Ph.D. Units | 2 pts per 3 completed units | 10.0 pts | `units_completed`, `institution`, `proof` |
| `ma_degree` | MA Degree Holder | 20.0 pts flat | N/A | `degree_name`, `institution`, `proof` |
| `ma_units` | MA Units | 1 pt per 3 completed units | 10.0 pts | `units_completed`, `institution`, `proof` |

### Unit Threshold Rules & Boundary Behavior
- `phd_units`: Floor division `Math.floor(units / 3) * 2`, capped at 10. (e.g., 2 units = 0 pts; 3 units = 2 pts; 5 units = 2 pts; 6 units = 4 pts; 15 units = 10 pts; 20 units = 10 pts).
- `ma_units`: Floor division `Math.floor(units / 3) * 1`, capped at 10. (e.g., 2 units = 0 pts; 3 units = 1 pt; 5 units = 1 pt; 6 units = 2 pts; 30 units = 10 pts; 35 units = 10 pts).

---

## A.2 Active Membership to Professional Organizations (`A2_PROFESSIONAL_ORGANIZATION_MEMBERSHIP`)
Deterministic organizational membership schedule:

| Role Key | Role Label | Points | Required Fields |
|---|---|---|---|
| `member` | Member | 5.0 pts per membership | `organization_name`, `membership_role`, `period`, `proof` |
| `officer` | Officer | 10.0 pts per office held | `organization_name`, `membership_role`, `officer_position`, `period`, `proof` |

---

## A.3 Attendance to Seminars/Trainings for Professional Development (`A3_SEMINARS_TRAININGS`)
Deterministic scope-based attendance schedule:

| Scope Key | Scope Label | Points | Ceiling | Required Fields |
|---|---|---|---|---|
| `in_house` | In-house | 3.0 pts | 20.0 pts (Category sub-ceiling) | `title`, `venue`, `date_completed`, `seminar_scope`, `proof` |
| `city_provincial` | City/Provincial | 4.0 pts | 20.0 pts | `title`, `venue`, `date_completed`, `seminar_scope`, `proof` |
| `regional` | Regional | 6.0 pts | 20.0 pts | `title`, `venue`, `date_completed`, `seminar_scope`, `proof` |
| `national` | National | 8.0 pts | 20.0 pts | `title`, `venue`, `date_completed`, `seminar_scope`, `proof` |
| `international` | International | 10.0 pts | 20.0 pts | `title`, `venue`, `date_completed`, `seminar_scope`, `proof` |

Area A satisfies 100% of frozen Phase F0 instrument specifications.
