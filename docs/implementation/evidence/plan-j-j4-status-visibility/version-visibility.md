# Version Visibility Evidence

### Current vs Historical Version Tracking
1. **Current Context**:
   - Displays current active portfolio version (e.g. `Version 1`, `Version 2`).
   - Resubmission after a revision request increments current version number (e.g. V1 -> V2) and updates all authorized views synchronously.
2. **Historical Context**:
   - Historical revision requests and audit events retain their original immutable version pointer (`portfolio_version_number: 1`).
   - Historical evidence snapshots remain linked to their original version without corruption when new versions are submitted.
