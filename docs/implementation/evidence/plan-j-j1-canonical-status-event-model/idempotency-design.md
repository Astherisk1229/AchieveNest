# Idempotency Design for Workflow Events

## Key Generation
Idempotency keys are composed deterministically:
`generateIdempotencyKey(eventKey, evaluationId, versionNumber, transitionNonce)`

### Format Examples
- Initial Submission: `portfolio_submitted:eval-uuid-001:v1`
- Resubmission: `portfolio_resubmitted:eval-uuid-001:v2`
- Revision Return: `revision_requested:eval-uuid-001:v1`
- Promotion Decision: `promotion_decision_recorded:eval-uuid-001:v1`

## Duplicate Prevention
- Repeated POST clicks on the same action match the existing idempotency key and return the original event without creating duplicate rows.
- Page refresh / GET requests do not generate events.
