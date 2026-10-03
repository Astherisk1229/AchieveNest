# Snapshot Integrity Verification

## Plan C Snapshot Immutability

The Phase G2 Evaluator Workspace reviews exclusively the frozen Plan C submission snapshot (`submitted_snapshot_v1`).

### Invariants Verified:
1. **Submission Metadata Preserved**:
   - `snapshot_version`: `v1.0.0`
   - `submitted_at`: `2026-09-08T10:00:00Z`
   - `item_count`: Matches submitted count exactly.

2. **Live Mutation Defense**:
   - Changes or additions made to the candidate's active live portfolio do NOT mutate the reviewer workspace read model.
   - Evaluator reviews the historical submission snapshot payload faithfully.

3. **Read-Only Personnel Profile**:
   - Candidate master data (Rank, College, Department, Status) displayed in Header Context is strictly read-only.
   - Zero mutation or edit controls exposed to the reviewer.
