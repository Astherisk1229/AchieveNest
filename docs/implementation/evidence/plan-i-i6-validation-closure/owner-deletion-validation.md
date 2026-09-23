# Owner-Authorized Complete Deletion Validation (RISK-I0-02 Closed)

## Deletion Execution
- Owner-authorized complete deletion purges evidence metadata (`deleted_at` timestamp).
- Physical file on disk is unlinked via `unlink()` within `PersonnelEvidenceVersioningService`.
- Subsequent preview/download calls return HTTP 410 / `evidence_deleted`.
- OCR retries return `evidence_deleted`.
- Orphan scan confirms physical file removal.
