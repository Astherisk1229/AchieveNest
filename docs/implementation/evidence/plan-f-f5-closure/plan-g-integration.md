# Personnel Evaluation Track — Plan F — Phase F5: Plan G Integration & Evaluator Workspace

## Integration Boundary: Plan G (Reviewer Routing & Evaluation Workspace)

### Plan G Responsibilities:
- Reviewer assignment and routing pipelines;
- Evaluator permission verification and role delegation;
- Evaluation review workspace UI and justification recording.

### Plan F Scoring Authority Consumption by Plan G:
- **Unified Scoring Rules**: Plan G does not declare or maintain separate point schedules or caps; it consumes `EvaluationInstrumentRegistry` and `PersonnelEvaluationScoringService`.
- **Evaluator Accepted Point Ceilings**: Plan G cannot submit accepted points exceeding the maximum configured in Plan F (`B.3` max 40.0, `B.6` max 20.0, `B.5` max 30.0).
- **Finalization Handoff**: Once Plan G evaluators complete scoring for all criteria and Area A evaluation (for Non-Teaching), Plan G triggers `PersonnelEvaluationResultService.determineResult()` to obtain authoritative `Passed`/`Retained` results.
