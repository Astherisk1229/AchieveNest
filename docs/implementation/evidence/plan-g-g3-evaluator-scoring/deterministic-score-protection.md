# Deterministic Score Protection Verification

## Anti-Override Enforcement for Deterministic Criteria

Deterministic criteria calculated under Plan F (e.g., educational qualifications, seminars, years of service) cannot be arbitrarily modified by evaluators.

### Invariants Verified:
1. **Arbitrary Override Rejected**:
   - For criterion `A.1 Doctorate Degree` with Plan F calculated points = `60.0`, evaluator attempting to enter accepted points = `70.0` is **rejected**:
     `"Arbitrary override of deterministic Plan F scoring is prohibited for criterion [A.1 Doctorate Degree]."`
2. **Deterministic Confirmation Allowed**:
   - Entering accepted points matching the calculated `60.0` points is accepted as an official confirmation of the deterministic value.
