# Notification Delivery State Validation Evidence

### Verified Notification Properties
- Notifications are created strictly after corresponding canonical events persist.
- Unread default state (`is_read: false`) is persisted to database.
- Mark-as-read transitions update `is_read: true` and `read_at` timestamp.
- Unread count accurately calculated server-side and reflected client-side.
- Recipient isolation verified: unauthorized cross-college or cross-user notifications rejected.
