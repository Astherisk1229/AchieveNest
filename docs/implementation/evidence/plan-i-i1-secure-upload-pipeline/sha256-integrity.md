# SHA-256 Integrity Computation

## Implementation
1. **Computation Timing**: SHA-256 cryptographic checksum is computed on the stored file bytes immediately upon persisting the file to disk using PHP `hash_file('sha256', $absoluteTargetPath)`.
2. **Persistence**:
   - The hex-encoded 64-character hash is stored in both `sha256` and `checksum` columns of `personnel_accomplishment_evidence`.
3. **Immutability & Integrity**:
   - The hash establishes the cryptographic fingerprint of the uploaded document at storage time.
   - Any corruption or alteration of bytes on disk can be detected by recalculating the checksum against this baseline.
