# OCR Hash Consistency Guard

## Guard Mechanism
Before or during OCR processing, the server calculates the SHA-256 of the physical file on disk:
`$actualHash = hash_file('sha256', $physicalPath);`

If `$actualHash` differs from the persisted `evidence.sha256`, the operation halts immediately with reason code:
`evidence_integrity_mismatch`

## Invariants
- Integrity failures are never ignored.
- The stored hash is never silently overwritten with corrupted file bytes.
- Chain diagnostics report `chain_valid = false`.
