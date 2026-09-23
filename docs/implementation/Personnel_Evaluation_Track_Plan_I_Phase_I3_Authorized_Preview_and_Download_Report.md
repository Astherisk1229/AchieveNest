# Personnel Evaluation Track — Plan I — Phase I3: Authorized Preview and Download Report

## Executive Summary

Phase I3 implements the authoritative evidence preview and download authorization layer for the Personnel Evaluation Track. Every evidence retrieval request is now authenticated and authorized server-side, resolving exclusively by canonical `evidence_id` UUID rather than filename or client-supplied storage paths.

Phase I3 formally closes **RISK-I0-01** by replacing all legacy filename-based reviewer preview URL constructions with scope-aware, authenticated streaming endpoints.

---

## 1. Canonical Evidence Access Architecture

1. **Identity-Based Retrieval**:
   - Preview Endpoint: `GET /api/v1/evidence/personnel/{evidenceId}/preview` (Inline Content-Disposition)
   - Download Endpoint: `GET /api/v1/evidence/personnel/{evidenceId}/download` (Attachment Content-Disposition)
   - Metadata Endpoint: `GET /api/v1/evidence/personnel/{evidenceId}`
2. **Access Control Service**:
   - Backend: `PersonnelEvidenceAccessService.php`
   - Frontend Mirror: `PersonnelEvidenceAccessService.js`
   - Governs structured decisions (`buildAccessDecision`) across owner, reviewer, and governance scopes.

---

## 2. Role-Based Scope Authorization

### 2.1 Personnel Owner Access
- Candidates can preview and download their own attached evidence across active drafts and submissions.
- Requests for another candidate's evidence ID are rejected with HTTP 403 `FORBIDDEN`.
- Client attempts to forge owner IDs are neutralized by deriving identity solely from verified server session tokens.

### 2.2 College Dean Scope Access
- Deans can only access evidence for candidates within their assigned academic college (`assigned_college_id === evaluator_college_id`).
- Cross-college Dean access returns HTTP 403 `cross_college_access_denied`.
- HR-routed evaluations are isolated from Dean access (`review_assignment_missing`).
- Self-review is strictly blocked: Deans under evaluation cannot review their own evidence via reviewer routes (`self_review_access_denied`).

### 2.3 HR Institutional Oversight
- Authorized HR personnel (`hr_staff`, `hr_admin`) have access to evaluate and audit evidence across all institutional tracks.
- Roles are verified server-side to prevent privilege spoofing.

### 2.4 Department Secretary Boundary
- The `department_secretary` role is non-evaluative and is denied evaluator evidence preview access by default.

---

## 3. Snapshot Evidence Binding & Historical Immutability

- Evaluators review the exact `evidence_id` locked in the submitted Plan C snapshot.
- Historical snapshots (e.g. Version 1) maintain permanent linkage to original evidence even if working revisions or Version 2 attach replacement files.
- Pre-signed URLs, browser blob URLs, and server absolute paths are excluded from snapshots and API responses.

---

## 4. Protected Storage & Response Security

- **Webroot Isolation**: Storage is strictly located outside the public webroot (`writable/uploads/personnel_evidence/`).
- **Directory Traversal Protection**: Paths are sanitized, and realpaths are verified against the protected root.
- **MIME Safety**: Verified MIME types (`application/pdf`, `image/jpeg`, `image/png`) with `X-Content-Type-Options: nosniff`.
- **Header Injection Defense**: Filenames are sanitized against CRLF, quotes, and semicolons before insertion into `Content-Disposition`.
- **Missing File Handling**: Missing disk objects return controlled 404 with reason `storage_object_missing` without exposing paths.

---

## 5. Reviewer Workspace Rewiring & RISK-I0-01 Closure

- Updated `PersonnelEvaluatorWorkspaceService.js` and `PersonnelEvaluatorWorkspaceService.php` to derive `preview_url` using `evidence_id`:
  `/api/v1/evidence/personnel/${evidenceId}/preview`.
- Filename-based preview construction (`/api/v1/evidence/preview/${fileName}`) is eliminated from active production paths.
- **RISK-I0-01 is formally CLOSED**.

---

## 6. Verification & Test Suite Execution

### Focused Phase I3 Test Suite
- `src/controllers/__tests__/PersonnelAuthorizedEvidenceAccessI3.test.jsx`: **30/30 passed**
- `src/controllers/__tests__/PersonnelEvidenceStorageAuditI0.test.jsx`: **24/24 passed**
- `src/controllers/__tests__/PersonnelSecureUploadPipelineI1.test.jsx`: **33/33 passed**
- `src/controllers/__tests__/PersonnelEvidenceIdentityI2.test.jsx`: **29/29 passed**
- `src/controllers/__tests__/PersonnelEvaluatorWorkspaceG2.test.jsx`: **12/12 passed**
- **Combined Focused Total**: **128/128 passed**

### Master Repository Regression Suite
- **Total Test Files**: 143 passed (143 files)
- **Total Tests**: 1306 passed (1306 tests)
- **Failures**: 0
- **Regression Status**: Zero regressions across all Plans A through I.

---

## 7. Plan I Risk Register Closure Status

| Risk ID | Title | Status | Notes |
| :--- | :--- | :--- | :--- |
| **RISK-I0-01** | Reviewer preview URL uses filename-based construction | **CLOSED** | Replaced with authenticated `evidence_id` streaming. |
| **RISK-I0-03** | `personnel_evaluation_items` explicit FK `evidence_id` | **CLOSED** | Closed in Phase I2. |
| **RISK-I0-04** | SHA-256 duplicate advisory detection | **CLOSED** | Closed in Phase I2. |
| **RISK-I0-02** | Owner-authorized purge must unlink physical files | **OPEN** | Deferred to **Phase I4 / I6**. |

---

## Phase I3 Conclusion

**PHASE I3 COMPLETE — AUTHORIZED ID-BASED EVIDENCE PREVIEW, DOWNLOAD & REVIEWER ACCESS VERIFIED**
