# Authorization & Security Evidence

### Enforced Boundaries
1. **Personnel Isolation**:
   - Personnel can only query their own evaluation workflow status (`personnel_profile_id === user.profile_id`).
   - Cross-personnel status queries return `403 Forbidden` / `AuthorizationException`.
2. **Dean College Boundary**:
   - Dean can only access evaluation statuses for personnel within their assigned college.
   - Cross-college queries are strictly denied.
3. **Department Secretary Exclusion**:
   - Department Secretary has zero evaluator status visibility or evaluation status query authorization.
4. **Forged Status Rejection**:
   - Client-provided status parameters are strictly ignored; status is derived 100% server-side from database records and persisted event logs.
