# Authorization Boundary Verification

## Authority Rules
1. **Final Lock Authority**: ONLY authorized HR roles (`hr_admin`, `hr_staff`) possess the authority to execute the final lock on an evaluation.
2. **Unauthorized Roles**:
   - `faculty` / `personnel` (Candidate): Rejected with `HTTP 403 Forbidden` / `unauthorized_role`.
   - `dean`: Rejected with `HTTP 403 Forbidden` / `unauthorized_role`.
   - `department_secretary`: Rejected with `HTTP 403 Forbidden` / `unauthorized_role`.
   - `unrelated_admin`: Rejected with `HTTP 403 Forbidden` / `unauthorized_role`.
3. **Backend Enforcement**: Both frontend services and backend controllers strictly enforce role checking and return canonical structured authorization errors.

## Validation Status
- **Result**: `VERIFIED ENFORCED`
