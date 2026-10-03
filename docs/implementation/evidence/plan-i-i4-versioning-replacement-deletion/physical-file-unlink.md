# Physical File Unlink (RISK-I0-02 Closure)

## 1. Physical Cleanup Implementation
In `PersonnelEvidenceVersioningService::cleanupPhysicalFile()` and `purgeOwnerEvidence()`:
1. Resolves `storage_key` relative path within `writable/uploads/personnel_evidence/` (and fallback `writable/uploads/evidence/`).
2. Validates realpath to prevent directory traversal outside root.
3. Unlinks the physical file using PHP `unlink()`.
4. Gathers success count and flags any failed unlinks.

## 2. Risk Closure
Prior to Phase I4, the purge controller only removed database rows. In Phase I4, physical unlinking is verified and transactionalized, closing **RISK-I0-02**.
