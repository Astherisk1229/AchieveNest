# Integrity Metadata Audit

## Current Integrity Fields
1. **`personnel_accomplishment_evidence`**:
   - `sha256`: Hex-encoded 64-character cryptographic SHA-256 hash computed during file storage.
   - `checksum`: Alias for SHA-256 hash.
   - `byte_size`: Integer size in bytes.
   - `detected_mime_type`: Authoritative server-detected MIME type.
   - `uploaded_at`: UTC timestamp.
2. **Readiness for Phase I2**:
   - Cryptographic hashing is already computed and stored at upload time.
   - Phase I2 will formalize evidence identity tokens and duplicate prevention rules based on SHA-256 checksums.
