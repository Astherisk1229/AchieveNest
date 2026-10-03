# Evaluation Result Separation (Plan F / J1)

## Canonical Result Vocabulary
- `Passed`: Total accepted score meets or exceeds scale threshold (120.0 for Administrators, 75.0 for Non-Teaching).
- `Retained`: Total accepted score is below threshold.

## Governance Invariant
- Evaluation Result is strictly an objective scoring outcome.
- It is never stored as a lifecycle status.
- It is never converted into an event key.
- It does NOT equal Promotion Decision `Approved`.
