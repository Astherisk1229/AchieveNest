# Resubmission Audit Evidence

- **Event Key**: `portfolio_resubmitted`
- **Display Label**: "Revised Portfolio Resubmitted"
- **Actor**: Candidate (`Personnel`)
- **Captured Fields**: `portfolio_version_number: 2` (incremented), `before_state: "returned_for_revision"`, `after_state: "submitted"`, `metadata: { prior_version_number: 1 }`, `occurred_at`.
- **Lineage**: Reconstructs V1 -> V2 lineage transparently.
