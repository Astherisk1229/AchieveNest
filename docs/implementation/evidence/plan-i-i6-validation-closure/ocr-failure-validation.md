# OCR Failure Separation Validation

## Invariants
- Upload success is completely independent of OCR success.
- If OCR fails or times out:
  - File remains persisted on disk.
  - Database evidence row remains valid and active.
  - Evidence remains previewable and downloadable.
  - Zero fabricated fields are generated.
  - Owner can enter manual corrections or trigger retry.
