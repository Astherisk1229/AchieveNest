# Filename-Only Proof Elimination

## Core Governance Invariant
> **"No achievement can claim attached evidence without a valid persisted object."**

## Elimination Verification
1. The upload endpoint requires real binary file streams in multipart payload.
2. An evidence record in `personnel_accomplishment_evidence` is created ONLY after the physical file is verified and written to protected storage.
3. Client-side state updates display evidence attachments ONLY upon receiving a successful `201 Created` response containing the authoritative `evidence_id`.
4. Storing mock URLs, client Blob URLs, or filenames alone without backing storage is strictly impossible in the production upload pipeline.
