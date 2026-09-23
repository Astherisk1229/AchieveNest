# Phase D2-3: Payload Minimality & Mutation Prevention

## Payload Integrity
When submitting updates from `EditMasterDataModal.jsx`:
- Only fields with intentional values are included.
- For academic personnel, `administrative_unit_id` is sent as `null`.
- For non-academic personnel, `college_id` and `academic_program_ids` are sent as `null`/`[]`.
- Unchanged `current_rank_title` is sent as its existing authoritative value, causing 0 database rank mutation side effects.
