# HR Evidence Access Audit

## Findings
1. **Roles with HR Authority**: `hr_admin` and `hr_staff`.
2. **Access Scope**:
   - HR evaluators can view and download evidence for Non-Teaching personnel evaluations (assigned to HR).
   - HR staff can inspect evidence across submissions for institutional compliance and evaluation audit.
3. **Immutability Protection**: HR cannot edit, overwrite, or mutate the candidate's evidence documents after submission.
4. **Final Lock Governance**: HR executes the final lock without mutating historical evidence files.
