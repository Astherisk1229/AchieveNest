# Finalization & Lock Audit Evidence

- **Event Keys**: `evaluation_finalized`, `evaluation_locked`
- **Display Labels**: "Personnel Evaluation Finalized", "Evaluation Record Locked"
- **Actor**: `HR`
- **Captured Fields**: `evaluation_id`, `before_state: "ready_for_finalization"`, `after_state: "completed"`, `metadata: { is_locked: true }`.
- **Idempotency**: Repeated GET/preview requests do not generate duplicate finalization audit rows.
