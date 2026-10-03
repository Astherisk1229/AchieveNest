# SHA-256 Duplicate Content Advisory (RISK-I0-04 Closure)

## 1. Advisory Signal Specification
Phase I2 leverages the SHA-256 hash computed during Phase I1 upload to provide an **advisory duplicate-content signal**.

### Key Rules:
1. **Advisory Only**: Detecting an identical SHA-256 hash generates a warning notification, but **never automatically blocks or rejects** the upload.
2. **No Automatic Merging**: The system maintains separate, discrete `evidence_id` records for each upload, preserving distinct metadata and accomplishment associations.
3. **Content vs. Filename Separation**: Different files with the same filename are **not** treated as content duplicates; identical byte payloads with different filenames **are** flagged as identical content.

## 2. Duplicate Advisory DTO Response
```json
{
  "duplicate_detected": true,
  "severity": "info",
  "duplicate_scope": "same_owner",
  "matching_evidence_count": 1,
  "same_accomplishment_match": false,
  "message": "This file appears identical to evidence you previously uploaded.",
  "matching_items": [
    {
      "evidence_id": "018f3a2b-8c10-7e44-b611-e123456789ab",
      "original_filename": "certificate_v1.pdf",
      "uploaded_at": "2026-09-08 14:30:00"
    }
  ]
}
```

## 3. Workflow Integration
When a user uploads a file with duplicate SHA-256 hash, the frontend receives the duplicate advisory payload. If the user confirms reuse or proceeds, the upload is saved with its own new `evidence_id` and complete metadata.
