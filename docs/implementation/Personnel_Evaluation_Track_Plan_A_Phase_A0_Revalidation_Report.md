# Personnel Evaluation Track — Plan A — Phase A0
## Current-State Revalidation & Rule Freeze Report

**Final Remediation Status:** PHASE A0 REMEDIATION — COMPLETE  
**Final Target Status:** PHASE A0 — COMPLETE — REVALIDATED AFTER PERSONNEL WORKFLOW CHANGES  
**Audit Date:** September 8, 2026  
**Auditor / Engine:** Antigravity Engineering (Zero-Cloud Defense Architecture)

---

## 1. Executive Summary & Canonical Architecture Alignment

Following the architectural separation of concerns in the **Personnel Evaluation Track (Plans A–K)**, the personnel classification model, faculty rank progression, canonical scoring rules, reviewer routing, deliberation, and promotion authority were formally separated from achievement ingestion.

**Phase A0 does not reimplement Plan A.** It establishes an authoritative, frozen implementation baseline for Plan A by:
1. Re-tracing the end-to-end achievement and evidence persistence path in the current repository;
2. Revalidating historical audit findings against active code;
3. Freezing upload validation, OCR zero-fabrication, and auto-fill rules;
4. Enforcing strict boundary separation between **Achievement Classification** (owned by Plan A) and **Personnel Classification** (owned by Plan D);
5. Explicitly establishing that **Plan F** owns evaluation scoring rules/criteria, **Plan G** owns reviewer routing and workspace evaluation, and **Plan I** extends the shared storage foundation without duplication.

> **Core Architectural Rule:**  
> Plan A must not duplicate downstream plan responsibilities. It may consume outputs from Plans D–I only where needed to complete the achievement workflow.

---

## 2. Current-State Flow Map (End-to-End Technical Trace)

The current repository implementation was traced across frontend and backend layers to verify authoritative persistence and identify the exact integration baseline for Plan A1.

```
[PersonnelAchievementsPage.jsx]
        │ (1. User clicks "Add Achievement" / "Scan Certificate")
        ▼
[PersonnelSubmissionModal.jsx]
        │ (2. File selection: PDF, JPG, PNG)
        ▼
[SecurityController.js:validateFileUpload] ──► [Memory Magic Byte Check (%PDF, PNG, JPEG)]
        │ (3. Binary signature verified & <= 10MB default)
        ▼
[OcrScanController.js:processDocumentScan] ──► [Zero-Fabrication Token/Text Extraction]
        │ (4. Suggests NDMU Category, Auto-fills Title/Issuer/Date, Inferred AY)
        ▼
[PersonnelSubmissionModal.jsx:handleSubmit] ──► [Client Payload Normalization]
        │ (5. Resolves Suggested/Claimed Points; Manual edits override OCR)
        ▼
[PersonnelAchievementController.js:addAchievement]
        │ (6. Dispatches to Service Layer)
        ▼
[personnelAccomplishmentService.js]
        │ ──► POST /api/v1/personnel/accomplishments (Metadata Record)
        │ ──► POST /api/v1/personnel/accomplishments/{id}/evidence (Multipart Binary)
        ▼
[PersonnelAccomplishmentController.php] (CodeIgniter 4 Backend)
        │ ──► Writes binary to WRITEPATH/storage/evidence/personnel/ via [LocalEvidenceStorageService.php]
        │ ──► Computes SHA-256 Checksum & verifies MIME
        │ ──► Atomic Transaction: Inserts into `personnel_accomplishments` & `personnel_accomplishment_evidence`
        ▼
[EvidenceController.php:personnelDownload]
        │ (7. Authorized retrieval with RBAC `canReadPersonnelEvidence()` & streaming security headers)
        ▼
[Real Binary Streamed / Viewed] (No placeholder files, no localStorage authoritative dependency)
```

### Technical Trace Component Inventory

