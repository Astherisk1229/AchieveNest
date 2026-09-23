# Stale Link Invalidation

## Verification
- Once evidence is deleted or replaced:
  - Old preview URL returns `evidence_deleted` or `evidence_not_found`.
  - Old download URL fails safely.
  - No legacy filename routes exist to bypass deletion.
  - Direct webroot URLs do not exist.
