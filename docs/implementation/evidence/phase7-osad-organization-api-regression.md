# Phase 7 — OSAD Organization API Regression Evidence
**Plan 02 API Contract & Mutation Audit**

---

### 1. API Endpoints Contract Verification

| Method | Endpoint | Authorization Policy | Request Format | Response Status | Response Schema |
|---|---|---|---|---|---|
| `GET` | `/api/v1/osad/organizations` | OSAD Admin | Query params (`status`, `category`, `scope`) | 200 OK | `{ organizations: [...] }` |
| `POST` | `/api/v1/osad/organizations` | OSAD Admin | JSON / FormData (with optional logo) | 201 Created | `{ message, organization, program_scope, current_moderator, configuration_status }` |
| `GET` | `/api/v1/osad/organizations/{id}` | OSAD Admin | None | 200 OK | `{ organization: { ..., programs: [...], moderator_history: [...] } }` |
| `PATCH` | `/api/v1/osad/organizations/{id}` | OSAD Admin | JSON / FormData | 200 OK | `{ message, organization, program_scope, current_moderator, configuration_status }` |
| `POST` | `/api/v1/osad/organizations/{id}/programs` | OSAD Admin | JSON `{ program_ids: [...] }` | 200 OK | `{ message, organization, program_scope, configuration_status }` |
| `DELETE` | `/api/v1/osad/organizations/{id}/programs/{programId}` | OSAD Admin | None | 200 OK | `{ message, organization, program_scope, configuration_status }` |
| `POST` | `/api/v1/osad/organizations/{id}/moderator` | OSAD Admin | JSON `{ personnel_profile_id: "..." }` | 200 OK | `{ message, organization, current_moderator, configuration_status }` |
| `DELETE` | `/api/v1/osad/organizations/{id}/moderator` | OSAD Admin | None | 200 OK | `{ message, organization, current_moderator: null, configuration_status }` |
| `GET` | `/api/v1/osad/organizations/{id}/logo` | Public / Cached | None | 200 OK / 404 | Binary Image Stream |
| `POST` | `/api/v1/osad/organizations/{id}/logo` | OSAD Admin | FormData (`logo` file) | 200 OK | `{ message, organization }` |
| `DELETE` | `/api/v1/osad/organizations/{id}/logo` | OSAD Admin | None | 200 OK | `{ message, organization }` |

---

### 2. Failure & Validation Contract Verification

| Scenario | Payload / Condition | Expected Code | Expected Error Message |
|---|---|---|---|
| Invalid Program on Create | Nonexistent UUID in `program_ids` | 422 VALIDATION_FAILED | Academic Program not found or inactive |
| Invalid Moderator on Create | Nonexistent UUID in `moderator_profile_id` | 422 VALIDATION_FAILED | Personnel profile not found |
| Duplicate Code on Create/Edit | Existing `code` submitted | 422 VALIDATION_FAILED | Duplicate organization code / conflict |
| Remove Last Program (Program Scope) | Remaining program count would reach 0 | 422 VALIDATION_FAILED | Cannot remove last academic program from program-scoped org |
| Unauthorized Direct API Call | Missing token or student/personnel account | 401 / 403 FORBIDDEN | Only OSAD administrators may manage student organizations |
