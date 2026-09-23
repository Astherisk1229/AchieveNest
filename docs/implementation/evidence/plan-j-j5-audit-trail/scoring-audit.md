# Scoring Decision Audit Evidence

- **Event Key**: `score_decision_recorded`
- **Display Label**: "Score Decision Recorded"
- **Actor**: Evaluator (`Dean` or `HR`)
- **Captured Fields**: `evaluation_id`, `metadata: { criterion_id, points_awarded, max_points, scale_code }`, `occurred_at`.
- **Constraint**: Audits committed score decisions without logging ephemeral re-renderings or client calculations.
