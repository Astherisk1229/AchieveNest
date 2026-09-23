# Security Negative Cases Freeze — Plan K Phase K0

## Required Negative Authorization Scenarios

1. **Cross-User Access Denial**:
   - Personnel User A cannot view, mutate, or download evidence from Personnel User B's portfolio. (HTTP 403)
2. **Cross-College Dean Denial**:
   - Dean of College 1 cannot evaluate, score, or inspect portfolios from College 2. (HTTP 403)
3. **Department Secretary Evaluator Denial**:
   - Department Secretary attempting to submit evaluation scoring or reviewer decisions is blocked. (HTTP 403)
4. **Locked Submission Direct Modification Denial**:
   - Once a portfolio is in `submitted`, `in_evaluation`, or `completed` state, direct mutation of the underlying submitted snapshot is rejected.
5. **Invalid Catalog Value Rejection**:
   - Submitting non-catalog rank codes, cross-over part-time titles, or arbitrary invalid strings returns HTTP 422.
6. **Audit Trail Immutability Violation Denial**:
   - Any attempt by client users or admins to update or delete rows in `account_lifecycle_events` or evaluation audit logs is denied.
