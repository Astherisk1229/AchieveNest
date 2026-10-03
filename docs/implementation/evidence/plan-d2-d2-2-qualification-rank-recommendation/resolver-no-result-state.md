# Phase D2-2: Resolver No-Result Handling

## Unmapped / Ambiguous Qualifications
When an entered qualification string does not match any recognized academic level in the Plan E mapping rules:

1. **Explicit No-Match Classification**:
   - `recommendationState.status` transitions to `'no_match'`.
   - `recommendedCode` and `recommendedLabel` remain `null`.
2. **Deterministic UI Feedback**:
   - Helper text displays:
     `No preferred rank could be determined from the current qualification data.`
3. **No Automatic Selection**:
   - The rank dropdown is NOT preselected with an arbitrary fallback.
   - For new records, HR is presented with the full authoritative catalog to make an informed manual assignment.
