# Reviewer Comment Storage Audit

## Findings
- **Evaluation Level Remarks**: Stored in `personnel_evaluations.evaluator_remarks`.
- **Item Level Remarks**: Stored in `personnel_evaluation_items.evaluator_remarks`.
- **Event History**: Recorded in `personnel_evaluation_events.payload`.
- **Personnel Visibility**: Feedback remarks are visible to the Personnel owner upon return for revision and finalization.
- **Immutability**: Once recorded in a finalized or submitted snapshot, remarks are locked.
