# Academic Placement Projection Validation

## Canonical Rule

For all Academic Personnel:
- `Faculty` + `Academic`
- `Non-Teaching Faculty` + `Academic`

The downstream **Evaluation Summary Department** display field resolves strictly to the **selected College name**.

## Technical Mechanics
1. **Utility**: `resolveEvaluationDepartmentLabel(record)` and `resolveEvaluationDepartmentMetadata(record)`.
2. **Metadata**: Returns `{ department_display: college_name, department_source: 'college' }`.
3. **Identity Preservation**: The underlying `college_id` UUID remains the canonical institutional identity in `personnel_college_affiliations`. `administrative_unit_id` is null or secondary.

## Test Proof
- `PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx` (Tests 1–2, 4–5) — PASSED
- `PersonnelPlanD2FinalClosureD2Phase5.test.jsx` (Tests 6, 7) — PASSED
