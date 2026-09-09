# Historical Identity Invariant Verification

## 1. The Historical Invariant
> **If Version 1 uses Evidence A, and a working revision later replaces it with Evidence B for Version 2, Version 1 must still reference Evidence A, while Version 2 references Evidence B.**

## 2. Verification Protocol
In test suite `PersonnelEvidenceIdentityI2.test.jsx`:
1. **Step 1**: Created accomplishment `acc-1` with Evidence A (`evidence-a-uuid`).
2. **Step 2**: Generated Version 1 snapshot containing `evidence-a-uuid`.
3. **Step 3**: Simulated a working draft update (e.g. following revision request in C3/I4) where `acc-1` is attached to Evidence B (`evidence-b-uuid`).
4. **Step 4**: Generated Version 2 snapshot containing `evidence-b-uuid`.
5. **Step 5**: Verified that Version 1 snapshot retains `evidence-a-uuid` with 100% integrity, and Version 2 retains `evidence-b-uuid`.
6. **Step 6**: Confirmed that live pointer modifications have zero mutating effect on historical snapshot records.

## 3. Results
- Test 4.2 passed: `Version 1 snapshot retains original Evidence A identity`
- Test 4.3 passed: `working revision update to Evidence B creates Version 2 without altering Version 1`
- Test 4.4 passed: `confirms historical snapshot immutability across version sequence`
