# Evaluation Result Recorded Event (`evaluation_result_recorded`)

## Specification
- **Trigger**: Plan F score calculation completed and result committed (Plan F5 / H1).
- **Actor**: System / Evaluator.
- **Required Metadata**: `evaluation_result` (`Passed` | `Retained`), `total_score`, `scale_code`, `rule_version`.
- **Invariants**: Contains only objective scoring results; does NOT record promotion approval.
