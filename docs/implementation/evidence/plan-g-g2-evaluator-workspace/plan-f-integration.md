# Plan F Integration Verification

## Plan F Scoring Engine Consumption

Phase G2 consumes the authoritative Plan F scoring configurations and read models directly from `PersonnelEvaluationScoringService` and `NDMU_PERSONNEL_SCALES_CONFIG`:

### Invariants Verified:
1. **Zero Point Table Duplication**:
   - G2 does not hardcode local point tables or criteria weights.
   - All scale limits (Overall Max, Passing Threshold, Area Caps) are pulled dynamically from the Plan F configuration.
2. **Deterministic Metadata Rendered**:
   - Raw server points, capped points, and rule explanations are displayed directly.
3. **Canonical Result Status Respected**:
   - Does not declare `Passed` or `Retained` prematurely while evaluator inputs remain pending (`awaiting_evaluator`).
