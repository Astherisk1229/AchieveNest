# Personnel Evaluation Track — Plan G — Phase G1: Status Transition Verification

## Submitted to In-Evaluation Transition Governance

### Invariants:
1. **Assignment Prerequisite**: An evaluation can transition from `submitted` to `in_evaluation` only if `assignment_status === 'assigned'`.
2. **Unresolved Block**: If `assignment_status === 'unresolved'`, calling `transitionToInEvaluation()` throws an explicit error: `Cannot transition evaluation to [in_evaluation]: Reviewer assignment is unresolved.`
3. **Immutability of Submitted Snapshot**: Moving to `in_evaluation` updates the evaluation lifecycle state without altering the submitted achievements or evidence snapshot.

| Pre-Condition | Transition Call | New Status | Result |
| :--- | :--- | :--- | :--- |
| `status = 'submitted'`, `assignment_status = 'assigned'` | `transitionToInEvaluation()` | `in_evaluation` | **SUCCESS** (Timestamp recorded) |
| `status = 'submitted'`, `assignment_status = 'unresolved'` | `transitionToInEvaluation()` | `submitted` | **EXCEPTION / BLOCKED** |
| `status = 'completed'`, `assignment_status = 'assigned'` | `transitionToInEvaluation()` | `completed` | **EXCEPTION / BLOCKED** |
