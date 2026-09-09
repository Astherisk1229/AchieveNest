# Self-Review Protection

## 1. Conflict of Interest Mitigation
In Plan G and Plan I:
- If a College Dean or Reviewer is undergoing evaluation as a candidate, they are strictly prohibited from reviewing their own submission or accessing evidence through reviewer channels.
- Evaluator access on self-evaluation returns `self_review_access_denied`.
- The candidate may still view their evidence via the normal candidate/owner view, maintaining strict separation between owner and evaluator capabilities.

## 2. Test Verification
- Test 2.6: `strictly denies Dean self-review when candidate is the Dean` (PASSED).
