# Accepted Points Persistence & Audit Metadata

## Separate Persistence Boundary

Phase G3 persists accepted values and scoring metadata separately from candidate accomplishment submissions:

### Recorded Metadata:
1. `accepted_points`: Authoritative accepted score entered by the evaluator.
2. `evaluator_user_id`: Authenticated profile ID of the reviewer.
3. `evaluator_role`: Authorized reviewer role (`dean` or `hr_staff`).
4. `scoring_status`: Transitioned from `awaiting_evaluator` to `scored`.
5. `evaluator_reason`: Evaluator rationale / audit remarks.
6. `evaluated_at`: ISO timestamp of score submission.

### Candidate Accomplishment Immutability:
- Original submission title, description, category, organizer, and evidence links remain 100% immutable.
