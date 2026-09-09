# Lifecycle-Aware Access Enforcement

## 1. Lifecycle State Filtering
Evidence access is governed by the `lifecycle_status` column in `personnel_accomplishment_evidence`:
- `active` / `submitted`: Full preview and download access for authorized actors.
- `pending_reconciliation`: Accessible with advisory warning flag.
- `deleted` / `purged` / `archived_deleted`: Access blocked server-side with `evidence_deleted`.

## 2. Test Verification
- Test 7.1: `blocks access to deleted evidence according to lifecycle status` (PASSED).
