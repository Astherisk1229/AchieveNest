# Replacement Evidence Identity Minting

## 1. Identity Separation Invariant
When replacing evidence:
1. The existing evidence record (`evidence_id_1`, `sha256_1`, physical file `uuid1.pdf`) remains completely untouched.
2. The replacement file is processed through the Phase I1 secure pipeline, creating a new record (`evidence_id_2`, `sha256_2`, physical file `uuid2.pdf`).
3. The working accomplishment's `primary_evidence_id` is updated to `evidence_id_2`.
4. Previous submission snapshots continue referencing `evidence_id_1`.

## 2. Test Verification
- Test 1.2: `generates new evidence_id on replacement while updating working record` (PASSED)
- Test 1.3: `ensures old evidence metadata remains completely immutable and unchanged` (PASSED)
