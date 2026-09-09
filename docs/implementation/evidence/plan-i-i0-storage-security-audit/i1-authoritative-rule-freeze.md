# Authoritative Upload Rule Freeze for Phase I1

The following architecture baseline and upload rules are hereby **FROZEN** for Phase I1 implementation:

1. **Storage Provider**:
   - Local Protected Evidence Storage (`writable/uploads/evidence/`).
   - Private, non-web-accessible container directory structure: `personnel/{ownerUuid}/{accomplishmentId}/{fileUuid}.{extension}`.
2. **Accepted Document Types & Constraints**:
   - Allowed Extensions: `pdf`, `jpg`, `jpeg`, `png`.
   - Authoritative MIME Types: `application/pdf`, `image/jpeg`, `image/png`.
   - Maximum File Size: Exactly 10 MiB (10,485,760 bytes).
   - Magic Byte Validation: Mandatory inspection for `%PDF`, `.PNG`, `JPEG`.
3. **Upload Endpoint Contract**:
   - Route: `POST /api/v1/personnel/accomplishments/{id}/evidence`
   - Format: Multipart `file` or `evidence_file`.
   - Role Authority: Authenticated Personnel Owner only (`canUploadPersonnelEvidence`).
4. **Filename & Identity Rules**:
   - Original filename preserved for UI display in `original_filename`.
   - Storage filename generated as cryptographically random UUID v4 string.
   - SHA-256 cryptographic hash calculated on stored bytes and persisted in `sha256` / `checksum`.
5. **Atomicity & Rollback Contract**:
   - File storage precedes DB insertion.
   - DB transaction rollback immediately triggers `deletePhysicalFile` to guarantee zero orphaned physical files on error.
   - Controlled error responses with structured codes: `FILE_TOO_LARGE` (413), `UNSUPPORTED_FILE_TYPE` (415), `MIME_EXTENSION_MISMATCH` (422), `EMPTY_FILE` (422), `STORAGE_FAILED` (500).
