# Phase J3 Evidence: Notification vs. Audit Trail Boundary

## Architectural Boundary
- **Notifications**: Transactional, user-oriented communication messages. Users can mark them as read.
- **Audit Logs / Workflow Events (Plan J Phase J5)**: Immutable system event records in `personnel_evaluation_events`. Mutating or reading a notification has zero impact on the canonical audit log.
