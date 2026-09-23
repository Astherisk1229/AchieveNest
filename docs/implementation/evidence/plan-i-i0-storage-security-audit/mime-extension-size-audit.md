# MIME, Extension & File Size Enforcement Audit

## Validation Layers
1. **Frontend Pre-Upload Validation (`SecurityController.js`)**:
   - Checks `file.size <= 10MB`.
   - Checks `file.type` in `['application/pdf', 'image/jpeg', 'image/png']`.
   - Inspects Magic Bytes asynchronously via `FileReader.readAsArrayBuffer(file.slice(0, 8))`.
2. **Backend Server-Side Validation (`LocalEvidenceStorageService.php`)**:
   - Zero-byte / empty file rejection (`EMPTY_FILE`).
   - Size limit verification against `DEFAULT_MAX_BYTES` (10 MiB).
   - Filename extension extraction and normalization (`extractExtension`).
   - Dangerous extension blocklist rejection (`DANGEROUS_EXTENSIONS`).
   - Authoritative MIME detection using PHP `finfo_file(FILEINFO_MIME_TYPE)` on the temporary file.
   - Cross-check matching detected MIME against allowed extension mapping (`MIME_EXTENSION_MISMATCH`).
3. **Audit Assessment**:
   - Validation is dual-enforced (client-side pre-flight + strict backend server-side enforcement).
   - Spoofed MIME headers sent by malicious clients are detected and blocked by server-side `finfo_file` inspection.
