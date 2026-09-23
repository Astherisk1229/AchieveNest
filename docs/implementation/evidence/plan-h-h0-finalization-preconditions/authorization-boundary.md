# Authorization Boundary Verification

## HR Authority & Role Isolation

1. **HR Ownership**:
   - Plan H finalization workflows are restricted to authorized HR personnel (`hr_staff`, `hr_admin`).
2. **Rejection of Unauthorized Roles**:
   - Department Secretary attempting finalization -> `unauthorized_finalization_actor` (403).
   - Candidate attempting finalization on own evaluation -> `unauthorized_finalization_actor` (403).
   - College Dean attempting HR finalization -> `unauthorized_finalization_actor` (403).
