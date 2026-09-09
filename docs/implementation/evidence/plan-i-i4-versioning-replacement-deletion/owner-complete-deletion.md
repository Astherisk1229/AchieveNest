# Owner-Authorized Complete Deletion (RISK-I0-02 Closure)

## 1. The Right to Complete Deletion
Under NDMU institutional rules:
- An individual candidate has the authoritative right to delete all of their submitted records and attachments.
- When an owner initiates complete portfolio purge (or HR acts on their explicit written request):
  1. All live and historical accomplishments are removed.
  2. All evaluation root and version snapshot links are invalidated and deleted.
  3. All database evidence records are purged.
  4. **All physical evidence files are unlinked from protected disk storage** (`writable/uploads/personnel_evidence/`).

## 2. Test Verification
- Test 3.1: `builds valid complete deletion manifest for authentic owner` (PASSED)
- Test 3.2: `blocks complete deletion attempted by unauthorized non-owner` (PASSED)
- Test 4.3: `verifies RISK-I0-02 is closed with physical unlinking and complete cleanup` (PASSED)
