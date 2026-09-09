# Replacement Transaction & Rollback Safety

## 1. Transactional Atomicity
When replacing evidence:
1. **Upload Step**: New file is written to protected disk and database record created.
2. **Pointer Update**: Accomplishment's `primary_evidence_id` is updated in a DB transaction.
3. **Rollback on Error**: If the database update fails:
   - Transaction rolls back.
   - The newly uploaded replacement physical file is unlinked.
   - The new database record is deleted.
   - Old evidence remains 100% active and untouched on the working accomplishment.

## 2. Test Verification
- Test 5.1: `ensures old evidence remains active when replacement update fails` (PASSED).
