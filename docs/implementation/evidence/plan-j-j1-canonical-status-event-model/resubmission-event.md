# Portfolio Resubmitted Event (`portfolio_resubmitted`)

## Specification
- **Trigger**: Corrected portfolio resubmitted as new version under evaluation root (Plan C4).
- **Actor**: Personnel owner.
- **Required Metadata**: `version_number` (e.g. 2), `prior_version_number` (e.g. 1), `total_items`.
- **Idempotency**: `portfolio_resubmitted:{evaluationId}:v{newVersionNumber}`.
