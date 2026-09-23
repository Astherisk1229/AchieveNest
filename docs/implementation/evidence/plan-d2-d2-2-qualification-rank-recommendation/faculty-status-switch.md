# Phase D2-2: Faculty Status Switch Behavior

## Switching Status Contexts
When HR switches `Faculty Status` between `Full-time Faculty` and `Part-time Faculty`:

1. **Catalog Re-binding**:
   - The rank dropdown instantly switches to load the corresponding authoritative catalog (26 Full-Time Ranks vs 4 Part-Time Titles).
2. **Recommendation Re-computation**:
   - The resolver re-executes using the new status context.
   - For example:
     - `PhD` under Full-Time resolves `Professor I` (`PROFI_1`).
     - Switching to Part-Time re-resolves the same `PhD` to `Professorial Lecturer` (`PROF_LECTURER`).
3. **Incompatible Value Reset**:
   - For NEW personnel records with no saved rank, switching status clears any incompatible previously preselected rank and preselects the newly resolved title.
   - For EXISTING records, the saved current rank is maintained for edit safety.
