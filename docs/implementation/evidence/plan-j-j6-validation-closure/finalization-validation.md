# Evaluation Finalization Validation Evidence

### Finalization Invariants
- Pre-requisites (scoring completed, H0 readiness) satisfied before finalization.
- Evaluation status becomes `completed`.
- Immutable lock applied (`is_locked: true`).
- Neutral completion notification sent to candidate.
- Repeated finalization attempts are idempotent and reject mutation.
- Completed status does not imply promotion approval.
