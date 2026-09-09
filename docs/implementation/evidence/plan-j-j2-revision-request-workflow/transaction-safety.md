# Phase J2 Evidence: Transaction Safety & Rollback Integrity

## Atomic Transaction Steps in `PersonnelRevisionRequestService::createRevisionRequest`
1. Validate reviewer authority & state.
2. Validate overall message & subordinate comments.
3. Check active revision request conflict.
4. Begin DB transaction:
   - Update `personnel_evaluations` (status = `returned_for_revision`, return_reason, evaluator_remarks).
   - Update `personnel_evaluation_items` (evaluator_remarks, verification_status = `needs_revision`).
   - Insert deterministic canonical event `revision_requested` into `personnel_evaluation_events`.
5. Commit DB transaction.
6. On error: rollback DB transaction; no state changes or events leak.
