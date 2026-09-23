# PhD Exception Boundary Validation

## Governance Rule

> **The Plan E PhD Exception (e.g. promoting from Assistant Professor I directly to Professor I upon doctoral attainment) belongs strictly to authorized promotion and evaluation deliberation under Plan E and Plan H, NOT automatic execution from the HR master data modal.**

## Scenario Verification
- **Record**: Saved rank `Assistant Professor I`.
- **Qualification Added**: `PhD in Computer Science`.
- **Advisory Recommendation**: Suggests `Professor I`.
- **Expected Behavior**:
  - Current rank remains `Assistant Professor I`.
  - No automatic jump to `Professor I` occurs.
  - The PhD exception can only be enacted via authorized evaluation progression or explicit HR administrative action.

## Test Proof
- `PersonnelPlanD2FinalClosureD2Phase5.test.jsx` (Test 24) — PASSED
