# OCR Retry Protocol

## Workflow
When retrying OCR for an existing evidence object:
1. Client requests retry using existing canonical `evidence_id`.
2. `PersonnelEvidenceOcrIntegrationService.prepareOcrRetry(existingEvidence)` verifies:
   - Evidence identity exists and is valid.
   - Evidence has not been deleted (`deleted_at == null`).
3. Server re-reads the exact same persisted physical file without requiring a duplicate upload.
4. Preserves manual corrections if already saved by Personnel in accomplishment form.
