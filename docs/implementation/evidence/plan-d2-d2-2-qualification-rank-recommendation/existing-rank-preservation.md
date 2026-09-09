# Phase D2-2: Existing-Rank Preservation & Non-Overwrite Safety

## Critical Safety Rule
> **Recommendation is strictly advisory and must NEVER silently replace or mutate an established official current rank.**

## Verified Modal Mechanics (`EditMasterDataModal.jsx`)
1. When editing an existing personnel record with a saved current rank (e.g., `Associate Professor II`):
   - The dropdown initializes to `Associate Professor II` (`current_academic_rank`).
2. When HR modifies the qualification (e.g., from `Master of Arts` to `Doctor of Philosophy (PhD)`):
   - The resolver computes a recommendation of `Professor I`.
   - The dropdown value **REMAINS** `Associate Professor II`.
   - The advisory badge and helper text update to:
     `Recommended: Professor I (Suggested from qualification. HR may change this if the personnel has an existing official rank.)`
3. If HR saves master data without touching the rank dropdown:
   - The saved record retains `current_academic_rank: "Associate Professor II"`.
   - No auto-promotion or silent mutation occurs.

## Higher / Lower Qualification Invariance
- **Higher Qualification**: Entering a Doctoral degree does **not** auto-promote an Associate Professor or Instructor.
- **Lower Qualification**: Entering a Baccalaureate degree does **not** auto-downgrade a Professor.
