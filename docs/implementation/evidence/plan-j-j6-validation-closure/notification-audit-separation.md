# Notification vs Audit Trail Separation Evidence

### Separation Invariants
1. Notifications are transactional inbox items; audit records are immutable historical logs.
2. Marking a notification as read or unread does not alter the audit trail.
3. Deleting or expiring notifications has zero impact on persisted audit logs.
4. Audit events do not depend on whether notifications were delivered or opened.
