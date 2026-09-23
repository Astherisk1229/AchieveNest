# Phase D2-2: Race Condition Protection

## Concurrency and Request Ordering
When HR rapidly types or selects qualifications (e.g. switching from `Bachelor's` -> `Master's` -> `PhD`):

1. **Sequential Request Token**:
   - `personnelRankRecommendationService` maintains an incrementing internal counter `_currentSequenceId`.
   - Each outbound resolution request captures this sequence ID.
2. **Latest Check Evaluation**:
   - The response includes a helper callback `isLatest(response.sequenceId)` to verify whether a subsequent request was launched before this one resolved.
   - If `isLatest(...)` returns `false`, the component silently ignores the stale resolution and retains the latest active state.
3. **No Flashing UI**:
   - Out-of-order network responses cannot overwrite the newer selection's recommendation.
