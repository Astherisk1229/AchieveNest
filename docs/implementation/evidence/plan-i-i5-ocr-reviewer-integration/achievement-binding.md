# Achievement Evidence Binding

## Binding Model
- `personnel_accomplishments` stores `evidence_id` as foreign key reference to `personnel_evidence.evidence_id`.
- The OCR result and accomplishment form share the exact same `evidence_id`.
- Any mismatch detected between accomplishment `evidence_id` and OCR `evidence_id` is flagged as `ocr_evidence_mismatch` and invalidates the diagnostic chain.
- Client cannot forge or substitute `evidence_id` independently.
