# Evaluation Result & Lifecycle Status Separation Evidence

### Separation Principle
Lifecycle status represents the *workflow stage* (`submitted`, `in_evaluation`, `returned_for_revision`, `ready_for_finalization`, `completed`), while Evaluation Result represents the *academic/qualification outcome* (`Passed`, `Retained`).

### Invariants
1. `Passed` or `Retained` MUST NEVER be used as lifecycle statuses.
2. A dossier in `completed` status can have `evaluation_result: "Passed"` or `evaluation_result: "Retained"`.
3. An in-flight dossier (`submitted`, `in_evaluation`) has `evaluation_result: null`.
4. UI components render separate badges: Lifecycle Badge (e.g. `Completed`) and Result Badge (e.g. `Passed`).
