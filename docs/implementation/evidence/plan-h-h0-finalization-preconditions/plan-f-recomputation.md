# Plan F Recomputation Verification

## Authoritative Total Recomputation

1. **Client Totals Ignored**:
   - Any client-submitted or cached totals (e.g. `client_total_score: 999.0`) are completely disregarded.
2. **Fresh Authoritative Computation**:
   - `PersonnelEvaluationFinalizationReadinessService` invokes the Plan F scoring engine to recompute criterion contributions, apply Area caps (Admin A:70, B:50, C:40; Non-Teaching A:90, B:60), and derive the canonical overall total.
3. **Threshold Determination**:
   - Determines `Passed` or `Retained` dynamically from authoritative scale thresholds (Admin 120 / Non-Teaching 75).
