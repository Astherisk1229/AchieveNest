# Duplicate Content Advisory Validation (RISK-I0-04 Closed)

## Behavior
- SHA-256 is calculated for every uploaded file.
- If an owner has previously uploaded the exact file (same SHA-256), a non-blocking advisory notification is presented.
- Upload is never silently rejected or force-merged.
- Cross-owner duplicate matches never leak filenames or metadata across users.
