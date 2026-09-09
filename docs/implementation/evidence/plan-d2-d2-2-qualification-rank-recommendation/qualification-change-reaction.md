# Phase D2-2: Qualification Change Reaction & Async Handling

## Reactive Lifecycle
When HR updates the `Educational Qualification` or `Faculty Status` input:
1. **Debounce / Effect Trigger**: An asynchronous request is initiated to `personnelRankRecommendationService.resolveRecommendation`.
2. **Loading Indicator**: The recommendation state transitions to `status: 'loading'`.
3. **Completion**:
   - On success: State transitions to `status: 'resolved'`, populating `recommendedCode`, `recommendedLabel`, and `helperText`.
   - On error / no-match: State transitions to `status: 'error'` or `status: 'no_match'`.

## Deterministic State & Sequence IDs
To prevent rapid input changes (e.g. `Master's` -> `Doctorate` -> `Bachelor's`) from rendering stale out-of-order responses:
- Each resolution call receives an incrementing integer `sequenceId`.
- The service tracks the latest sequence ID and discards responses from superseded requests.
- The UI reflects only the deterministic result corresponding to the current form input.
