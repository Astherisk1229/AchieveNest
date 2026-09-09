# Evaluator Judgment Handling & Plan G Constraint Verification

## 1. Unresolved State Semantics (`accepted_points = null`)
- For criteria marked `evaluator_judgment_required: true`:
  - `scoring_status = 'awaiting_evaluator'`
  - `accepted_points = null` (strictly distinct from `0.0`)
  - `evaluator_judgment_required = true`
- The evaluation aggregate total is flagged with `evaluation_status = 'provisional_pending_evaluator'`.

---

## 2. Evaluator Accepted Score Validation (Plan G Boundary)
When an authorized evaluator supplies accepted points during Plan G deliberation, `PersonnelEvaluationScoringService::validateEvaluatorAcceptedValue` enforces:
1. **Non-Negativity**: Accepted score cannot be negative (`accepted >= 0`).
2. **Ceiling Compliance**:
   - Administrators B.3 (Conduct of Research): `0.0 <= accepted <= 40.0`
   - Administrators B.6 (Creative Work): `0.0 <= accepted <= 20.0`
   - Non-Teaching B.5 (Recognition / Meritorious Award): `0.0 <= accepted <= 30.0`
3. Any score exceeding the configured ceiling is rejected with HTTP 422.
