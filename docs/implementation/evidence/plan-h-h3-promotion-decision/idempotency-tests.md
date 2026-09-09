# Plan H Phase H3 — Idempotency & Stability Evidence

### Test Summary
- **Test File**: `frontend/src/controllers/__tests__/PersonnelPromotionDecisionH3.test.jsx`
- **Test 7.1**: `repeated Approved submission returns existing decision without advancing rank twice` (Passed).
- **Test 7.2**: `repeated Not Approved submission returns existing decision without duplicating records` (Passed).
- **Enforcement**: Returns `reason_code: 'promotion_decision_already_recorded'` and prevents double-promotion side effects.
