# Personnel Owner Access Validation

## Rules
- Personnel owner can preview and download their own attached evidence files.
- Cross-owner access requests are rejected with HTTP 403 Forbidden (`evidence_access_forbidden`).
- Direct client-path or filename-guessing attacks are completely ineffectual.
