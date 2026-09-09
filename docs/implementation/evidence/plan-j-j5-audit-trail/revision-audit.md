# Revision Request Audit Evidence

- **Event Key**: `revision_requested`
- **Display Label**: "Portfolio Returned for Revision"
- **Actor**: Evaluator (`Dean` or `HR`)
- **Captured Fields**: `portfolio_version_number`, `before_state: "in_evaluation"`, `after_state: "returned_for_revision"`, `metadata: { reason, item_comments }`, `occurred_at`.
- **Integrity**: Prior submitted version remains immutable and historical.
