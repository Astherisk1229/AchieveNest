# Upload Atomicity Audit

## Failure Scenarios & Behaviors

### 1. Storage Succeeds / Database Insert Fails
- **Current Behavior**: `PersonnelAccomplishmentController::addEvidence` executes within a database transaction block (`$db->transStart()`).
- **Catch / Rollback Block**: If DB insert fails or transaction rollbacks, the controller calls `$this->storage->deletePhysicalFile($stored['storage_path'])` immediately.
- **Audit Assessment**: Storage is properly cleaned up; no orphan physical files are left when DB transactions fail.

### 2. Storage Fails / Database Insert
- **Current Behavior**: File storage happens before database insertion. If `storeFile` throws a `RuntimeException`, execution aborts immediately with `HTTP 500 STORAGE_FAILED` before any DB row is created.
- **Audit Assessment**: No invalid database evidence rows are created without backing physical storage.

### 3. Accomplishment Save Fails after Evidence Upload
- **Current Behavior**: In current flow, accomplishment record is created first, and evidence is uploaded to the existing accomplishment ID.
- **Audit Assessment**: Atomicity is preserved.
