# Evidence Identity Model

## 1. Stable Canonical Identity Definition
Every persisted evidence document in AchieveNest is uniquely identified by an `evidence_id` formatted as a canonical UUID (v4).

### Key Architectural Properties:
1. **Server-Generated**: The UUID is created server-side upon successful upload verification.
2. **Independent of Filename**: Changing or sanitizing original filenames does not alter the evidence identifier.
3. **Independent of Physical Storage Path**: Storage reorganization, key migration, or volume remounts do not change the `evidence_id`.
4. **Independent of Accomplishment Title or Category**: Re-classifying or renaming an accomplishment retains the exact underlying evidence ID.
5. **Independent of Portfolio Versions**: Versions point to immutable evidence identifiers rather than transient pointers.

## 2. Canonical Evidence Schema
The authoritative evidence record exposes the following fields in `personnel_accomplishment_evidence`:
- `evidence_id` (VARCHAR(64), Primary Key)
- `accomplishment_id` (INT / VARCHAR(64), Foreign Key)
- `personnel_id` (INT / VARCHAR(64), Owner Foreign Key)
- `original_filename` (VARCHAR(255), Historical display name)
- `sanitized_filename` (VARCHAR(255), Safe filesystem name)
- `mime_type` (VARCHAR(128), Detected MIME type)
- `extension` (VARCHAR(16), Normalized lowercase extension)
- `size_bytes` (BIGINT / INT, Exact payload byte length)
- `storage_key` (VARCHAR(512), Partitioned relative storage path)
- `uploader_id` (VARCHAR(64), User ID who initiated upload)
- `uploaded_at` (DATETIME, Authoritative upload timestamp)
- `sha256` (VARCHAR(64), Cryptographic checksum)
- `lifecycle_status` (VARCHAR(32), e.g. `active`, `pending_reconciliation`, `archived`)
- `created_at` / `updated_at` (DATETIME)
