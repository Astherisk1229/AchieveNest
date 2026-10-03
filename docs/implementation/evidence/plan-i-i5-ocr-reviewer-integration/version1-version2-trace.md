# Version 1 vs Version 2 Historical Multi-Version Trace

## Scenario Trace

### Phase 1: Initial Submission (Version 1)
- Evidence A (`ev-uuid-0001-aaaa`, hash `a1b2c3...`) is uploaded.
- OCR A reads Evidence A.
- Snapshot V1 submitted with `evidence_id = ev-uuid-0001-aaaa`.
- Reviewer viewing Version 1 previews Evidence A.

### Phase 2: Editable Revision & Replacement
- Working accomplishment replaced with Evidence B (`ev-uuid-0002-bbbb`, hash `b2c3d4...`).
- OCR B reads Evidence B.
- Evidence A remains preserved in database and protected storage.

### Phase 3: Resubmission (Version 2)
- Snapshot V2 submitted with `evidence_id = ev-uuid-0002-bbbb`.

### Verification Outcome
- `resolveReviewerPreviewForVersion(V1)` -> resolves `ev-uuid-0001-aaaa` (Evidence A).
- `resolveReviewerPreviewForVersion(V2)` -> resolves `ev-uuid-0002-bbbb` (Evidence B).
- No cross-version substitution or live replacement leakage.
