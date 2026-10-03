# Plan H Phase H2 — Print Eligibility Evidence

### Eligibility Gates
Printing requires:
1. Evaluation record exists and has valid ID.
2. Plan H0 Finalization Readiness Gate passes (`ready_for_finalization: true`).
3. Plan H1 Evaluation Result exists and is finalized (`Passed` or `Retained`).
4. Evaluator scoring is complete with 0 unresolved judgment items.
5. Incomplete, in-revision, or corrupt evaluations are strictly blocked (`evaluation_not_ready_for_print`).
6. No promotion decision is required to print the deliberation form.
