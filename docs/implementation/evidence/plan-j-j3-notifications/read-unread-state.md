# Phase J3 Evidence: Read / Unread State Persistence

## State Model
- **New Notification**: `read_at: null`, `is_read: false`.
- **Mark Read Action**: Updates `read_at = NOW()` on the server.
- **Unread Count**: Calculated by querying rows where `read_at IS NULL` for the specific recipient.
- **Persistence**: Refreshes and logins preserve read status without relying on localStorage or browser cache.
