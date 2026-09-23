# Phase J2 Evidence: Revision Event Integration

## Canonical J1 Event Emission
- **Event Key**: `revision_requested`
- **Source Plan**: `Plan J Phase J2`
- **Actor Context**: `actor_user_id`, `actor_role` (e.g. `dean`, `hr_staff`), `subject_personnel_id`.
- **Version Context**: `version_number`, `evaluation_id`.
- **Required Metadata**:
  - `revision_request_id`
  - `reason`
  - `required_corrections`
  - `overall_message`
- **Deterministic Service**: Dispatched via `PersonnelWorkflowEventService::recordEvent`.
