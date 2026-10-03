# Personnel Evaluation Track — Plan G — Phase G1: Client Tampering Rejection & Security

## Protection Against Client-Manipulated Reviewer Assignments

The assignment service provides strict server-side validation against any client attempts to forge or override reviewer metadata:

1. **Client Forged Reviewer Role**:
   - Client sends payload attempting to switch assigned role (e.g. `assigned_reviewer_role: "hr_staff"` for a faculty member assigned to Dean).
   - Server Action: `validateClientTampering()` detects mismatch and throws: `Tampering detected: Client-supplied reviewer role [hr_staff] does not match authoritative assignment [dean].`

2. **Client Forged Evaluator Profile ID**:
   - Client sends payload attempting to redirect evaluation to a friendly user (`evaluator_profile_id: "USER-FAKE-EVALUATOR"`).
   - Server Action: `validateClientTampering()` detects mismatch and throws: `Tampering detected: Client-supplied evaluator ID [USER-FAKE-EVALUATOR] does not match authoritative evaluator [USER-DEAN-CEAC].`

3. **Client Forged Evaluator College Scope**:
   - Client sends payload attempting to change the college scope.
   - Server Action: Exception thrown: `Tampering detected: Client-supplied evaluator college does not match authoritative college scope.`
