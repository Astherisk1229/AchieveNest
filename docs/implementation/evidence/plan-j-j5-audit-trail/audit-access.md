# Audit Access & Role Authorization Evidence

### Authorization Matrix
- **HR (`hr`, `hr_admin`, `admin`)**: Full access across all personnel evaluation audit logs.
- **Dean (`dean`, `reviewer`)**: Access scoped exclusively to candidates within their assigned college (`college_code`). Cross-college access is strictly denied.
- **Personnel (`personnel`, `faculty`)**: Access restricted exclusively to their own evaluation history (`personnel_profile_id`). Cross-personnel inspection is strictly denied.
- **Department Secretary (`department_secretary`)**: Evaluator-level audit privilege is strictly denied.
- **Unauthenticated / Guest**: Completely blocked.
