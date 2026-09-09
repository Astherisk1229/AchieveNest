# Scoring Completion Verification

## Completion Conditions & Plan F Result Integration

Scoring completion transitions dynamically based on pending evaluator inputs:

### 1. Incomplete State:
- If any judgment criterion (e.g. `B.3`, `B.6`, or `B.5`) has `accepted_points === null`:
  - `scoring_complete = false`
  - `plan_f_result_status = 'pending'`
  - `plan_f_final_result = null`
- For Non-Teaching, if Area A rating inputs are incomplete:
  - `scoring_complete = false`

### 2. Complete State:
- When all judgment items are evaluated and Area A inputs are submitted:
  - `scoring_complete = true`
  - `plan_f_result_status = 'result_ready'`
  - Plan F determines final outcome:
    - Overall Total >= Passing Score -> `'Passed'`
    - Overall Total < Passing Score -> `'Retained'`
