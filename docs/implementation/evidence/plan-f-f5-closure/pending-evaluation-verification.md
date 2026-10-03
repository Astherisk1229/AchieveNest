# Personnel Evaluation Track — Plan F — Phase F5: Pending & Unresolved Evaluation Protection

## Core Protection Invariants

1. **Unresolved Evaluator Judgment Items**:
   - Criteria `B.3` (Research Conduct, max 40.0), `B.6` (Creative Work, max 20.0), and `B.5` (Non-Teaching Recognition/Meritorious Award, max 30.0) require evaluator deliberation.
   - When `accepted_points === null`, the evaluation status is `pending` and `final_result === null`.
   - Reason Code: `pending_evaluator_judgment`.
   - **Critical Semantic Distinction**: `accepted_points = null` (unresolved) $\neq$ `accepted_points = 0.0` (explicit evaluator award of zero). Explicit 0.0 allows finalization, whereas `null` blocks finalization.

2. **Non-Teaching Area A Completeness**:
   - Non-Teaching evaluations require official evaluator rating for Area A (90 points weight).
   - If Area A evaluation is not completed, finalization is blocked.
   - Reason Code: `pending_non_teaching_area_a`.

3. **Rule Version Immutability**:
   - Missing or altered rule version blocks finalization.
   - Reason Code: `missing_rule_version`.

| Scenario Tested | Items State | Result Status | Final Result | Outcome |
| :--- | :--- | :--- | :--- | :--- |
| Admin B.3 Research `null` | `accepted_points = null` | `pending` | `null` | **FINALIZATION BLOCKED** |
| Admin B.3 Research `0.0` | `accepted_points = 0.0` | `finalized` | `Passed` / `Retained` | **FINALIZATION ALLOWED** |
| Non-Teaching Area A Incomplete | Area A empty | `pending` | `null` | **FINALIZATION BLOCKED** |
| Non-Teaching Area A Scored | Area A completed | `finalized` | `Passed` / `Retained` | **FINALIZATION ALLOWED** |
