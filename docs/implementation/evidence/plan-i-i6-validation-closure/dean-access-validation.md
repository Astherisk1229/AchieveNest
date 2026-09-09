# College Dean Access Validation

## Scope Constraints
- Dean can only preview/download evidence attached to evaluations within their assigned College.
- Cross-college evaluation evidence requests are denied (`cross_college_access_denied`).
- Self-review preview attempts are prohibited (`self_review_access_denied`).
- Evaluations routed to HR are blocked from Dean access (`review_assignment_missing`).
- Department Secretary evaluator preview attempts are blocked (`evidence_access_forbidden`).
