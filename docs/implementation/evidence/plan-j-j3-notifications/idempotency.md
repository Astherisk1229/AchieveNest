# Phase J3 Evidence: Duplicate Prevention & Notification Idempotency

## Idempotency Key Composition
`notif:{event_id}:{recipient_profile_id}:{notification_type}`

## Invariant
- A single persisted workflow event generates at most one notification per intended recipient.
- Retrying an event or submitting duplicate requests with the same nonce returns the existing notification without creating duplicate rows.
