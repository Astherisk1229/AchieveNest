# Reviewer Routing & Authority Audit (Plan G)

## Routing Architecture
- **Roles**: `dean` (College assigned) vs `hr` (Non-Teaching / HR institutional).
- **Recorded Fields**: `evaluator_profile_id`, `evaluator_college_id`, `assigned_reviewer_role`.
- **Finding**: While routing assignments are persisted in `personnel_evaluations`, re-routing events (e.g. Dean replacement) are currently tracked via evaluation row updates. Plan J Phase J1/J5 will define an explicit canonical event for reviewer rerouting.
