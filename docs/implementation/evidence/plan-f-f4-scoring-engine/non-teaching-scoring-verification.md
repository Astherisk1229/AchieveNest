# Non-Teaching Scale Scoring Verification

## Scale Ceilings
- **Overall Maximum**: `150.0 points`
- **Passing Threshold**: `75.0 points`
- **Area A Maximum**: `90.0 points` (Official Evaluation-Only / Read-Only)
- **Area B Allocation**: `60.0 points` (Personnel Achievement Area)

---

## Criterion-Level Results

### Area A: Performance and Personal Indicators
- `A.1 Job Performance`: Weight `50.0 pts` (50%), `EVALUATOR_OFFICIAL_RATING`
- `A.2 Personal Attitudes and Qualities`: Weight `10.0 pts` (10%), `EVALUATOR_OFFICIAL_RATING`
- `A.3 Efficiency`: Weight `30.0 pts` (30%), `EVALUATOR_OFFICIAL_RATING`
- **Personnel Mutation**: Disallowed / Rejected.

### Area B: Service to School and Community
- `B.1 School Activities / Recognized Organizations`:
  - Moderator / Officer of Clubs: `30.0 pts`
  - Trainer / Coach: `20.0 pts`
  - Working Committee: `20.0 pts`
  - Rendered Service: `10.0 pts`
  - Sub-Ceiling: `30.0 pts`
- `B.2 Community Involvement`:
  - Church Activities: `25.0 pts`
  - Civic / Community Activities: `25.0 pts`
  - Charity Projects: `5.0 pts`
  - Sub-Ceiling: `30.0 pts`
- `B.3 Number of Years at NDMU`:
  - `floor(completed_years / 2) * 1`, Max `10.0 pts`, `server_derived = true`
- `B.4 Invited as Judge, Lecturer, Resource Person`:
  - `5.0 pts per qualifying invitation`, Sub-Ceiling: `30.0 pts`
- `B.5 Recognition / Meritorious Award`:
  - `evaluator_judgment_required = true`, Max `30.0 pts`, accepted score initially `null`
