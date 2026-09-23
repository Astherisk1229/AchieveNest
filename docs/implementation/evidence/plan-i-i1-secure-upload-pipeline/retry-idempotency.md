# Retry & Idempotency Safety

## Retry Invariants
1. **No Stale Row Re-use**: Retrying an upload after a network or server failure generates a fresh UUID for the evidence record.
2. **Deterministic Cleanup**: Failed previous attempts leave no partial state or lock that prevents a subsequent clean upload.
3. **Multi-File Uploads**: Successive valid uploads attach distinct evidence records to the accomplishment without corrupting previous evidence entries.
