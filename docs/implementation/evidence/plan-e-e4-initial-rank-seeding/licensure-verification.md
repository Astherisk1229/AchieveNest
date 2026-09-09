# Phase E4 Evidence: Licensure Verification Boundary

## Licensure-Dependent Seeding Rules

1. **Verified Professional Degree + Verified Licensure**:
   - Condition: Degree in recognized professional field AND `licensure_verified: true` / `board_passer: true`.
   - Result: `SENIOR_INSTRUCTOR` ("Senior Instructor").
   - Reason Code: `licensed_professional_initial_rank`.
2. **Verified Professional Degree + Missing / Unverified Licensure**:
   - Condition: Degree in recognized professional field AND `licensure_verified: false`.
   - Result: Resolves to baseline `ASSISTANT_INSTRUCTOR` ("Assistant Instructor").
   - Reason Code: `licensure_not_verified`.
   - Invariant: Zero guessing of Senior Instructor rank without explicit verified board licensure.
