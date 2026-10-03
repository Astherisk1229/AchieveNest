# Personnel Evaluation Track — Plan G — Phase G0: Plan F Consumption Audit

## Downstream Scoring Authority Architecture

Plan G workspaces and controllers must consume the canonical scoring engine from Plan F, avoiding any independent scoring rules, caps, or passing scores.

```
+-------------------------------------------------------------+
|                     PLAN G: REVIEWER LAYER                  |
|  - Determines WHO evaluates (Dean vs HR)                    |
|  - Manages WHERE accepted points and remarks are recorded   |
|  - Controls state transitions (submitted -> in_eval -> etc) |
+------------------------------+------------------------------+
                               | Consumes Scoring Constraints & Caps
                               v
+-------------------------------------------------------------+
|                   PLAN F: AUTHORITATIVE ENGINE              |
|  - EvaluationInstrumentRegistry (F0 Freeze)                 |
|  - EvaluationScaleAssignmentService (F1 Assignment)         |
|  - PersonnelEvaluationScoringService (F4 Cap Engine)        |
|  - PersonnelEvaluationResultService (F5 Passed/Retained)    |
+-------------------------------------------------------------+
```

### Audit Findings:
- **Scoring Engine Unification**: Early prototype engine `NDMURatingEngine.js` will be superseded in Phase G2/G3 by direct integration with `PersonnelEvaluationScoringEngine.js` / `PersonnelEvaluationScoringService.php`.
- **Zero Plan G Scoring Inventions**: Plan G introduces zero new point values, custom formulas, or modified passing scores.
