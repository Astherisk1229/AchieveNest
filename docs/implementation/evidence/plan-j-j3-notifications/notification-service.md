# Phase J3 Evidence: Notification Service Architecture

## Backend Authority: `PersonnelWorkflowNotificationService.php`
- **Location**: `backend/app/Services/PersonnelWorkflowNotificationService.php`
- **Key Methods**:
  1. `handleWorkflowEvent(array $eventRow, array $evaluationContext = []): array` — Dispatches notifications from persisted events only.
  2. `resolveRecipients(string $eventKey, array $eventRow, array $evaluationContext): array` — Authoritative server-side recipient derivation.
  3. `hasExistingNotification(...)` & `getExistingNotification(...)` — Prevents duplicate notification spam.
  4. `listNotificationsForUser(string $userId, array $filters = []): array` — User-isolated notification retrieval with read states.
  5. `markNotificationRead(string $notificationId, string $userId): bool` & `markAllReadForUser(string $userId): int` — Server-persisted read timestamp.
  6. `getUnreadCount(string $userId): int` — Accurate count of unread items.

## Frontend Companion: `PersonnelNotificationService.js`
- **Location**: `frontend/src/services/PersonnelNotificationService.js`
- **Key Methods**:
  1. `formatNotificationFeedItem(item)` — Sanitizes raw payload, ensures deep link integrity.
  2. `calculateUnreadCount(notifications)` — Dynamic unread counter.
  3. `markAsReadInCollection(...)` & `markAllAsReadInCollection(...)` — Optimistic client state update.
  4. `filterNotifications(...)` — Filter by read status and keywords.
