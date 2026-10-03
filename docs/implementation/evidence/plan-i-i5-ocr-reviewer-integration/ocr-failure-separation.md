# OCR Failure Separation

## Rule
Upload success and OCR processing success are strictly decoupled:

1. **Upload Persistence Success**:
   - File bytes written to protected disk.
   - Database record created with `evidence_id`, `sha256`, `mime_type`, `file_size`.
   - Achievement retains evidence reference.
   - Evidence is immediately previewable and downloadable by authorized actors.

2. **OCR Failure**:
   - If OCR engine times out, fails, or cannot extract text, the evidence record remains intact and valid.
   - `ocr_status` is marked `failed`.
   - No fabricated metadata or placeholder strings are populated into accomplishment fields.
   - Personnel owner can manually enter fields or retry OCR later.
