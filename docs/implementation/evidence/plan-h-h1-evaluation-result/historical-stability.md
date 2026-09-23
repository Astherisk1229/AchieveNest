# Plan H Phase H1 — Historical Stability & Idempotency Evidence

### Historical Stability
- The evaluation outcome is permanently bound to the frozen rule version `NDMU-PERSONNEL-RATING-V2` and the specific assigned scale (`ADMINISTRATORS_RANKING_SCALE` or `NON_TEACHING_PERSONNEL_RANKING_SCALE`).
- Subsequent runtime configuration updates cannot mutate or recompute historical finalized results.

### Idempotency
- When `recordEvaluationResult` is invoked on an already-finalized evaluation, it returns the existing stable record with `reason_code: 'result_already_recorded'`.
- Duplicate audit records, event storms, and timestamp rewrites are prevented.
