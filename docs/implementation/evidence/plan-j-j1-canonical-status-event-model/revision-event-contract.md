# Revision Requested Event Contract (`revision_requested`)

## Specification
- **Trigger**: Whole-portfolio returned to Personnel for revision (Plan C3).
- **Actor**: Reviewer (Dean / HR Evaluator).
- **Required Metadata**: `reason`, `required_corrections`, `returned_by`, `reviewer_name`.
- **Optional Metadata**: `item_deficiencies` array.
- **Idempotency**: `revision_requested:{evaluationId}:v{versionNumber}`.
