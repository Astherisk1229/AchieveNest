# Evidence Metadata Persistence

## Authoritative Record Schema
Each accepted evidence upload creates a record in `personnel_accomplishment_evidence` with the following attributes:

```json
{
  "id": "c1f7b0a2-9e34-4b56-8a71-890abcdef123",
  "accomplishment_id": "acc-8910-1112",
  "storage_path": "personnel/user-1234/acc-8910-1112/a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf",
  "original_filename": "Conference_Presentation_Certificate.pdf",
  "mime_type": "application/pdf",
  "detected_mime_type": "application/pdf",
  "byte_size": 2048576,
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "uploaded_by": "user-1234",
  "uploaded_at": "2026-09-09 10:15:30",
  "security_status": "verified",
  "malware_scanner": "none_deferred",
  "status": "active"
}
```
