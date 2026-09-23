# Promotion Decision Recorded Event (`promotion_decision_recorded`)

## Specification
- **Trigger**: HR Admin records official board promotion decision (Plan H3).
- **Actor**: HR Admin (`hr_admin` / `hr_staff`).
- **Required Metadata**: `promotion_decision` (`Approved` | `Not Approved`), `current_rank`, `approved_rank` (if approved), `effective_date`.
- **Idempotency**: `promotion_decision_recorded:{evaluationId}:v{versionNumber}`.
