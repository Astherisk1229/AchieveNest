# OCR Backend Extraction Pipeline Report

## Implemented boundary

- Added authenticated `POST /api/v1/ocr/extract` for active Personnel accounts.
- Validates uploaded bytes using the existing server-side extension, MIME, size, and signature policy before invoking tools.
- Uses Poppler embedded-text extraction first for PDFs.
- When embedded text quality is insufficient, renders at most ten pages at 300 DPI and OCRs every rendered page with Tesseract.
- Uses Tesseract directly for validated JPEG and PNG images.
- Runs tools with escaped argument arrays, bounded timeouts, an isolated randomly named temporary directory, and unconditional cleanup.
- Normalizes control/invisible characters and whitespace before returning text.
- Applies a document-quality gate; failed text is discarded and cannot auto-fill fields.
- Returns safe generic client errors while recording detailed engine failures in server logs.
- The frontend now uploads to the backend instead of decoding image/PDF binary bytes in the browser.
- Added A.1 completed-units extraction with a bounded maximum and preserved manual edits.
- Froze Personnel OCR acceptance to PDF, JPG/JPEG, and PNG with a 10 MB limit; Word and WEBP remain outside the Personnel policy.
- Added an A.1 semantic extractor that distinguishes degree title, degree level, recipient-like text, institution, and date instead of assigning prominent lines generically.
- Institution-looking values are excluded from Degree Title, and honorific/person-name candidates are excluded from semantic achievement fields.
- Added canonical doctoral alias resolution for `PhD`, `Ph.D.`, `Doctor of Philosophy`, and `Doctorate` using the form's existing dropdown value.
- Added field-level source snippets and confidence metadata, high-confidence auto-fill gating, confidence badges, and an extraction summary.
- Manual selection of A.1 reruns the A.1 semantic mapping while preserving manually edited fields.

## Local configuration

- Tesseract: `C:\Program Files\Tesseract-OCR\tesseract.exe`
- Poppler: `C:\Tools\poppler-26.07.0\poppler-26.07.0\Library\bin`
- Configuration keys are documented in `backend/.env.example` and may be overridden without code changes.

## Verification

- PHP syntax: PASS.
- Route registration including authentication/CORS/security filters: PASS.
- OCR normalization and quality tests: PASS (2 tests, 3 assertions).
- Real local Tesseract process invocation: PASS; low-quality image output was rejected and returned blank text with manual-entry guidance.
- Focused frontend OCR/storage regressions: PASS (3 files, 50 tests).
- Frontend production build: PASS (2,101 modules).
- Frontend lint: PASS.
- The Harrington Institute / Doctor of Philosophy in Psychology semantic-disambiguation fixture is covered by regression tests.

## Remaining calibration work

Representative real degree, seminar, publication, award, research, and membership documents are still required to calibrate quality/confidence thresholds and measure field accuracy. No accuracy claim is made without that dataset.
