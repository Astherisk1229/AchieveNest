# College Loading, Error, and Empty States — Plan D2 Phase D2-1

## State Handlers in Dropdown
1. **Loading State**:
   - `disabled={masterData.loading}`
   - Placeholder option: `<option value="">Loading Colleges...</option>`
2. **Error State**:
   - Displays warning banner: `masterData.error` ("Failed to load authoritative master data catalogs.")
   - Prevents unconstrained submission.
3. **Empty State**:
   - When API returns zero active rows and loading completes, displays explicit disabled option: `<option value="" disabled>No institutional colleges found</option>`.
