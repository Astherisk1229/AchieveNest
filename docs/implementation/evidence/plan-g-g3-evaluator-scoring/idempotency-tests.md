# Idempotency Tests Verification

## Idempotent Evaluator Saves

Repeated submission of identical evaluator scores does not corrupt data or double-count points:

### Test Scenario:
- Evaluator saves `item_b3` accepted points as `30.0`.
- System records total and updates pending count.
- Evaluator resubmits `item_b3` with `30.0` points.

### Verified Invariants:
1. `res1.official_accepted_total === res2.official_accepted_total`
2. `res1.pending_judgment_count === res2.pending_judgment_count`
3. Total snapshot item count remains identical (no duplicate rows created).
