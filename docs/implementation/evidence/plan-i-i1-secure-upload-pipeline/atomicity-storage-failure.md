# Atomicity — Storage Failure Scenario

## Scenario
The file write to protected storage fails (e.g., disk full, write permissions error, directory creation failure).

## Sequence & Behavior
1. `LocalEvidenceStorageService::storeFile` encounters a failure and throws a `RuntimeException`.
2. `PersonnelEvidenceUploadService` catches the exception.
3. No database transaction is started; no record is inserted into `personnel_accomplishment_evidence`.
4. The accomplishment record remains unchanged.
5. Returns `HTTP 500 STORAGE_FAILED` to the caller.
6. **Result**: Zero dangling database rows or corrupted records exist.
