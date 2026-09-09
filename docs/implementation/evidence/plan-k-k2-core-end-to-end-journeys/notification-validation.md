# Workflow Notification Delivery & Idempotency

- **Events Emitted**: `portfolio_submitted`, `portfolio_returned_for_revision`, `evaluation_started`, `result_finalized`.
- **Deduplication**: Duplicate event keys are suppressed idempotently.
