# Filename Handling & Sanitization Audit

## Sanitization Rules
1. **Original Filename Preservation**:
   - Preserved in `original_filename` column for human readability in UI and downloads.
   - Sanitized during HTTP streaming with `Content-Disposition: inline; filename="<safe_filename>"` to prevent header injection.
2. **Physical Storage Key Generation**:
   - The stored file on disk does NOT use the client-provided filename.
   - It is assigned a cryptographically random UUID v4 string: `genUuid() . '.' . $extension`.
   - This eliminates filename collision, Unicode filesystem quirks, and path traversal (`../`) vulnerabilities.
3. **Path Traversal Guards**:
   - `resolveAbsolutePath()` checks for `..` and null bytes (`\0`).
   - Uses `realpath()` to ensure absolute paths remain strictly within `WRITEPATH . 'uploads/evidence/'`.
