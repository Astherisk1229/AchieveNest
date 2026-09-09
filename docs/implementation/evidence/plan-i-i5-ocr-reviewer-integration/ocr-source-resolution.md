# OCR Source Resolution by Canonical Evidence Identity

## Principle
OCR processing must never take raw filenames or client-uploaded file streams directly from unpersisted client requests.
Instead, OCR operations receive the canonical `evidence_id`, verify ownership and lifecycle validity, resolve the canonical storage key from the database, and read the physical file on the server.

## Resolution Flow
1. API receives `{ evidence_id }`.
2. `PersonnelEvidenceOcrIntegrationService::resolveOcrEvidence()` validates:
   - `evidence_id` exists and is non-empty.
   - `deleted_at` is null (not purged).
   - Requesting user is owner or authorized admin.
   - Storage key resolves to an existing file in `WRITEPATH . 'uploads/personnel_evidence/'`.
   - File SHA-256 matches stored record hash.
3. Server hands the validated physical path to OCR worker.
