# Score Integrity Validation Verification

## Score Integrity & Bounds Validation

1. **Negative Score Detection**:
   - Negative accepted scores (e.g. `-5.0`) trigger immediate rejection: `invalid_score_state`.
2. **Criterion Max Violation**:
   - Accepted points exceeding criterion limits (e.g. Research > 40.0, Creative Work > 20.0, Meritorious Award > 30.0) trigger `invalid_score_state`.
3. **Area & Scale Bounds**:
   - Scores violating scale maximums (Admin 160, Non-Teaching 150) trigger `invalid_score_state`.
