# Personnel Evaluation Track — Plan G — Phase G1: Assignment Persistence & Idempotency

## Reviewer Assignment Data Structure & Idempotency

### Canonical Assignment Record Structure:
- `evaluation_id`: UUID / String
- `personnel_profile_id`: UUID / String
- `assigned_reviewer_role`: `dean` or `hr_staff`
- `evaluator_profile_id`: UUID of assigned evaluator
- `evaluator_name`: String
- `evaluator_college_id`: College scope ID for Deans (null for HR)
- `assignment_status`: `assigned` or `unresolved`
- `reason_code`: String (`route_assigned`, `dean_assignment_missing`, etc.)
- `routing_reason`: Explanation of routing derivation
- `assigned_at`: ISO-8601 Timestamp
- `evaluation_status`: `submitted` / `in_evaluation`
- `rule_version`: `NDMU-REVIEWER-ROUTING-V1`

### Idempotency Guarantees:
1. Calling `assignReviewer()` multiple times on the same unchanged evaluation returns the exact same assignment without resetting timestamps or creating duplicate reviewers.
2. Only one active reviewer assignment exists per evaluation.
