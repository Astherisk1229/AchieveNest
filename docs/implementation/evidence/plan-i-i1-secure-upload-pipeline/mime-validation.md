# Server-Side MIME Validation

## Dual Verification Strategy
1. **Frontend Pre-flight**:
   - Inspects `file.type` and evaluates Magic Byte binary signatures (%PDF, .PNG, JPEG).
2. **Server-Side Authoritative Inspection**:
   - Uses PHP `finfo_open(FILEINFO_MIME_TYPE)` / `finfo_file` on the temporary upload path on server disk.
   - Ignores client-supplied `Content-Type` header when performing authoritative validation.
   - Cross-checks detected MIME against the canonical extension map.
3. **Mismatches & Disguised Executables**:
   - Files with `.pdf` extension containing HTML, PHP, or MZ executable headers are detected and rejected with `HTTP 422 MIME_EXTENSION_MISMATCH`.
