# Promotion Decision Separation (Plan H / J1)

## Canonical Promotion Vocabulary
- `Approved`: HR Board-approved faculty rank progression recommendation.
- `Not Approved`: Denied promotion recommendation; retains current rank without demotion.

## Governance Invariant
- Promotion Decision is strictly an administrative board governance outcome.
- It is stored in `personnel_evaluations.promotion_decision` and recorded via `promotion_decision_recorded` event.
- It is never stored as a lifecycle status.
- It is never conflated with `Passed` or `Retained`.
