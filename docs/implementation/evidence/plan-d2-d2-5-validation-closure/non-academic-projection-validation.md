# Non-Academic Placement Projection Validation

## Canonical Rule

For all Non-Academic Personnel:
- `Non-Teaching Faculty` + `Non-Academic`

The downstream **Evaluation Summary Department** display field resolves strictly to the **selected Department / Office name** (from administrative units).

## Technical Mechanics
1. **Utility**: `resolveEvaluationDepartmentLabel(record)` and `resolveEvaluationDepartmentMetadata(record)`.
2. **Metadata**: Returns `{ department_display: administrative_unit_name, department_source: 'administrative_unit' }`.
3. **Identity Preservation**: The underlying `administrative_unit_id` UUID remains the canonical institutional identity in `personnel_administrative_unit_affiliations`. College is not substituted.

## Test Proof
- `PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx` (Tests 3, 6) — PASSED
- `PersonnelPlanD2FinalClosureD2Phase5.test.jsx` (Test 8) — PASSED