| Step | Component / Layer | Physical Path / Symbol | Current Behavior | Authoritative / Mock Status | Status for Plan A1 |
|---|---|---|---|---|---|
| **1. UI Entry** | Personnel Achievements Page | [`PersonnelAchievementsPage.jsx`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/personnel/PersonnelAchievementsPage.jsx) | Renders accomplishment library, stat pills, categories, filter bar, and triggers submission modal. | Authoritative View | **Reused in A1** |
| **2. Submission Modal** | Personnel Form Modal | [`PersonnelSubmissionModal.jsx`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/personnel/modals/PersonnelSubmissionModal.jsx) | Handles file selection, reactive category selection, adaptive category fields, and manual edits. | Authoritative View | **Reused in A1** |
| **3. Client Validation** | Security Controller | [`SecurityController.js:validateFileUpload()`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/SecurityController.js) | Enforces 10MB limit, MIME check, and verifies Magic Bytes (`%PDF`, PNG, JPEG) in memory. | Authoritative Guard | **Reused in A1** |
| **4. OCR Trigger** | OCR Scan Controller | [`OcrScanController.js:processDocumentScan()`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/OcrScanController.js) | Extracts embedded text tokens (`Tj`/`TJ`), matches keyword scoring, auto-fills fields with zero-fabrication. | Authoritative Helper | **Reused in A1/A2** |
| **5. Submit Handler** | Modal Submit Routine | [`PersonnelSubmissionModal.jsx:handleSubmit()`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/personnel/modals/PersonnelSubmissionModal.jsx) | Validates mandatory fields, normalizes category-tailored payload, resolves suggested points. | Client Handler | **Reused in A1** |
| **6. MVC Controller** | Personnel Achievement Controller | [`PersonnelAchievementController.js:addAchievement()`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/PersonnelAchievementController.js) | Coordinates payload dispatch, calls accomplishment creation, then uploads binary evidence file. | Authoritative Controller | **Reused & Hardened in A1** |
| **7. API Service** | Personnel Accomplishment Service | [`personnelAccomplishmentService.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/services/personnelAccomplishmentService.js) | Sends `POST /api/v1/personnel/accomplishments` and multipart `POST /api/v1/personnel/accomplishments/{id}/evidence`. | Authoritative Service | **Reused in A1** |
| **8. Backend Controller** | CodeIgniter Accomplishment Controller | [`PersonnelAccomplishmentController.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Controllers/Api/PersonnelAccomplishmentController.php) | Validates bounded inputs, handles transaction, executes physical file write via storage service. | Authoritative Backend | **Reused in A1** |
| **9. Evidence Storage** | Local Storage Service | [`LocalEvidenceStorageService.php:storeFile()`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/LocalEvidenceStorageService.php) | Writes binary into isolated directory `WRITEPATH/storage/evidence/personnel/`, computes SHA-256 hash. | Authoritative Storage | **Reused in A1 (Extended in I)** |
| **10. Database Write** | MySQL Defense Relational DB | Tables: `personnel_accomplishments` & `personnel_accomplishment_evidence` | Persists metadata record with foreign keys, timestamps, byte sizes, and checksums. | Authoritative DB | **Reused in A1** |
| **11. Authorized Retrieval** | Evidence Stream Controller | [`EvidenceController.php:personnelDownload()`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Controllers/Api/EvidenceController.php) | Verifies session & RBAC via `canReadPersonnelEvidence()`, streams binary with security headers. | Authoritative Stream | **Reused in A1** |

---

## 3. Valid Historical Findings Matrix

