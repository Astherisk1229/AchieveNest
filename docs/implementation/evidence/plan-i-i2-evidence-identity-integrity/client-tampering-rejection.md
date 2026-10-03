# Client Tampering Rejection & Defense-in-Depth

## 1. Attack Vectors Tested & Defeated
1. **Forged Evidence UUID**: Attaching an arbitrary `evidence_id` belonging to another personnel member.
   - *Result*: Rejected with `invalid_evidence_reference` / `unauthorized_evidence_linkage`.
2. **Client-Supplied Storage Key**: Submitting arbitrary storage paths or attempting directory traversal via upload payloads.
   - *Result*: Server ignores client-supplied keys and derives storage keys exclusively server-side using validated UUIDs.
3. **Client-Supplied SHA-256 Hash**: Attempting to supply a pre-calculated hash or tamper with cryptographic checksums.
   - *Result*: Server strictly re-calculates SHA-256 from received raw bytes; client-supplied hash values are ignored.
4. **Filename Substitution**: Attempting to bypass evidence linkage by passing only display filenames.
   - *Result*: Rejected by evaluation item creation and snapshot services.
