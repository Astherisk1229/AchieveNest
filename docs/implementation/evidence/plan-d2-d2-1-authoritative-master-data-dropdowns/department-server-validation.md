# Department Server-Side Validation Audit — Plan D2 Phase D2-1

## Verification Rules
- When `organizational_side = 'non_academic'`, `administrative_unit_id` is required (`MISSING_ADMINISTRATIVE_UNIT`).
- The supplied `administrative_unit_id` must match an active record in `administrative_units` table (`INVALID_ADMINISTRATIVE_UNIT`).
- Free-form office strings are rejected with 422 HTTP status.
