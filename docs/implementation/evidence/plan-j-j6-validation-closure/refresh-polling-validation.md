# Refresh & Polling Validation Evidence

### Read-Operation Invariants
1. **Page Reloads**: Hard browser refreshes reproduce existing backend state with zero event emission.
2. **Notification Polling**: Polling `/api/v1/personnel/notifications` does not generate new notifications or alter read timestamps.
3. **Status GET**: Querying `/workflow-status` does not append audit records.
