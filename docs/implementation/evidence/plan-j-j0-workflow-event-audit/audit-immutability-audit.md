# Audit Log Immutability & Mutation Protection

## Immutability Architecture
- `personnel_evaluation_events`, `audit_logs`, and `evaluation_scale_change_events` are append-only.
- RLS policies and database constraints prohibit `UPDATE` and `DELETE` queries on audit tables for all standard authenticated roles (`faculty`, `dean`, `department_secretary`).
- `created_at` timestamps are generated server-side via `now()`.
- Client cannot mutate or backdate event records.
