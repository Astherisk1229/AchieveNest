# Evaluation Summary Department Projection Boundary — Plan D2 Phase D2-1

## Boundary Rule
- `D2-RISK-03` identified that the Evaluation Summary report header projects a generic `"Department"` string for Academic faculty instead of their College Name.
- Phase D2-1 ensures that the underlying master data (`college_id` for Academic, `administrative_unit_id` for Non-Academic) is persisted with absolute integrity.
- Updating `PersonnelEvaluationPrintService.js` and projection handlers to conditionally display College Name vs Office Name is explicitly **DEFERRED to Phase D2-4**.
