# Plan F Phase F1 Evidence: Wrong-Scale Rejection Tests

## Rejection Invariants

1. **Frontend Isolation**:
   - The workspace only renders areas and categories belonging to the assigned scale.
   - Categories from the alternate scale are hidden from dropdown selectors.
2. **Backend Enforcement**:
   - Attempts to validate or submit an accomplishment with an area/category not belonging to the assigned scale are rejected with HTTP 422 (`INVALID_AREA` or `INVALID_CATEGORY`).
   - Stale or manipulated payloads sent directly to API endpoints fail server-side validation.
