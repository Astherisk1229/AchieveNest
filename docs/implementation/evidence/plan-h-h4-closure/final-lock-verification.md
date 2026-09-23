# Plan H Phase H4 — Final Lock Verification

### Lock Mechanism
- **Service**: `PersonnelEvaluationFinalLockService`
- **Field**: `is_finalized: true`, `is_locked: true`, `lock_status: 'finalized_and_locked'`
- **Locked Metadata**: `locked_at`, `locked_by`, `lock_reason`, `snapshot_version`, `rule_version`
- **Preconditions**:
  - H0 readiness passed (`ready_for_finalization: true`).
  - H1 Evaluation Result finalized (`Passed` or `Retained`).
  - H2 print eligibility validated.
  - H3 Promotion Decision recorded and validated where applicable.
- **Enforcement**: Completed evaluations transition to locked state atomically.
