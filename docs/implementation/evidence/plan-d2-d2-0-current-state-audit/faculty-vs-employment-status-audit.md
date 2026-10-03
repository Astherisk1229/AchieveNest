# Faculty Status vs Employment Status Audit — Plan D2 Phase D2-0

### Separation of Independent Concepts

1. **Faculty Status / Engagement**:
   - `full_time_faculty` (Full-Time Faculty)
   - `part_time_faculty` (Part-Time Faculty)
   - Stored in: `personnel_profiles.faculty_engagement`

2. **Employment Status / Tenure**:
   - `permanent` (Permanent / Regular)
   - `probationary` (Probationary / Tenure-Track)
   - Stored in: `personnel_profiles.employment_status`

### The 4-Way Independent Matrix

| Engagement | Employment Status | Valid? | Interpretation |
|---|---|---|---|
| `full_time_faculty` | `permanent` | **YES** | Regular full-time tenured/permanent faculty |
| `full_time_faculty` | `probationary` | **YES** | Full-time tenure-track faculty |
| `part_time_faculty` | `permanent` | **YES** | Permanent faculty with reduced / part-time workload |
| `part_time_faculty` | `probationary` | **YES** | Probationary part-time faculty |

### Legacy Conflation Audit
- In legacy frontend files (e.g. `HRModel.EMPLOYMENT_STATUSES`), compound strings like `"Full-Time Permanent"` or `"Full-Time Probationary"` were used.
- The active UI (`OnboardPersonnelModal.jsx`, `EditMasterDataModal.jsx`) correctly presents these as two separate, orthogonal radio groups.
