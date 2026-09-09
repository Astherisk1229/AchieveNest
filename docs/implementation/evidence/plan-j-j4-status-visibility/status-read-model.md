# Status Read Model Evidence

The canonical status read model is defined centrally and served by `PersonnelWorkflowStatusService.php` (backend) and normalized via `PersonnelWorkflowStatusService.js` (frontend).

### Canonical Read Model Structure
```json
{
  "evaluation_id": "eval-101",
  "personnel_profile_id": "profile-001",
  "lifecycle_status": "submitted",
  "lifecycle_label": "Submitted",
  "portfolio_version_id": "pv-1",
  "portfolio_version_number": 1,
  "last_event_key": "portfolio_submitted",
  "last_event_label": "Portfolio Submitted",
  "last_event_at": "2026-09-09T08:00:00Z",
  "evaluation_result": null,
  "promotion_decision": null,
  "revision_request_status": null,
  "reviewer_role": "Dean",
  "is_locked": false
}
```

### Invariants Verified
1. Read model is strictly server-derived or centrally normalized; never inferred from comment count, score count, or route state.
2. Read model strips unauthorized promotion decisions or internal reviewer fields depending on requesting role.
3. `is_locked` is true when `lifecycle_status === 'completed'`.
