# Phase D2-3: Faculty Status Switching Safety

## Switching Contexts (Full-Time ↔ Part-Time)
When HR toggles `Faculty Engagement`:

1. **New Personnel Form**:
   - Incompatible unsaved ranks are cleared immediately.
   - The resolver re-executes and preselects the applicable recommendation in the new catalog.
2. **Existing Personnel Form**:
   - The saved rank is preserved.
   - If the saved rank is incompatible with the newly selected engagement (e.g. `Associate Professor II` under `part_time_faculty`), the system marks the field as incompatible and requires explicit HR selection before saving.
   - The server validates and blocks crossover submissions with 422 `CATALOG_CROSSOVER_REJECTED`.
