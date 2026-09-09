# Workspace Access Regression Verification

## Evaluator Workspace Access Control Invariants

The evaluator review workspace (`PersonnelEvaluatorWorkspaceService`) enforces:

1. **Assigned Dean Access**: Authorized within same college.
2. **Cross-College Rejection**: Denied with `403 Forbidden`.
3. **Assigned HR Access**: Authorized for HR-routed records.
4. **Secretary Rejection**: Denied with `403 Forbidden`.
5. **Candidate Self-Review**: Denied with `403 Forbidden`.
6. **Inactive / Draft Status**: Direct URL navigation rejected with `400 Bad Request`.
