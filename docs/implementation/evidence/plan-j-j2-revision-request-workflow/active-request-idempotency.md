# Phase J2 Evidence: Active Request Guard & Idempotency

## Active Request Guard
- When an evaluation is in `returned_for_revision` state and has an unresolved (`open`) revision request, duplicate creation attempts are rejected with `409 Conflict` (`revision_request_already_open`).
- Idempotency nonces submitted during network retries or rapid double-clicks return the existing record without creating duplicate events or rows.

## Idempotency Key Composition
- Composed as: `revision_requested:{evaluationId}:v{versionNumber}:{nonce}`
- Guaranteed deterministic and collision-safe.
