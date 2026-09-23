# Phase J3 Evidence: Authorization & Recipient Isolation

## Security Policies
- **Row-Level Security (RLS)**: Enforced on `public.notifications` via policy `recipient_select_notifications` (`recipient_profile_id = auth.uid()`).
- **Update Protection**: Policy `recipient_update_notification_read_state` permits users to update `read_at` exclusively for their own notifications.
- **Role Isolation**: Department Secretary cannot access evaluator-targeted notifications.
