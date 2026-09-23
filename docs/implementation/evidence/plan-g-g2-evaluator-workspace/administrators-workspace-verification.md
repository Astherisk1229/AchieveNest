# Administrators Scale Workspace Verification

## Scale: `ADMINISTRATORS_RANKING_SCALE`
- **Rule Version**: `NDMU-PERSONNEL-RATING-V2`
- **Overall Maximum**: 160 points
- **Passing Threshold**: 120 points

### Area Structure & Rendering
1. **Area A — Educational Qualification & Experience**:
   - Max Allowed: 70.0 points
   - Deterministic server scoring: Degree type, units, service tenure.
   - Shows raw points, capped points, and rule explanation.
2. **Area B — Professional Development & Achievements**:
   - Max Allowed: 50.0 points
   - Deterministic items: Seminars (B.1), Trainings (B.2), Awards (B.4), Memberships (B.5), Certifications (B.7).
   - Judgment items: Research (B.3, max 40.0), Creative Work (B.6, max 20.0) rendered with `awaiting_evaluator` status and max allowed point limits.
3. **Area C — Community Extension & Institutional Service**:
   - Max Allowed: 40.0 points
   - Deterministic scoring with cap breakdown.

### Read-Only Protection
- All claimed/advisory points and server calculated points are displayed.
- Zero accepted-score entry inputs or override buttons exist in Phase G2.
