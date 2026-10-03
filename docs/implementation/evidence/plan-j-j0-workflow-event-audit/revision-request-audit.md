# Revision Request Record Audit

## Structure of Revision Request
In Plan C Phase C3 / G2:
- **Overall Return Reason**: Stored in `personnel_evaluations.return_reason` and in event payload.
- **Required Corrections**: Detailed instructions stored in `personnel_evaluations.evaluator_remarks` (JSON) and event payload.
- **Item-Level Deficiencies**: Array of `{ evaluation_item_id, criterion_code, comment }` mapped to individual evaluation item rows (`verification_status = 'needs_revision'`).
- **Reviewer Metadata**: Reviewer profile ID, full name, and timestamp.
- **Lifecycle Transition**: `submitted` / `in_evaluation` -> `returned_for_revision`.
