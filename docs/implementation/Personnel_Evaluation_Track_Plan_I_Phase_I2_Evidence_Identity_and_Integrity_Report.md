# Personnel Evaluation Track — Plan I — Phase I2: Evidence Identity, Integrity, Snapshot Linkage & Duplicate Advisory Report

## Executive Summary

Phase I2 of Plan I establishes the authoritative evidence-identity and integrity layer for the Personnel Evaluation Track on top of the secure upload pipeline completed in Phase I1.

Every persisted evidence document in AchieveNest now possesses a stable, immutable identity (`evidence_id` UUID) that is strictly independent of filenames, physical storage paths, browser session tokens, or portfolio versions. Submitted evaluation items and Plan C snapshots reference explicit canonical evidence identifiers rather than filenames or transient URLs. Duplicate content detection utilizes the cryptographic SHA-256 hash as an advisory, privacy-preserving signal without auto-rejecting valid submissions.

---

## 1. Canonical Evidence Identity Model

1. **Stable Identifier**: Every evidence file is assigned a server-generated UUIDv4 (`evidence_id`) upon validation.
2. **Path & Filename Independence**: Renaming, sanitization, or volume reorganization has zero impact on the `evidence_id`.
3. **Canonical Attributes**:
   - `evidence_id`: Canonical unique identifier.
   - `accomplishment_id`: Foreign key link to source accomplishment.
   - `personnel_id`: Authoritative owner identifier.
   - `original_filename` & `sanitized_filename`: Preserved metadata.
   - `mime_type`, `extension`, `size_bytes`: Validated physical properties.
   - `storage_key`: Partitioned relative storage path.
   - `sha256`: 64-character hex cryptographic hash.
   - `lifecycle_status`: Active / pending reconciliation / archived.

---

## 2. Explicit Evaluation-Item Foreign Key (RISK-I0-03 Closed)

- **Migration**: `2026-09-09-000067_AddEvidenceIdToPersonnelEvaluationItems.php` added `evidence_id VARCHAR(64)` and index `idx_eval_item_evidence_id` to `personnel_evaluation_items`.
- **Submission Controller Rewire**: `PersonnelPortfolioSubmissionController::submit()` and `resubmit()` snapshot explicit `evidence_id` into evaluation item records.
- **Linkage Validation**: The backend validates that referenced evidence exists, is owned by the submitting personnel, and rejects client forgery attempts with `invalid_evidence_reference`.

---

## 3. Snapshot Evidence Linkage & Historical Immutability

- **Plan C Snapshot Integration**: When portfolio submissions are finalized (`v1`, `v2`, etc.), snapshot items store canonical `evidence_id` and metadata.
- **Historical Invariant Verified**: If Version 1 uses Evidence A, and a working revision later binds Evidence B for Version 2, Version 1 remains bound to Evidence A with zero mutation.
- **Disallowed Ephemeral Data**: Pre-signed URLs, browser blob URLs, and local server absolute paths are excluded from snapshot storage.

---

## 4. SHA-256 Duplicate Advisory & Privacy Controls (RISK-I0-04 Closed)

- **Advisory Only**: Detection of identical SHA-256 hashes produces an informational/warning signal without blocking uploads.
- **Content vs. Filename**: Files with identical filenames but different bytes are not flagged as duplicates; identical bytes with different filenames are correctly detected.
- **Privacy Protections**: Cross-owner hash matches return a generic notice without exposing the other user's name, user ID, filename, or storage location.
- **Database Index**: Added non-unique index `idx_personnel_evidence_sha256` to `personnel_accomplishment_evidence`.

---

## 5. Legacy Records & Orphan Detection

- **Safe Backfill**: Deterministic matching only when unambiguous `accomplishment_id` or evidence ID relations exist; zero guessing on filenames or dates.
- **Reconciliation Status**: Incomplete or ambiguous historical records are flagged with `evidence_reference_reconciliation_required`.
- **Orphan Detection**: Non-destructive scanner `PersonnelEvidenceIdentityService::findOrphanReferences()` identifies dangling references and missing storage objects.

---

## 6. Verification & Test Suite Execution

### Focused Phase I2 Test Suite
- `src/controllers/__tests__/PersonnelEvidenceIdentityI2.test.jsx`: **29/29 passed**
- `src/controllers/__tests__/PersonnelSecureUploadPipelineI1.test.jsx`: **33/33 passed**
- `src/controllers/__tests__/PersonnelEvidenceStorageAuditI0.test.jsx`: **24/24 passed**
- **Focused Total**: **86/86 passed**

### Master Repository Regression Suite
- **Total Test Files**: 142 passed (142 files)
- **Total Tests**: 1276 passed (1276 tests)
- **Failures**: 0
- **Regression Status**: Zero regressions across Plans A through I.

---

## 7. Plan I Risk Register Closure Status

- **RISK-I0-03**: **CLOSED** (Explicit evaluation item `evidence_id` FK and snapshot linkage implemented).
- **RISK-I0-04**: **CLOSED** (Privacy-preserving SHA-256 duplicate advisory detection verified).
- **RISK-I0-01**: **OPEN (Deferred to Phase I3)** (Reviewer preview URL rewiring and tokenized streaming).
- **RISK-I0-02**: **OPEN (Deferred to Phase I4/I6)** (Evidence replacement and physical unlink lifecycle).
- **RISK-I0-05**: **DOCUMENTED (Phase I1)** (Malware scanner integration architecture).

---

## Phase I2 Conclusion

**PHASE I2 COMPLETE — EVIDENCE IDENTITY, SNAPSHOT LINKAGE, INTEGRITY & DUPLICATE ADVISORY VERIFIED**
