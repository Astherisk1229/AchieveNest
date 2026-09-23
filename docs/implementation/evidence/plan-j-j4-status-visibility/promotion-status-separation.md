# Promotion Decision Separation Evidence

### Separation Principle
Promotion Decision represents the *institutional employment advancement decision* (`Approved`, `Not Approved`). It is strictly distinct from both the lifecycle status (`completed`) and the evaluation score result (`Passed`).

### Invariants
1. `Approved` / `Not Approved` MUST NEVER be used as lifecycle statuses or evaluation results.
2. A dossier evaluated as `Passed` may result in `Approved` or `Not Approved` based on institutional quotas or committee actions.
3. A dossier evaluated as `Retained` retains its independent record without synthetic assumptions.
4. UI displays:
   - Status: `Completed`
   - Evaluation Result: `Passed`
   - Promotion Decision: `Approved`
