# Evaluation Result Audit (Plan F)

## Canonical Vocabulary
- **`Passed`**: Candidate's total score meets or exceeds the scale threshold (>= 120.0 for Administrators; >= 75.0 for Non-Teaching).
- **`Retained`**: Candidate's total score is below the passing threshold.

## Invariants
- Evaluation Result is an objective mathematical outcome derived strictly by Plan F scoring rules.
- It is stored in `final_snapshot.evaluation_result` and `personnel_evaluations.evaluation_result`.
- It does NOT equal Promotion Decision.
