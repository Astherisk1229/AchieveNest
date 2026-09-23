# Scoring Completeness Verification

## Scoring Completion Guard

1. **Unresolved Evaluator Judgment Guard**:
   - Any judgment criterion (Admin B.3, Admin B.6, Non-Teaching B.5) remaining with `accepted_points === null` blocks finalization.
   - Reason Code: `scoring_incomplete` (`Not ready for finalization — evaluator scoring is incomplete.`)
2. **Non-Teaching Area A Guard**:
   - Non-Teaching evaluations missing Job Performance, Personal Attitudes, or Efficiency ratings are blocked with `scoring_incomplete`.
3. **Explicit Zero Handling**:
   - Explicit `0.0` is recognized as a valid scored value and does not block finalization.
