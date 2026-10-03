# Reviewer Assigned Event (`reviewer_assigned`)

## Specification
- **Trigger**: College Dean or HR evaluator assigned to portfolio evaluation (Plan G0).
- **Actor**: Assigning authority (HR Admin / Dean).
- **Required Metadata**: `reviewer_id`, `reviewer_role`, `assigned_scope` (e.g. `COLLEGE-CCS` or `INSTITUTIONAL`).
- **Idempotency**: `reviewer_assigned:{evaluationId}:{reviewerId}`.
