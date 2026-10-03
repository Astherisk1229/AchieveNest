# OCR Evidence Source Audit

## Findings
1. **OCR Architecture (`OcrScanController.js`)**:
   - Operates directly on genuine binary streams / text layers extracted via `FileReader.readAsArrayBuffer` from the uploaded file object.
   - Extracts literal PDF Tj/TJ strings and text blocks.
2. **Zero-Fabrication Guarantees**:
   - Zero-guess policy: No field (title, issuer, date, scope) is guessed or synthesized from filename cues.
   - If document contains no readable text, returns explicit warnings and leaves fields blank for manual entry.
3. **Persisted Evidence Linkage**:
   - After OCR scanning and form completion, the actual physical file is uploaded via `personnelAccomplishmentService.uploadEvidence` to backend storage.
