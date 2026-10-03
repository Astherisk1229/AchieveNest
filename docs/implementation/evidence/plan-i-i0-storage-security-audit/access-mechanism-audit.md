# Access Mechanism Audit

## Mechanism Overview
- **Storage Direct URL**: Not exposed publicly. All evidence access goes through CodeIgniter API controller routes.
- **Download Endpoint**: `GET /api/v1/evidence/personnel/{evidenceId}/download`
- **Metadata Endpoint**: `GET /api/v1/evidence/personnel/{evidenceId}`
- **Authentication**: Bearer token via `Authorization` header.
- **Authorization Service**: `App\Services\AuthorizationService` enforces role policies:
  - Owner access
  - Reviewer Dean access (college scope)
  - HR oversight access
- **Streaming Response**: PHP `readfile` / `file_get_contents` binary stream with security headers and forced `nosniff`.
