# Valid File Upload Validation

## Supported Production File Types
The secure upload pipeline accepts:
1. **PDF** (`application/pdf` / `.pdf`)
2. **JPEG** (`image/jpeg` / `.jpg`, `.jpeg`)
3. **PNG** (`image/png` / `.png`)

## Verification Checklist
- Real bytes persisted to `WRITEPATH . 'uploads/personnel_evidence/'`.
- Authoritative metadata written to `personnel_evidence` table.
- Canonical `evidence_id` generated (UUID v4).
- SHA-256 computed from real disk bytes.
- Authorized preview and download functional immediately upon upload.
