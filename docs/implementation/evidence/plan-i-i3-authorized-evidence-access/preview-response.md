# Preview Response Specification

## 1. Inline Streaming Headers
For preview requests (`GET /api/v1/evidence/personnel/{id}/preview`):
```http
HTTP/1.1 200 OK
Content-Type: application/pdf (or image/jpeg, image/png)
Content-Length: [exact_byte_count]
Content-Disposition: inline; filename="[safe_filename]"
X-Content-Type-Options: nosniff
Cache-Control: private, no-store, must-revalidate
```

## 2. Response Security Safeguards
- `X-Content-Type-Options: nosniff` prevents browser MIME sniffing attacks.
- `Cache-Control: private, no-store` guarantees evidence is not cached in intermediate proxies or shared browser caches.
- MIME type is set from verified database detection, never reflected from untrusted client headers.
