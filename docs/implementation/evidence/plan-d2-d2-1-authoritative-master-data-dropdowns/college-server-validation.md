# College Server-Side Validation Audit — Plan D2 Phase D2-1

## Verification Rules
- When `organizational_side = 'academic'`, `college_id` is required.
- The supplied `college_id` must exist in active institutional colleges.
- Associated `academic_program_ids` must all exist, be active, and belong to the selected college (`INVALID_PROGRAM_AFFILIATION`).
- Arbitrary college strings or non-existent IDs are rejected with 422 HTTP status.
