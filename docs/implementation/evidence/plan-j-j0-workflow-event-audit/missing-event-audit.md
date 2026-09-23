# Missing Workflow Event Audit

## Identified Event Gaps for Plan J
The following material transitions currently update entity columns but lack a dedicated, discrete row in `personnel_evaluation_events`:
1. `reviewer_assigned` / `reviewer_rerouted`
2. `review_started`
3. `qualification_state_changed`
4. `scoring_completed`
5. `report_summary_generated`

**Resolution Plan**: Plan J Phase J1 will establish canonical event keys for these transitions, and Phase J5 will persist them to the immutable audit trail.
