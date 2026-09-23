# Phase D2-2: New Personnel Preselection Behavior

## Behavior on Onboarding
When creating a NEW Personnel record via `OnboardPersonnelModal.jsx`:

1. **Initial State**:
   - The personnel has no established current rank (`current_academic_rank = ''`).
   - The user fills in `Faculty Status` and `Educational Qualification`.

2. **Automatic Preselection**:
   - As soon as valid qualification context is provided, `personnelRankRecommendationService.resolveRecommendation` executes.
   - Upon successful resolution of a valid canonical code (e.g., `PROF_1` or `SR_LECTURER`), the form field `current_academic_rank` automatically preselects this value if the HR user has not yet made a manual selection.

3. **Editable & Overridable**:
   - The preselected value is not locked. The HR user can freely click the dropdown and choose any other valid rank/title from the authoritative catalog.
   - If the HR user manually selects a rank, that choice is marked as an override and is preserved even if qualification changes later.

4. **Persistence**:
   - Submitting the form persists the selected canonical ID/code via the standard D2-1 provisioning route (`/api/v1/hr/personnel/provision`).
