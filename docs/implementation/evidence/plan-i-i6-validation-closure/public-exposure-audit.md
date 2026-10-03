# Public Storage Exposure Audit

## Webroot Isolation
- Evidence directory is physically located at: `backend/writable/uploads/personnel_evidence/`.
- This directory is completely outside `backend/public/` (the webroot).
- No direct HTTP requests can reach storage files directly.
- No public symlinks exist pointing to the storage folder.
- Access is gated 100% through authenticated, scope-checked CodeIgniter API endpoints.
