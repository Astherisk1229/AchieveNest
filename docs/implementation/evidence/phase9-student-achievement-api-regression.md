# Plan 04 Phase 9 — API Regression Report
## Endpoint Contracts, Envelopes, and Error Handlers

### 1. Endpoint Contract Matrix

| Method & Route | Consumer Role | Request Payload | Response Status & Envelope | Status |
|---|---|---|---|---|
| `POST /api/v1/portfolio` | Student | JSON: Title, Organizer, Dates, Category, Subcategory, `structured_metadata`, Evidence, `submit_now` | `201 Created` -> `{ data: { message, id, status } }` | **PASS** |
| `POST /api/v1/portfolio` (Invalid) | Student | Incompatible taxonomy pair or unknown metadata | `422 Unprocessable Entity` -> `{ error: { code, errors: { ... } } }` | **PASS** |
| `POST /api/v1/portfolio/{id}/evidence` | Student | Multipart: `file`, `evidence_type` | `201 Created` -> `{ data: { message, evidence } }` | **PASS** |
| `GET /api/v1/program-coordinator/verification-queue` | Coordinator / OSAD | None (Session bounded) | `200 OK` -> `{ data: { queue: [ ... ], total: N } }` | **PASS** |
| `POST /api/v1/portfolio/{id}/verify` | Coordinator / OSAD | None | `200 OK` -> `{ data: { message, id, status: 'verified' } }` | **PASS** |

### 2. Validation Field-Error Contract
- Structured metadata errors returned as `structured_metadata.<field_key>`.
- Client directly maps server field errors onto rendered input elements.
