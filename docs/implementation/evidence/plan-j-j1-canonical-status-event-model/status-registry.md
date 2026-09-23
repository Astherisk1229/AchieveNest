# Canonical Lifecycle Status Registry

## Authoritative 5 Canonical Statuses
The workflow is strictly governed by 5 internal status keys in `personnel_evaluations.status`:

1. `submitted`: Whole-portfolio package submitted by Faculty/Personnel.
2. `in_evaluation`: Active reviewer evaluation in progress.
3. `returned_for_revision`: Whole-portfolio returned with revision instructions.
4. `ready_for_finalization`: All criteria scored; ready for HR finalization.
5. `completed`: Final locked state with permanent promotion decision.

No ambiguous status keys (`under_review`, `finalized`, `done`) are permitted for new status transitions.
