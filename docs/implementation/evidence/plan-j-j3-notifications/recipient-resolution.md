# Phase J3 Evidence: Authoritative Server-Side Recipient Resolution

## Resolution Invariants
1. **Server Derived**: Recipients are derived strictly from database evaluation context (`personnel_profile_id`, `evaluator_profile_id`, `assigned_reviewer_role`), never trusted from client parameters.
2. **Actor Exclusion**: The user performing the action is excluded from recipient lists to prevent self-notification spam.
3. **Dean College Scope**: Deans only receive notifications for portfolios within their assigned college scope.
4. **Department Secretary Exclusion**: Role `department_secretary` cannot receive evaluator notifications.
