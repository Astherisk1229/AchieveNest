# Actor Context & Role Audit

## Actor Context Fields
Workflow events must record complete actor context:
1. **Actor ID**: UUID (`performed_by` / `actor_profile_id`).
2. **Actor Role**: Active role exercised (`faculty`, `dean`, `hr_admin`, `system`).
3. **Actor Name**: Full name for human-readable audit presentation.
4. **Scope**: Assigned college or institutional scope.
- **Finding**: Some existing logs capture only `performed_by` UUID. Plan J Phase J1/J5 will standardize full actor role and name context in the canonical event payload.
