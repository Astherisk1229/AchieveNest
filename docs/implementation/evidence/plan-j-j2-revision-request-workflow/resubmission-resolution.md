# Phase J2 Evidence: Resubmission & Request Resolution

## Resolution Lifecycle
1. **Initial Return**: Request created with `status: 'open'`, `resolved_at: null`, `resolved_by_version_id: null`.
2. **Personnel Edits**: Editing working draft does not alter the open request.
3. **Plan C Resubmission**:
   - Submits working draft as Version N+1.
   - Triggers `resolveRevisionRequest(priorEvaluationId, newVersionId, newVersionNumber)`.
   - Updates status to `resolved`, sets `resolved_at`, and links `resolved_by_version_id`.
   - Emits canonical `portfolio_resubmitted` event via `PersonnelWorkflowEventService`.
