# Atomicity — Database Persistence Failure Scenario

## Scenario
The physical file is successfully written to storage, but the subsequent database transaction or insert into `personnel_accomplishment_evidence` fails (e.g., connection drop, constraint violation).

## Sequence & Cleanup Behavior
1. `LocalEvidenceStorageService::storeFile` succeeds and writes `personnel/.../{uuid}.pdf`.
2. `PersonnelEvidenceUploadService` starts a database transaction: `$db->transStart()`.
3. Database insert throws an exception or `$db->transStatus()` evaluates to `false`.
4. In the catch / rollback block:
   - `$db->transRollback()` is executed.
   - `LocalEvidenceStorageService::deletePhysicalFile($stored['storage_path'])` is called immediately.
   - The newly created physical file is deleted from disk.
5. Returns `HTTP 500 DATABASE_ERROR`.
6. **Result**: Zero orphaned physical files survive on disk.
