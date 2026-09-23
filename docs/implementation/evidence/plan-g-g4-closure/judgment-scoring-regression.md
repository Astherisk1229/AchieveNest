# Judgment Scoring Regression Verification

## Evaluator Judgment Criteria Enforcement

1. **Administrators Scale**:
   - `B.3` Research: max `40.0` points (accepts 0–40, rejects > 40).
   - `B.6` Creative Work: max `20.0` points (accepts 0–20, rejects > 20).
2. **Non-Teaching Scale**:
   - `B.5` Recognition / Meritorious Award: max `30.0` points (accepts 0–30, rejects > 30).
3. **Semantic Distinction**:
   - `null`: Unresolved, blocks scoring completion.
   - `0.0`: Explicit zero accepted points, marked as scored, enables completion.
4. **Deterministic Protection**:
   - Arbitrary manual overrides of calculated Plan F deterministic scores are strictly rejected.
