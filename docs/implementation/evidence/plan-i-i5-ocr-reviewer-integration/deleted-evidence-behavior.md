# Deleted Evidence Behavior

## Owner-Authorized Complete Deletion
When an evidence record undergoes owner-authorized complete deletion:
1. `deleted_at` timestamp is written to the database record.
2. The physical file on disk is unlinked (RISK-I0-02 closed).
3. Any subsequent OCR request halts with `evidence_deleted`.
4. Any preview or download request halts with `evidence_deleted` / HTTP 410 Gone.
5. No cached copies or filename fallbacks are permitted.
