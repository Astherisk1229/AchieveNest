# OCR Chain Validation

## Chain Execution
- OCR processing receives the canonical `evidence_id`.
- Resolves the exact persisted file on disk.
- Validates the physical file SHA-256 against stored hash.
- Halts with `evidence_integrity_mismatch` if file bytes are corrupted.
- Attaches OCR result metadata to the same `evidence_id`.
