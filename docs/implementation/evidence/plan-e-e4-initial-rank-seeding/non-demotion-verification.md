# Phase E4 Evidence: Non-Demotion Verification

## Non-Demotion Invariant & Test Proofs

1. **Rule**:
   - Initial rank seeding applies exclusively to personnel records with missing or unresolved ranks.
   - An existing valid rank is NEVER reset, downgraded, or demoted to the base starting rank of a qualification group.
2. **Examples Verified**:
   - Personnel with existing rank `Associate Professor II` and Master's degree qualification: Current rank remains `Associate Professor II` (Preserved, `current_rank_valid`).
   - Personnel with existing rank `Professor IV` and Doctoral degree: Current rank remains `Professor IV` (Preserved, not reset to base `Professor I`).
   - Personnel with existing rank `Senior Instructor III` and Licensure: Current rank remains `Senior Instructor III` (Preserved, not reset to base `Senior Instructor`).
