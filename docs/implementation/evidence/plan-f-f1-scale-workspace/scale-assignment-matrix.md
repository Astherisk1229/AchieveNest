# Plan F Phase F1 Evidence: Scale Assignment Matrix

## Server-Authoritative Scale Assignment Rules

| Personnel Group | Organizational Side | Canonical Scale Assigned | Rule Version | Passing Threshold |
|---|---|---|---|---|
| `faculty` | `academic` | `ADMINISTRATORS_RANKING_SCALE` | `NDMU-PERSONNEL-RATING-V2` | 120.0 / 160.0 |
| `non_teaching_faculty` | `academic` | `ADMINISTRATORS_RANKING_SCALE` | `NDMU-PERSONNEL-RATING-V2` | 120.0 / 160.0 |
| `non_teaching_faculty` | `non_academic` | `NON_TEACHING_PERSONNEL_RANKING_SCALE` | `NDMU-PERSONNEL-RATING-V2` | 75.0 / 150.0 |
| `faculty` | `non_academic` | **REJECTED** (`unsupported_personnel_combination`) | `NDMU-PERSONNEL-RATING-V2` | N/A |

## Invariant Guarantees
- Scale assignment is 100% server-authoritative.
- Personnel cannot select or override their assigned scale.
