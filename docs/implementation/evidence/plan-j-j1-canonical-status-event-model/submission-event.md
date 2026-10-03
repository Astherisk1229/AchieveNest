# Portfolio Submitted Event (`portfolio_submitted`)

## Specification
- **Trigger**: Whole-portfolio submission committed under evaluation root (Plan C1).
- **Actor**: Personnel owner (`faculty` / `personnel`).
- **Required Metadata**: `version_number`, `total_items`, `academic_year`.
- **Idempotency**: `portfolio_submitted:{evaluationId}:v1`.
