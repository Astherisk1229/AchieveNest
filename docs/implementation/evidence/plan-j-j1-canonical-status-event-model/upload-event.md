# Evidence Upload Saved Event (`achievement_upload_saved`)

## Specification
- **Trigger**: Successful evidence persistence and accomplishment association (Plan I1).
- **Actor**: Personnel owner.
- **Required Metadata**: `evidence_id`, `storage_key`, `sha256`, `mime_type`, `file_size`.
- **Invariants**: Emitted only on successful database commit and physical disk write; never emitted on upload error or file selection.
