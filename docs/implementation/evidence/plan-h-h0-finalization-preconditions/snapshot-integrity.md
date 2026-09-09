# Snapshot Integrity Verification

## Plan C Snapshot Preservation

1. **Submission Snapshot Source**:
   - The readiness service validates that the evaluation references a valid submitted snapshot array (`snapshotData.items`).
   - Missing or corrupt snapshot data triggers `snapshot_invalid`.
2. **Decoupled from Live Edits**:
   - Live working portfolio edits do not alter the submitted snapshot evaluated for finalization.
