# Final Legacy Classification Migration Summary

- **Supported Mapping**: Reconciles legacy records to canonical two-group model only when backed by College or Administrative Unit placement.
- **Ambiguous & Conflicting Records**: Safely retained in unresolved reconciliation queue.
- **Idempotency**: Repeat migrations produce identical state with 0 data drift.
