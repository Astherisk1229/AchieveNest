# Bucket & Container Privacy Audit

## Privacy & Access Classification
- **Storage Location**: `backend/writable/uploads/evidence/` (outside public webroot).
- **Direct Public URL Access**: **BLOCKED** / Inaccessible via HTTP server directly.
- **Unauthenticated Access**: **REJECTED** (Returns HTTP 401 Unauthorized).
- **Signed / Authenticated Streaming**: All downloads occur via `GET /api/v1/evidence/personnel/{id}/download` with Bearer token validation and actor permission checks.
- **Security Response Headers**:
  - `Content-Type`: Authoritative detected MIME type.
  - `X-Content-Type-Options`: `nosniff`.
  - `Cache-Control`: `private, no-store, must-revalidate`.
  - `Content-Disposition`: `inline; filename="<sanitized_original_filename>"`.
- **Classification**: **ACCEPTABLE / PRIVATE**
