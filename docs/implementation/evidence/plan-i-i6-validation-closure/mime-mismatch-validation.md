# MIME / Extension Mismatch Validation

## Mismatch Detection
Validation checks both client extension and server magic byte MIME detection:
- PDF extension containing JPEG byte headers -> REJECTED (`mime_mismatch`).
- JPG extension containing PDF magic header (`%PDF-`) -> REJECTED (`mime_mismatch`).
- Script/HTML payload disguised as PNG -> REJECTED (`mime_mismatch`).

## Outcome
- Safe rejection with structured reason code.
- No dangling files left in upload directory.
