# Personnel Evaluation Track — Plan G — Phase G1: Plan F Scoring Boundary

## Scoring Authority & Plan F Governance

### Invariants Maintained in Phase G1:
1. **Zero Scoring Logic in G1**: Phase G1 deals strictly with reviewer routing, binding evaluator accounts, and queue filtering. No scoring formulas, caps, or passing calculations are declared or modified in G1.
2. **Preservation of Scale and Rule Version**: Each queue record and assignment DTO preserves the canonical `evaluation_scale_code` and `rule_version = 'NDMU-PERSONNEL-RATING-V2'`.
3. **Downstream Readiness**: Official accepted-point inputs (Phase G3) will consume Plan F constraints directly without bypassing `PersonnelEvaluationScoringService.php`.
