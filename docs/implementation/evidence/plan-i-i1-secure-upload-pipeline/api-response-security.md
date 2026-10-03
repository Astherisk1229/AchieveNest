# API Response Security & Path Non-Exposure

## Secure Response Contract
The upload API endpoint returns sanitized evidence metadata formatted via `formatSafeEvidence()`:

```json
{
  "data": {
    "message": "Evidence uploaded and secured successfully.",
    "evidence": {
      "id": "c1f7b0a2-9e34-4b56-8a71-890abcdef123",
      "accomplishment_id": "acc-8910",
      "original_filename": "Conference_Presentation.pdf",
      "mime_type": "application/pdf",
      "byte_size": 2048576,
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "security_status": "verified",
      "status": "active",
      "uploaded_at": "2026-09-09 10:15:30",
      "download_endpoint": "/api/v1/evidence/personnel/c1f7b0a2-9e34-4b56-8a71-890abcdef123/download"
    }
  }
}
```

## Security Verifications
- No absolute filesystem paths (e.g. `C:\...` or `/var/www/...`) are exposed.
- No internal directory traversal parameters are exposed.
- Downloads are routed exclusively through the authenticated download endpoint.
