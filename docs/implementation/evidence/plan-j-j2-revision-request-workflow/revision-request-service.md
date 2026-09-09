# Phase J2 Evidence: Revision Request Service Architecture

## Backend Authority: `PersonnelRevisionRequestService.php`
- **Location**: `backend/app/Services/PersonnelRevisionRequestService.php`
- **Responsibilities**:
  1. `canRequestRevision(array $actor, array $evaluation): array` — Verifies reviewer authority, role exclusion, cross-college boundaries, and lifecycle state.
  2. `createRevisionRequest(array $actor, array $evaluation, array $payload): array` — Atomically records the overall message, deficiency reason, requested evidence, subordinate item/criterion comments, and deterministic `revision_requested` event.
  3. `resolveRevisionRequest(string $priorEvaluationId, string $newVersionId, int $newVersionNumber): ?array` — Marks request `resolved` upon Plan C resubmission.
  4. `getActiveRevisionForEvaluation(string $evaluationId): ?array` — Fetches current/historical revision records.
  5. `formatPersonnelRevisionReadModel(...)` & `formatReviewerRevisionReadModel(...)` — Sanitized and contextual views.

## Frontend Companion: `PersonnelRevisionRequestService.js`
- **Location**: `frontend/src/services/PersonnelRevisionRequestService.js`
- **Responsibilities**:
  1. `canRequestRevision(actor, evaluation)` — Client-side gate ensuring fast UI feedback.
  2. `validateRevisionPayload(payload)` — Mandatory overall message validation (1–2000 chars) and comment integrity.
  3. `buildRevisionRequestPayload(...)` — Formats whole-portfolio return payload.
  4. `formatPersonnelRevisionView(...)` & `formatReviewerRevisionView(...)` — UI view state presentation.
  5. `resolveRevisionOnResubmission(...)` — Tracks resolution status (`open` -> `resolved`).
