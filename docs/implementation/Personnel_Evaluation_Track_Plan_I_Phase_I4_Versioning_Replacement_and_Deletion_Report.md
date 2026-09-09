# Personnel Evaluation Track — Plan I — Phase I4: Evidence Versioning, Replacement & Deletion Report

## Executive Summary

Phase I4 establishes the authoritative evidence versioning, replacement, and owner-authorized complete deletion cleanup rules for Plan I.

Evidence replacement is strictly bounded to editable working portfolio states (drafts and reopened revisions). Replacing evidence creates a new canonical evidence identity (`evidence_id` UUID) and a distinct physical storage file without mutating previously submitted snapshots. Historical versions (e.g. Version 1) maintain permanent linkage and preview availability to their original evidence files.

Furthermore, Phase I4 resolves **RISK-I0-02** by integrating physical storage unlinking into the confirmed owner-authorized complete deletion workflow.

---

## 1. Evidence Replacement in Editable Working Records

1. **Lifecycle Boundaries**:
   - Replacement is allowed when accomplishment or submission status is `draft` or `returned_for_revision`.
   - Replacement is blocked when submission is in `submitted`, `under_review`, `deliberated`, `finalized`, or `locked` status.
2. **Replacement Execution**:
   - New file is uploaded through the Phase I1 secure pipeline, creating a new `evidence_id` and storage key.
   - Accomplishment's live working pointer (`primary_evidence_id`) is updated.
   - Old evidence record and physical bytes remain completely unchanged.
3. **Rollback Safety**:
   - If database updates fail, newly created replacement files are cleaned up and the old evidence remains active.

---

## 2. Multi-Version Historical Linkage (Version 1 vs Version 2)

- **Immutability Invariant**: When Version 1 is submitted, its evaluation items freeze the original `evidence_id` (`Evidence A`).
- When the candidate replaces the file in a reopened revision and submits Version 2 (`Evidence B`), Version 1 continues to reference and stream `Evidence A`, while Version 2 references and streams `Evidence B`.
- Both versions remain retrievable independently by authorized reviewers.

---

## 3. Owner-Authorized Complete Deletion (RISK-I0-02 Closed)

1. **Owner Direct Execution**:
   - An authentic owner can execute complete portfolio deletion with explicit confirmation (`DELETE_PORTFOLIO`).
2. **HR Execution on Behalf**:
   - HR administrators can execute complete deletion only when provided with a documented owner authorization reference.
3. **Physical File Cleanup**:
   - Compiles a pre-deletion manifest of all storage keys.
   - Unlinks all physical files from protected storage on server disk.
   - Deletes database evidence records, accomplishments, evaluation items, and evaluation roots.
4. **Post-Deletion Access**:
   - Preview and download endpoints return HTTP 404 (`evidence_deleted` / `evidence_not_found`) with zero leftover bytes or stale links.

---

## 4. Verification & Test Suite Results

### Focused Phase I4 Test Suite
- `src/controllers/__tests__/PersonnelEvidenceVersioningI4.test.jsx`: **17/17 passed**
- `src/controllers/__tests__/PersonnelAuthorizedEvidenceAccessI3.test.jsx`: **30/30 passed**
- `src/controllers/__tests__/PersonnelSecureUploadPipelineI1.test.jsx`: **33/33 passed**
- `src/controllers/__tests__/PersonnelEvidenceIdentityI2.test.jsx`: **29/29 passed**
- `src/controllers/__tests__/PersonnelEvidenceStorageAuditI0.test.jsx`: **24/24 passed**
- **Focused Total**: **133/133 passed**

### Full Master Repository Regression Suite
- **Total Test Files**: 144 passed (144 files)
- **Total Tests**: 1323 passed (1323 tests)
- **Failures**: 0
- **Regression Status**: Zero regressions across Plans A through I.

---

## 5. Plan I Risk Register Final Closure Status

| Risk ID | Title | Status | Closure Phase |
| :--- | :--- | :--- | :--- |
| **RISK-I0-01** | Reviewer preview URL uses filename-based construction | **CLOSED** | Phase I3 |
| **RISK-I0-02** | Owner-authorized purge must unlink physical files | **CLOSED** | Phase I4 |
| **RISK-I0-03** | `personnel_evaluation_items` explicit FK `evidence_id` | **CLOSED** | Phase I2 |
| **RISK-I0-04** | SHA-256 duplicate advisory detection | **CLOSED** | Phase I2 |
| **RISK-I0-05** | Malware scanner placeholder | **DOCUMENTED** | Phase I1 |

---

## Phase I4 Conclusion

**PHASE I4 COMPLETE — EVIDENCE VERSIONING, REPLACEMENT, HISTORICAL PRESERVATION & OWNER-AUTHORIZED DELETION CLEANUP VERIFIED**
