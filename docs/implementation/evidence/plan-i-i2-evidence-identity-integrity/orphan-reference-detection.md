# Orphan Reference Detection & Health Scanning

## 1. Audit Scenarios Covered
The `PersonnelEvidenceIdentityService::findOrphanReferences()` audit routine detects the following conditions non-destructively:
1. **Dangling Evaluation Item Evidence**: `personnel_evaluation_items.evidence_id` pointing to a non-existent evidence record.
2. **Unlinked Evidence**: `personnel_accomplishment_evidence` records lacking an associated accomplishment ID.
3. **Missing Physical Storage Object**: Database evidence rows whose corresponding storage key is not present on disk.
4. **Invalid Snapshot Reference**: Submissions where serialized evidence references point to invalid IDs.

## 2. Non-Destructive Resolution
Detected anomalies are reported with status `evidence_reference_invalid` or `evidence_reference_reconciliation_required`. Physical unlinking or deletion is deferred to Phase I4/I6 to ensure auditability and prevent accidental data loss.
