# Result & Promotion Separation Validation Evidence

### Verified Independent Dimensions
- **Lifecycle Status**: 5 canonical workflow stages (`submitted`, `in_evaluation`, `returned_for_revision`, `ready_for_finalization`, `completed`).
- **Evaluation Result**: Criteria outcome (`Passed`, `Retained`).
- **Promotion Decision**: Institutional action (`Approved`, `Not Approved`).

### Verified Scenarios
1. `Passed` + `Approved` -> Valid promotion progression.
2. `Passed` + `Not Approved` -> Valid institutional outcome (e.g. quota limit).
3. `Retained` -> Retains rank; does not automatically produce `Not Approved` unless explicitly decided.
4. No automatic casting from `Passed` to `Approved` or `Retained` to `Not Approved`.
