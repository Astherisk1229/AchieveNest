# Scoring Completion Verification

## Authoritative Scoring Completion Tracking

1. **Incomplete Triggers**:
   - Any judgment criterion where `accepted_points === null`.
   - Any missing Non-Teaching Area A component.
   - Result status stays `pending`, and `plan_f_final_result` remains `null`.
2. **Complete Triggers**:
   - All judgment items scored (`accepted_points !== null`).
   - Non-Teaching Area A ratings complete.
   - Result status transitions to `result_ready`, and Plan F determines `Passed` or `Retained`.
