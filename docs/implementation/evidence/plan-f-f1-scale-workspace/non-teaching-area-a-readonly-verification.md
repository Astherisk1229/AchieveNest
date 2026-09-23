# Plan F Phase F1 Evidence: Non-Teaching Area A Read-Only Verification

## Invariant Summary

1. **Non-Teaching Scale Area A Policy**:
   - `entry_policy = 'read_only_evaluation_area'`
   - `is_personnel_entry_allowed = false`
   - Total Points: `90.0` (A.1 Job Performance 50.0, A.2 Personal Attitudes 10.0, A.3 Efficiency 30.0)
2. **Personnel Mutation Guards**:
   - Personnel UI does NOT render Add Accomplishment, Edit, Remove, Sync, or Upload Proof for Area A.
   - Backend `PortfolioCriterionValidationService` explicitly rejects entry attempts under Area A for Non-Teaching personnel with status `409` / `evaluation_only_area`.
