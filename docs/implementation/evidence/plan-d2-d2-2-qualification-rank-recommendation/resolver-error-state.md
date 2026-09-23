# Phase D2-2: Resolver Error Handling

## Error Safety Principles
When the recommendation API endpoint encounters a network error, 500 status code, or unhandled exception:

1. **No Silent Overwrite**: The current saved or selected rank in the form is preserved without alteration.
2. **No Fabricated Fallback**: The system does NOT inject arbitrary hardcoded defaults or guess a rank.
3. **Controlled Error State**:
   - `recommendationState.status` transitions to `'error'`.
   - Helper text displays a non-blocking diagnostic note:
     `Unable to resolve rank recommendation at this time. You may select a rank manually from the catalog.`
4. **Manual Catalog Selection Available**: HR users can continue provisioning by manually selecting any valid rank from the authoritative master-data catalog.
