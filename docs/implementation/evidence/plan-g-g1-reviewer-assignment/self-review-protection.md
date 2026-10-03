# Personnel Evaluation Track — Plan G — Phase G1: Self-Review Protection

## Self-Review Prevention Architecture

### Invariant Rule:
> **An actor must never review, evaluate, or score their own evaluation submission under any circumstances.**

### Implemented Enforcement Layers:

1. **Dean Self-Review Protection**:
   - When a College Dean submits an evaluation, the system detects `is_dean = true` and routes the evaluation directly to the HR Office.
   - If a Dean attempts to access their own evaluation via direct API or URL, `canReviewerAccessEvaluation()` detects `actorProfileId === personnelProfileId` and returns `false`.

2. **HR Staff Evaluator Self-Review Protection**:
   - When an HR staff member who is normally an evaluator submits their own evaluation as an employee, `resolveReviewerActor()` detects the conflict and binds an alternate active HR staff evaluator from the directory context (`USER-HR-2`).
   - If only one HR staff exists, the assignment is marked `unresolved` with reason code `self_review_prohibited`.

3. **Candidate Self-Routing Protection**:
   - Any attempt by a personnel candidate to pass their own profile ID as `evaluator_profile_id` is rejected by `validateClientTampering()`.
