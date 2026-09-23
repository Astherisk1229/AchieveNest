# Personnel Evaluation Track — Plan I — Phase I0
# Storage & Security Audit Report

**Document Version:** 1.0.0  
**Completion Date:** 2026-09-09  
**Track:** Personnel Evaluation Track — Plan I (Evidence Storage, Document Security, Integrity, Preview, Versioning, OCR & Deletion)  
**Phase:** Phase I0 — Storage & Security Audit  
**Final Status:** **PHASE I0 COMPLETE — STORAGE ARCHITECTURE, SECURITY RISKS & AUTHORITATIVE UPLOAD RULES AUDITED AND FROZEN**

---

## 1. Executive Summary

Phase I0 has conducted a comprehensive architectural, security, and integrity audit of the current evidence-storage and document-handling subsystems across the Personnel Evaluation Track.

The objective was to audit the existing implementation, document all evidence touchpoints, verify access control and upload atomicity, compile a risk register, and establish a frozen implementation baseline for Phase I1 without making premature destructive or redesign changes.

---

## 2. Core Architecture & Storage Audit Findings

### 2.1 Storage Provider & File Architecture
- **Active Storage Provider**: Local Protected Filesystem Storage managed via `App\Services\LocalEvidenceStorageService`.
- **Protected Root Directory**: `backend/writable/uploads/evidence/` (outside public web document root).
- **Directory Partitions**:
  - `personnel/`: Faculty and personnel portfolio evidence.
  - `student/`: OSAD student awards evidence.
  - `quarantine/`: Staging partition for unverified uploads.
  - `tmp/`: Ephemeral processing area.
- **Key / Path Generation**: `{domain}/{ownerUuid}/{recordUuid}/{fileUuid}.{extension}`. Stored files use random UUID v4 identifiers, preventing file collisions and directory traversal attacks.

### 2.2 Privacy & Access Control
- **Direct Web Access**: Completely blocked.
- **Authenticated Streaming**: Evidence is accessed exclusively through `GET /api/v1/evidence/personnel/{id}/download` with Bearer token authentication.
- **Access Authorization**:
  - **Personnel**: Authorized only for evidence attached to their own accomplishments (`canReadPersonnelEvidence`).
  - **Dean**: Authorized only for candidate evidence within their assigned academic college (`assigned_college_id === evaluator_college_id`). Cross-college access and self-review are blocked.
  - **Department Secretary**: Excluded from reviewer preview access.
  - **HR Staff / Admin**: Authorized for institutional compliance and evaluation oversight.

### 2.3 Upload Pipeline & Document Constraints
- **Canonical Upload Endpoint**: `POST /api/v1/personnel/accomplishments/{id}/evidence`.
- **Accepted Extensions**: `.pdf`, `.jpg`, `.jpeg`, `.png`.
- **Restricted Extensions**: `php`, `js`, `exe`, `dll`, `bat`, `cmd`, `sh`, `ps1`, `html`, `svg`, etc.
- **File Size Limit**: Exactly 10 MiB (10,485,760 bytes), enforced on frontend (`SecurityController.MAX_FILE_SIZE_BYTES`) and backend (`LocalEvidenceStorageService::DEFAULT_MAX_BYTES`).
- **Validation**: Dual-layer verification with browser-side Magic Byte checks (%PDF, .PNG, JPEG) and server-side PHP `finfo_file` MIME inspection.

### 2.4 Upload Atomicity & Rollback Safety
- File storage precedes DB insertion.
- If DB insertion fails or encounters a transaction rollback in `PersonnelAccomplishmentController::addEvidence`, the uploaded physical file on disk is immediately unlinked (`deletePhysicalFile`), preventing orphan files.

### 2.5 OCR & Reviewer Preview Integration
- **OCR Engine (`OcrScanController.js`)**: Operates on genuine file binary streams via `FileReader.readAsArrayBuffer` with strict zero-fabrication guarantees (no guessing unproven dates, issuers, or titles).
- **Reviewer Workspace (`PersonnelEvaluatorWorkspaceService.js`)**: Renders preview links and gracefully handles missing attachments (`EVIDENCE_UNAVAILABLE`) with controlled warnings.

---

## 3. Security Risk Register

| Risk ID | Component | Severity | Description | Phase Remediation |
|---|---|---|---|---|
| **RISK-I0-01** | Reviewer Preview | Medium | Evaluator workspace constructs preview links with filenames (`/api/v1/evidence/preview/${fileName}`) rather than evidence ID streaming | Phase I3 / I5 |
| **RISK-I0-02** | Deletion Purge | Medium | Portfolio `purge` endpoint deletes DB rows without iterating over storage paths to delete physical files from disk | Phase I4 / I6 |
| **RISK-I0-03** | Snapshot Reference | Low-Med | `personnel_evaluation_items` stores relative storage path string rather than explicit FK `evidence_id` | Phase I2 / I4 |
| **RISK-I0-04** | Deduplication | Low | SHA-256 hash is computed but identical content uploads are not flagged with duplicate warnings | Phase I2 |
| **RISK-I0-05** | Malware Scanner | Low | Schema records `malware_scanner: none_deferred`; anti-virus daemon is not attached | Phase I1 |

---

## 4. Authoritative Upload Rule Freeze for Phase I1

1. **Provider**: Local Protected Storage (`writable/uploads/evidence/personnel/...`).
2. **Accepted Types**: PDF, JPG, JPEG, PNG (<= 10MB).
3. **Endpoint**: `POST /api/v1/personnel/accomplishments/{id}/evidence`.
4. **Key Generation**: Cryptographically random UUID v4 with preserved original filename in database.
5. **Integrity**: SHA-256 cryptographic hash computed and stored at upload time.
6. **Atomicity**: File storage precedes DB; rollback unlinks storage object immediately.

---

## 5. Test Suite & Validation Summary

- **Phase I0 Audit Suite**: [PersonnelEvidenceStorageAuditI0.test.jsx](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/PersonnelEvidenceStorageAuditI0.test.jsx) — **24 tests passed (100%)**.
- **Full Master Repository Suite**: **140 test files passed (140/140), 1214 tests passed (1214/1214), 0 failures**.
- **Evidence Package**: 30 comprehensive audit artifacts saved in [docs/implementation/evidence/plan-i-i0-storage-security-audit/](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/evidence/plan-i-i0-storage-security-audit/).

---

## 6. Formal Declaration

**PHASE I0 COMPLETE — STORAGE ARCHITECTURE, SECURITY RISKS & AUTHORITATIVE UPLOAD RULES AUDITED AND FROZEN**
