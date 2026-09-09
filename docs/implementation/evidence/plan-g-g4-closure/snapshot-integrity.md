# Snapshot Integrity Regression Verification

## Historical Submitted Snapshot Immutability

The evaluator reviews exclusively the historical submission snapshot generated during Plan C:

1. **Decoupled from Live Portfolio**: Subsequent changes or additions to the candidate's active portfolio do not affect the submitted snapshot.
2. **Read-Only Personnel Profile**: Master data (Rank, College, Department, Designation) is strictly read-only.
3. **Preserved Item Metadata**: Title, organizer, dates, and evidence attachments remain immutable.
