# Download Response Specification

## 1. Attachment Streaming Headers
For download requests (`GET /api/v1/evidence/personnel/{id}/download`):
```http
HTTP/1.1 200 OK
Content-Type: application/pdf (or image/jpeg, image/png)
Content-Length: [exact_byte_count]
Content-Disposition: attachment; filename="[safe_sanitized_filename]"
X-Content-Type-Options: nosniff
Cache-Control: private, no-store, must-revalidate
```

## 2. Header Injection Neutralization
The filename passed to `Content-Disposition` is sanitized through `PersonnelEvidenceAccessService::sanitizeHeaderFilename()`:
- Strips CR (`\r`), LF (`\n`), double quotes (`"`), semicolons (`;`), and null bytes (`\0`).
- Removes path components (directory traversal).
- Non-ASCII characters are safely filtered to guarantee RFC-compliant header formatting.
