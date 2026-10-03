# Evaluation Finalized Event (`evaluation_finalized`)

## Specification
- **Trigger**: HR seals evaluation and applies final lock (Plan H4).
- **Actor**: HR Admin.
- **Required Metadata**: `evaluation_result`, `promotion_decision`, `finalized_by`, `finalized_at`.
- **Invariants**: Emitted exactly once upon finalization lock; evaluation status transitions to `completed`.
