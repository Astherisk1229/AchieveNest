# Evidence Identity Read Model

## 1. Safe Evidence Read DTO Structure
The canonical evidence read model provides comprehensive metadata to authorized clients without leaking server-side internal storage paths:

```json
{
  "evidence_id": "018f3a2b-8c10-7e44-b611-e123456789ab",
  "personnel_id": "1042",
  "accomplishment_id": "205",
  "original_filename": "Dean_Recommendation_2026.pdf",
  "mime_type": "application/pdf",
  "extension": "pdf",
  "size_bytes": 1048576,
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "uploaded_at": "2026-09-09 10:00:00",
  "lifecycle_status": "active"
}
```

## 2. Redacted / Excluded Properties
- `storage_path` (Internal server path e.g. `C:\wamp64\www\writable\...`) is strictly excluded.
- Server temporary upload names or OS handles are never exposed.
- Authenticated download and preview streaming URLs are generated dynamically in Phase I3.
