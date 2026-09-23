# Personnel Evaluation Track — Plan G — Phase G1: Unresolved Routing Protection

## Unresolved Routing Handling & No HR Catch-All Fallback

### Core Principles:
1. **No Guessed Reviewers**: If a personnel classification is unsupported or missing critical context, the assignment remains `unresolved` with reason code `reviewer_route_unresolved`.
2. **Missing Dean Assignment**: If a college has no active Dean assigned in the directory, the evaluation status remains `unresolved` with reason code `dean_assignment_missing`.
3. **No HR Catch-All Fallback**: The system strictly refuses to route academic personnel to HR when a Dean is missing. HR is NOT a universal fallback evaluator.

| Scenario | Assignment Status | Reason Code | Explanation |
| :--- | :--- | :--- | :--- |
| Faculty + Academic (No active Dean in college) | `unresolved` | `dean_assignment_missing` | Active Dean assignment missing for college. HR fallback is prohibited. |
| Faculty + Non-Academic (Invalid combo) | `unresolved` | `reviewer_route_unresolved` | Reviewer route cannot be determined for classification. |
| Self-Review conflict with no alternate evaluator | `unresolved` | `self_evaluation_prohibited` | Evaluator conflict detected; alternate evaluator required. |