| Finding ID | Prior Finding | Revalidation Status | Code Verification & Repository Evidence |
|---|---|---|---|
| **HF-01** | Browser-only persistence (`localStorage`) is not authoritative. | **Still Valid** | Authoritative CRUD resides in MySQL via [`PersonnelAccomplishmentController.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Controllers/Api/PersonnelAccomplishmentController.php). Vestigial fallback calls to `persistAchievements` in [`PersonnelAchievementController.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/PersonnelAchievementController.js#L95) are non-authoritative and scheduled for removal in A1. |
| **HF-02** | Filename-only evidence is not acceptable. | **Still Valid** | Physical file binaries are stored on disk and indexed in `personnel_accomplishment_evidence` with SHA-256 hashes ([`LocalEvidenceStorageService.php:storeFile`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/LocalEvidenceStorageService.php#L65)). |
| **HF-03** | Placeholder proof downloads are prohibited. | **Still Valid** | Evidence streaming serves original binary bytes via [`EvidenceController.php:personnelDownload`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Controllers/Api/EvidenceController.php#L154) and [`personnelAccomplishmentService.js:downloadEvidenceBlob`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/services/personnelAccomplishmentService.js#L50). No synthesized/placeholder PDF is generated. |
| **HF-04** | Fake-success states are prohibited. | **Still Valid** | Atomic transaction boundaries in [`PersonnelAccomplishmentController.php:addEvidence`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Controllers/Api/PersonnelAccomplishmentController.php#L234) roll back database records and delete physical files upon error, returning structured HTTP 500 error envelopes. |
| **HF-05** | Filename-driven OCR inference is prohibited. | **Still Valid** | Verified by test `A2-OCR-007` in [`OcrScanControllerPhaseA2.test.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/OcrScanControllerPhaseA2.test.js#L112). Filenames are strictly ignored during entity extraction; only genuine document text is parsed. |
| **HF-06** | HR/Dean scoring authority is owned by Plan A. | **Superseded** | **Plan F** owns authoritative evaluation criteria, point values, caps, scoring rules, and Passed/Retained logic. **Plan G** owns the authorized reviewer workspace and reviewer authority. Plan A produces strictly advisory suggested/claimed points. |
| **HF-07** | Three-group personnel model (Teaching Faculty, Non-Teaching Personnel, etc.). | **Superseded** | The active personnel model establishes exactly two Personnel Groups: **Faculty** and **Non-Teaching Faculty**, with a separate **Organizational Side** (**Academic** vs **Non-Academic**), owned by **Plan D**. Plan A classifies achievements only. |

---

## 4. Rule Freeze Table

| Rule Area | Frozen Technical Baseline | Authority & Constraint Status |
|---|---|---|
| **Supported File Formats** | PDF (`.pdf`), JPEG (`.jpg`, `.jpeg`), PNG (`.png`) | Frozen Technical Baseline |
| **MIME Type Allowlist** | `application/pdf`, `image/jpeg`, `image/png` | Frozen Technical Baseline (Validated via magic bytes `%PDF`, PNG, JPEG) |
| **File Size Limit** | 10 MB (10,485,760 bytes) | **Implementation Default** (Not institutional policy; configurable) |
| **Required Submission Fields** | 1. Achievement / Activity Title<br>2. Supporting Proof Document (for new records)<br>3. Date Achieved / Conferred | Mandatory Baseline (Academic Year is deterministically derived from confirmed Date Achieved) |
| **Evidence Count Rule** | **Exactly 1 primary evidence file** per accomplishment creation | **Implementation Scope for Plan A1** (Multi-file evidence is unresolved/deferred) |
| **OCR Safety & Zero Fabrication** | 1. No guessing or fabricating unstated fields.<br>2. No default dates (never current date).<br>3. No default scopes or issuers.<br>4. No filename inference. | Strict System Invariant ([`OcrScanController.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/OcrScanController.js)) |
| **Missing OCR Data Behavior** | Leave field blank/unknown; allow personnel to complete manually; display non-blocking warning. | Strict System Invariant |
| **Manual User Override** | Personnel manual edits immediately take precedence over OCR suggestions and are never silently overwritten. | Strict System Invariant |
| **Classification Ownership** | Plan A owns **Achievement Classification** (Areas A, B, C; A.1–C.2). Plan D owns **Personnel Classification** (Personnel Group, Organizational Side, Faculty Status). | Strict Architectural Boundary |
| **Scoring Authority** | Plan F owns evaluation criteria, point values, caps, and scoring rules. Plan G provides the reviewer workspace. Suggested / Claimed points in Plan A are **strictly advisory**. | Strict Architectural Boundary |
| **Administrators Scale Mapping** | No position-to-ranking point mappings are guessed, fabricated, or hardcoded in Plan A. | Blocked / Defer to Plan F Canonical Source |
| **Duplicate Detection Policy** | Exact title/date/issuer collision warnings only. | **Advisory Warning Only** (Formal institutional duplicate-rejection rules unresolved) |

---

## 5. Implementation Boundary Matrix (Plan A vs Downstream Plans)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PLAN A OWNERSHIP                                  │
│  • Achievement evidence upload entry flow                                   │
│  • Client file safety & magic-byte validation (10MB default, PDF/JPG/PNG)   │
│  • Authenticated binary handoff to local storage service                    │
│  • OCR-assisted text extraction with Zero-Fabrication guarantee             │
│  • Achievement Category / Subcategory advisory suggestions                 │
│  • Suggested / Claimed points calculation (Advisory only)                   │
│  • Structured achievement persistence in MySQL database                     │
│  • Authorized evidence streaming retrieval                                  │
│  • Plan A-specific validation                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DOWNSTREAM PLAN RESPONSIBILITIES                       │
│                                                                             │
│  [Plan B] Achievement Repository & Portfolio Reflection                     │
│           • Canonical achievement repository, portfolio reflection, sync    │
│  [Plan C] Portfolio Submission, Locking, Revision & Versioning              │
│           • Whole-portfolio submission, immutable versions, return, revision│
│  [Plan D] Personnel Master Data, Grouping & Evaluation Eligibility          │
│           • Personnel Group (Faculty vs Non-Teaching Faculty)                │
│           • Organizational Side (Academic vs Non-Academic)                  │
│           • Faculty Status (Full-time vs Part-time), Evaluation Eligibility  │
│  [Plan E] Faculty Rank Catalog, Seeding & Progression Rules                 │
│           • Rank/title catalog, qualification mapping, rank progression     │
│  [Plan F] Evaluation Scale, Criteria & Scoring Rules Engine                 │
│           • Canonical criteria, point schedules, area caps, scoring rules,  │
│             Passed/Retained outcome logic                                   │
│  [Plan G] Reviewer Routing, Authority & Evaluation Workspace                │
│           • Reviewer routing (Dean vs HR), evaluator workspace,            │
│             accepted-point entry using Plan F rules                         │
│  [Plan H] Finalization, Printing, Deliberation & Promotion Decision         │
│           • Evaluation finalization, printable rating sheets, deliberation, │
│             promotion decisions, approved rank updates                      │
│  [Plan I] Secure Document Storage, Evidence Access & File Integrity         │
│           • Storage hardening, integrity metadata, evidence versioning,     │
│             secure access, deletion lifecycle, orphan cleanup               │
│  [Plan J] Notifications, Revision Requests, Status Tracking & Audit Trail   │
│           • Workflow notifications, revision tracking, system audit trail   │
│  [Plan K] End-to-End Validation, Test Accounts, Migration & Closure         │
│           • Comprehensive integration tests, migration validation, closure  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Downstream Responsibility Mapping

| Plan | Canonical Responsibility | Plan A Interaction Boundary |
|---|---|---|
| **Plan D** | Personnel Group (Faculty, Non-Teaching Faculty), Organizational Side (Academic, Non-Academic), Faculty Status, Personnel Master Data, Evaluation Eligibility. | Plan A does not classify employees or check evaluation eligibility. It receives personnel profile context only as passive metadata. |
| **Plan E** | Faculty rank/title catalog, qualification mapping, rank seeding, rank progression rules, exception handling. | Plan A does not seed ranks, calculate rank steps, or evaluate rank progression. |
| **Plan F** | Evaluation scale definitions, canonical criteria, point schedules, category area ceilings, scoring calculators, Passed/Retained logic. | Plan A provides advisory suggested/claimed points only. Plan A3 will consume Plan F canonical criteria rather than maintaining independent point authority. |
| **Plan G** | Reviewer routing (Faculty+Academic → Dean; Non-Teaching Faculty+Non-Academic → HR; etc.), reviewer authority, evaluator workspace, accepted-point recording. | Plan A does not route submissions to reviewers and does not decide whether HR or Dean has authority. |
| **Plan H** | Evaluation finalization, printable rating sheet rendering, deliberation handoff, promotion decisions, approved rank updates. | Plan A does not finalize evaluations, generate promotion outcomes, or alter faculty ranks. |
| **Plan I** | Storage hardening, integrity metadata (SHA-256), evidence identity, historical versions, secure streaming access, deletion lifecycle, orphan cleanup. | Plan A1 implements the minimal reusable evidence persistence foundation. **Plan I must extend or harden this foundation, not create a second competing evidence-storage implementation.** |

---

## 6. Repository Cleanup Findings & Ownership Matrix

| Obsolete / Defective Item | Current Repository Location | Issue Description | Assigned Removal Phase |
|---|---|---|---|
| **Broken `persistAchievements` calls** | [`PersonnelAchievementController.js:95, 104, 118, 132`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/PersonnelAchievementController.js) | Calls non-existent static method after array mutations. | **Plan A1** |
| **`localStorage` Audit Log Mocking** | [`SecurityController.js:150-194`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/SecurityController.js) | Uses browser `localStorage` for security audit log bus. | **Plan A1** (Align with backend audit) |
| **Legacy 3-Group Comments / References** | Frontend documentation & comments | Vestigial references to "Non-Teaching Personnel" as a separate group. | **Plan A1** |
| **Hardcoded Area Ceilings in Frontend** | [`RankingCriteriaModel.js:9-14`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/models/RankingCriteriaModel.js) | Hardcoded static ceilings will be superseded by Plan F canonical source. | **Plan A3 / Plan F** |
| **Heuristic-only Scanned PDF Parsing** | [`OcrScanController.js:108`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/OcrScanController.js) | Scanned image-only PDFs without text layers safely return empty with non-blocking warning. | **Plan A2** (Integrate Tesseract/OCR engine if confirmed) |

---

## 7. Unresolved Questions List

The following items are explicitly marked as unresolved institutional policies to prevent speculative feature expansion in Plan A1–A4:

1. **Institutional File Size Limit Confirmation:**
   - *Current Baseline:* 10 MB (10,485,760 bytes).
   - *Status:* Unconfirmed by NDMU administration; maintained strictly as an **implementation default**.
2. **Multi-File Evidence Support:**
   - *Current Baseline:* Exactly 1 primary evidence file per accomplishment.
   - *Status:* Single-file model retained for Plan A1. Multi-file support is marked as an **unresolved future enhancement**.
3. **Institutional Duplicate Policy:**
   - *Current Baseline:* Advisory collision warning on exact title/date/issuer match.
   - *Status:* Unresolved; will not act as an authoritative rejection block in Plan A1.
4. **Administrators Ranking Scale Position Mappings:**
   - *Current Baseline:* Unmapped.
   - *Status:* Unresolved; Plan A will not guess or hardcode administrative position point mappings.

---

## 8. Change-Impact Summary (Post-Audit Personnel Refinements)

1. **Decoupling Employee Model from Achievement Ingestion:**
   - Plan A no longer sets, modifies, or queries `personnel_group`, `organizational_side`, or `faculty_status`.
   - Employee classification (Faculty vs Non-Teaching Faculty; Academic vs Non-Academic) is handled strictly in Plan D.
2. **Elimination of Guessed Scoring Authority:**
   - Plan A produces strictly advisory `claimed_points`. Authoritative evaluation scoring, category area ceilings, and Passed/Retained outcomes belong entirely to Plan F and Plan G.
3. **Reviewer Routing Authority:**
   - Plan A contains no logic determining whether a submission routes to College Dean or HR Director. Reviewer routing is resolved dynamically in Plan G.
4. **Single Reusable Storage Pipeline:**
   - Plan A1 implements the minimal viable evidence storage pipeline (upload → local private disk → DB reference → streaming download). Plan I will harden this exact service rather than introducing a redundant storage architecture.

---

## 9. Phase A0 Validation Checklist & Sign-Off

- [x] Current repository upload flow re-traced end-to-end.
- [x] Previous A0 findings individually revalidated (valid vs superseded).
- [x] Plan D ownership is described correctly (Personnel Group, Organizational Side, Faculty Status, Evaluation Eligibility).
- [x] Plan E ownership is described correctly (Rank/Title catalog and progression only).
- [x] Plan F ownership is described correctly (Canonical evaluation criteria, point values, caps, scoring rules, Passed/Retained).
- [x] Plan G ownership is described correctly (Reviewer routing, reviewer authority, evaluation workspace).
- [x] Plan H ownership is described correctly (Finalization, printing, deliberation, promotion decision, approved rank update).
- [x] Plan I extends the same evidence-storage foundation instead of duplicating it.
- [x] Plan A does not classify employees (Achievement Classification vs Personnel Classification cleanly separated).
- [x] Plan A does not select HR vs Dean reviewer routing.
- [x] Plan A does not assign evaluation scales.
- [x] Plan A does not own rank progression.
- [x] Plan A does not calculate Passed/Retained outcomes.
- [x] Plan A does not make promotion decisions.
- [x] Only Faculty and Non-Teaching Faculty are active Personnel Groups.
- [x] Academic and Non-Academic are treated as Organizational Side.
- [x] No current third-group "Non-Teaching Personnel" or "Teaching Faculty" final group rule remains.
- [x] OCR zero-fabrication rule remains strictly enforced and validated by unit tests.
- [x] Suggested/claimed points remain strictly non-authoritative.
- [x] Temporary technical defaults (10MB file limit, 1 evidence file) are clearly labeled.
- [x] Unresolved Administrators Ranking Scale mapping is not guessed.
- [x] Unresolved duplicate detection policy is treated as advisory only.
- [x] Phase A0 report has no contradictory downstream plan labels or duplicate sections.
- [x] Plan A1 can begin on a clean, verified, implementation-ready baseline.

---

## 10. Final Status / A1 Readiness Decision

**PHASE A0 REMEDIATION — COMPLETE**  
**PHASE A0 — COMPLETE — REVALIDATED AFTER PERSONNEL WORKFLOW CHANGES**

Plan A1 (Evidence Persistence Foundation) is authorized to proceed immediately on this frozen baseline.
