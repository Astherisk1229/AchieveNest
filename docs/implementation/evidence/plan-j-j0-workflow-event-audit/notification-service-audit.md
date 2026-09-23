# Notification Service Architecture Audit

## Storage & Tables
- **Table**: `public.notifications`
- **Fields**: `id`, `recipient_profile_id`, `actor_profile_id`, `event_type`, `title`, `message`, `read_at`, `created_at`.
- **Security & RLS**: Authenticated users can select their own notifications (`recipient_profile_id = auth.uid()`) and update `read_at`.
- **Preferences Table**: `public.notification_preferences`.

## Key Findings
- Current student and OSAD domains persist workflow notifications to `notifications`.
- Personnel evaluation workflow notifications are currently partially implemented, with some notifications handled via transient UI toasts or direct status indicators.
- Plan J Phase J3 will implement canonical persisted notification generation for Personnel evaluation milestones.
