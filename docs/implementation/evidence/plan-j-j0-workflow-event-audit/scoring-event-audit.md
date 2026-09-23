# Scoring Decision Audit (Plan F / G)

## Scoring Lifecycle
- Fixed-option and formula items are computed automatically via `PersonnelEvaluationScoringEngine`.
- Evaluator-judgment items (e.g. Area B.3/B.6) transition from `awaiting_evaluator` to `scored`.
- Non-Teaching Area A items are entered directly by evaluator.
- Once all items are scored, evaluation achieves `scoring_complete = true` and enables Plan H handoff.
- **Finding**: Scoring entries update `personnel_evaluation_items`. Plan J Phase J1/J5 will capture scoring completion as an explicit event.
