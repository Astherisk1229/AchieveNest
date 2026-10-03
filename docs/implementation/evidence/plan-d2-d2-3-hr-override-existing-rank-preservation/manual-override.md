# Phase D2-3: Manual HR Override Behavior

## Override Mechanics
HR administrators have full authority to select any valid seeded rank from the active catalog:

1. **Manual Selection**:
   - Selecting a rank from the dropdown invokes `handleRankChange(value)`.
   - `rankWasManuallyChanged` is set to `value !== savedOfficialRank`.
   - An `HR Override` badge appears next to the dropdown label.
2. **"Use Suggested Rank" Action Helper**:
   - If the Plan E recommendation differs from the current form selection, a "Use Suggested Rank" button appears in the recommendation alert.
   - Clicking this button explicitly copies the recommended label into `form.currentRankTitle` and marks the selection source as `'recommended'`.
3. **Preservation Against Subsequent Field Changes**:
   - Once manually selected, modifying other fields (e.g. qualifications, colleges, departments, employment status) does not reset or overwrite the manual selection.
