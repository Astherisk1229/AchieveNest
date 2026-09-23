# Personnel Evaluation Track — Plan I — Phase I1
# Secure Upload Pipeline Report

**Document Version:** 1.0.0  
**Completion Date:** 2026-09-09  
**Track:** Personnel Evaluation Track — Plan I (Evidence Storage, Document Security, Integrity, Preview, Versioning, OCR & Deletion)  
**Phase:** Phase I1 — Secure Upload Pipeline  
**Final Status:** **PHASE I1 COMPLETE — SECURE UPLOAD PIPELINE, SERVER-SIDE FILE VALIDATION & ATOMIC EVIDENCE PERSISTENCE VERIFIED**

---

## 1. Executive Summary

Phase I1 has successfully implemented the canonical, secure evidence-upload pipeline for the Personnel Evaluation Track, enforcing strict server-side validation, protected file persistence, atomic failure cleanup, and cryptographic SHA-256 integrity.

The core rule has been fully locked into production:

> **"No achievement can claim attached evidence without a valid persisted object."**

---

## 2. Pipeline Implementation & Security Controls

### 2.1 Server-Side Validation Authority
- **Backend Service**: `App\Services\PersonnelEvidenceUploadService.php`.
- **Ownership Verification**: Derives the owner from the authenticated JWT session; cross-owner uploads are rejected with `HTTP 403 Forbidden`.
- **Extension & MIME Validation**: Case-insensitive allowlist (`.pdf`, `.jpg`, `.jpeg`, `.png`) cross-checked against authoritative PHP `finfo_file` detection. Disguised executables (e.g. MZ headers) and HTML/PHP scripts are blocked with `HTTP 422 Unprocessable Entity` or `HTTP 415 Unsupported Media Type`.
- **File Size**: Bounded to strictly `<= 10 MiB` (10,485,760 bytes). Zero-byte uploads receive `HTTP 422`, and files > 10 MiB receive `HTTP 413 Payload Too Large`.

### 2.2 Storage Key Generation & Protected Isolation
- **Storage Path**: `backend/writable/uploads/evidence/personnel/{ownerUuid}/{accomplishmentId}/{fileUuid}.{extension}`.
- **Physical Naming**: Uses server-generated UUID v4 strings, ensuring non-guessable paths and zero filename collisions.
- **Filename Sanitization**: Original client filenames are sanitized of path traversal (`../`) and stored purely as display metadata in `personnel_accomplishment_evidence.original_filename`.
- **Webroot Isolation**: Storage exists outside public webroot; direct public access is prohibited.

### 2.3 Upload Atomicity & Rollback Cleanup
- **Storage Precedes DB**: Physical bytes are written before database insertion.
- **Automatic Rollback Cleanup**: If database insertion or transaction commit fails, `LocalEvidenceStorageService::deletePhysicalFile` is immediately executed in the rollback handler to delete the newly written file. Zero orphan physical files or dangling database records survive on failure.

### 2.4 Integrity & Safe API Responses
- **Cryptographic Fingerprint**: SHA-256 hash is computed on stored bytes at upload time and persisted in `sha256` / `checksum`.
- **API Response Security**: Responses return sanitized metadata (`formatSafeEvidence`) with authenticated stream endpoints (`/api/v1/evidence/personnel/{id}/download`), exposing zero absolute server filesystem paths.

---

## 3. Test & Verification Summary

- **Phase I1 Focused Test Suite**: [PersonnelSecureUploadPipelineI1.test.jsx](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/PersonnelSecureUploadPipelineI1.test.jsx) — **33 tests passed (100%)**.
- **Phase I0 Audit Suite**: [PersonnelEvidenceStorageAuditI0.test.jsx](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/PersonnelEvidenceStorageAuditI0.test.jsx) — **24 tests passed (100%)**.
- **Full Master Repository Suite**:
  - **141 test files passed (141/141)**
  - **1247 tests passed (1247/1247)**
  - **0 failures, 0 errors (100% pass rate)**
- **Evidence Package**: 23 artifacts compiled under [docs/implementation/evidence/plan-i-i1-secure-upload-pipeline/](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/evidence/plan-i-i1-secure-upload-pipeline/).

---

## 4. Formal Declaration

**PHASE I1 COMPLETE — SECURE UPLOAD PIPELINE, SERVER-SIDE FILE VALIDATION & ATOMIC EVIDENCE PERSISTENCE VERIFIED**
