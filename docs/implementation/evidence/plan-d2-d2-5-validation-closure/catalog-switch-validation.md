# Full-Time / Part-Time Catalog Switch Validation

## Verification Summary

1. **New Personnel Onboarding**:
   - Switching `Full-time Faculty` → `Part-time Faculty`: Clears any incompatible Full-Time rank selection, loads the 4 Part-Time titles, and requests a Part-Time recommendation.
   - Switching `Part-time Faculty` → `Full-time Faculty`: Clears Part-Time title, loads the 26 Full-Time ranks, and requests a Full-Time recommendation.
2. **Existing Personnel Editing**:
   - Status switches require explicit HR confirmation.
   - If an existing record's rank is incompatible with the new engagement status, a reconciliation state is presented.
   - No silent conversion of rank/title occurs.

## Test Proof
- `PersonnelMasterDataDropdownsD2Phase1.test.jsx` (Tests 9–11) — PASSED
- `PersonnelPlanD2FinalClosureD2Phase5.test.jsx` (Test 28) — PASSED
