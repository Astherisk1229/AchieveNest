# Non-Teaching Scale Workspace Verification

## Scale: `NON_TEACHING_PERSONNEL_RANKING_SCALE`
- **Rule Version**: `NDMU-PERSONNEL-RATING-V2`
- **Overall Maximum**: 150 points
- **Passing Threshold**: 75 points

### Area Structure & Rendering
1. **Area A — Performance and Personal Indicators**:
   - Max Allowed: 90.0 points
   - Official Evaluator-Only structure. Candidate accomplishment portfolio submissions are strictly prohibited here.
   - Read-only breakdown rendered in G2:
     - Job Performance: max 50.0 pts (pending evaluator assessment)
     - Personal Attitudes & Qualities: max 25.0 pts (pending evaluator assessment)
     - Efficiency & Punctuality: max 15.0 pts (pending evaluator assessment)
   - Read-only status: `read_only_in_g2` / `awaiting_evaluator_scoring_g3`.
2. **Area B — Service and Leadership Allocation**:
   - Max Allowed: 60.0 points
   - Deterministic items: Service Years (B.1), Education/Training (B.2), Seminars/Conferences (B.3), Committee/Special Tasks (B.4), Community Involvement (B.6).
   - Judgment item: Recognition / Meritorious Award (B.5, max 30.0) rendered with pending status and max allowed limits.

### Summary
- Area A is correctly rendered as evaluator-only without portfolio accomplishment controls.
- Area B renders candidate submitted achievements with evidence references and Plan F explanations.
