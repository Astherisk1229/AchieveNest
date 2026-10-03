# Personnel Evaluation Track — Plan D2 — Phase D2-3
# HR Override, Existing-Rank Preservation & Edit Safety — Formal Implementation Report

**Status:** COMPLETE  
**Baseline Verification:** 157 / 157 test files passed, 1,777 / 1,777 tests passed, 0 failures.  
**Backend Syntax:** 0 lint errors (`php -l` clean).  

---

## 1. Executive Summary & Objective

Phase D2-3 formalized the HR override and migration/edit safety rules for Current Academic Rank and Part-Time Title in the HR Personnel Directory workflow (`EditMasterDataModal.jsx` and `OnboardPersonnelModal.jsx`). The advisory recommendation introduced in Phase D2-2 remains strictly assistive, while the official saved current rank/title remains authoritative for existing Personnel and is never silently reset, downgraded, or auto-promoted.

The core rule governing this phase is:
> **Recommendation assists HR; it does not silently overwrite, downgrade, promote, or reset an existing official current rank/title.**

---

## 2. Saved-Rank Initialization & Recommendation Separation

### 1. Edit Initialization Order
When `EditMasterDataModal.jsx` opens:
1. **Load Authoritative Saved Rank**: `savedOfficialRank` is read directly from `personnel.current_rank_title` (or `personnel.academic_rank`) and initializes `form.currentRankTitle`.
2. **Load Authoritative Catalog**: Catalogs (Full-Time 26 ranks, Part-Time 4 titles) load asynchronously via `personnelMasterDataService`.
3. **Legacy Check**: If the saved value is not in the active catalog, a dedicated legacy option is preserved with a clear reconciliation badge.
4. **Advisory Recommendation**: `personnelRankRecommendationService.resolveRecommendation` runs separately in the background and populates an advisory indicator.
5. **No Silent Overwrite**: The arrival of recommendation data never mutates `form.currentRankTitle`.

### 2. State Model Separation
The frontend maintains distinct state variables:
- `currentRankTitle`: Current form-selected rank (saved to database).
- `savedOfficialRank`: Unmutated baseline from DB record.
- `rankWasManuallyChanged`: Dirty boolean flag tracking deliberate HR modifications.
- `rankSelectionSource`: Categorized as `'saved'`, `'recommended'`, `'manual'`, `'legacy'`, or `'none'`.
- `recommendation`: Advisory object containing `{ status, recommendedCode, recommendedLabel, reasonCode, message, source }`.

---

## 3. Explicit HR Override & "Use Suggested Rank" Action Helper

1. **Explicit Selection**:
   - HR administrators may deliberately choose any valid seeded rank from the active catalog.
   - When HR manually changes the rank, an `HR Override` badge is displayed.
2. **"Use Suggested Rank" Action**:
   - When the resolved recommendation differs from `form.currentRankTitle`, a dedicated "Use Suggested Rank" button appears in the advisory alert.
   - Clicking this button explicitly copies the recommended rank into the form without auto-submitting.
3. **Preservation Against Subsequent Edits**:
   - Once HR manually chooses a rank or clicks "Use Suggested Rank", modifying other fields (e.g. qualifications, departments, colleges, employment status) does not reset the rank selection.

---

## 4. Invariant Protections & Safety Guarantees

### 1. Silent Downgrade & Reset Protection
- **Saved Professor III** $\rightarrow$ Qualification mapping resolves `Professor I` $\rightarrow$ Current rank remains `Professor III`.
- **Saved Associate Professor II** $\rightarrow$ Qualification mapping resolves `Assistant Professor I` $\rightarrow$ Current rank remains `Associate Professor II`.
- **Saved Senior Instructor IV** $\rightarrow$ Qualification mapping resolves `Instructor I` $\rightarrow$ Current rank remains `Senior Instructor IV`.
- **Saved Professorial Lecturer (Part-Time)** $\rightarrow$ Qualification mapping resolves `Lecturer` $\rightarrow$ Current title remains `Professorial Lecturer`.

### 2. Auto-Promotion Protection
- Entering higher qualifications (e.g. Master's to PhD) inside the modal never triggers sequential progression transitions.
- 0 `PromotionDecision` entities are created.
- 0 `EvaluationResult` records are altered.

### 3. PhD Exception Boundary
- The Plan E exception for `Assistant Professor I` jumping to `Professor I` upon earning a PhD is strictly governed by the formal evaluation/promotion track.
- The master-data modal never automatically executes this jump.

### 4. Faculty Status Switching Safety
- **New Records**: Switching `full_time_faculty` $\leftrightarrow$ `part_time_faculty` clears incompatible unsaved ranks and preselects the applicable recommendation in the new catalog.
- **Existing Records**: The saved rank is preserved. Mismatches are flagged for reconciliation, and cross-catalog submissions are rejected server-side with 422 `CATALOG_CROSSOVER_REJECTED`.

### 5. Legacy Rank Handling
- Unmatched historical rank strings are rendered as `(Saved / Legacy Record - Reconciliation Required)` and highlighted with a warning banner.
- Legacy strings are never auto-mapped to nearest catalog ranks and remain intact until explicit HR reconciliation.

---

## 5. Backend Validation & Plan J Audit Integration

1. **Catalog & Crossover Validation**:
   - `FacultyStatusService.php` and `TargetProvisioningController.php` reject invalid rank strings and cross-catalog assignments with 422 `CATALOG_CROSSOVER_REJECTED`.
2. **Unchanged-Rank No-Op**:
   - If submitted rank matches saved rank, master data updates proceed without rank-change progression or promotion audit side effects.
3. **Audit Trail**:
   - When rank is modified, the lifecycle event log records `prior_rank`, `new_rank`, HR actor ID, and justification reason.
4. **Position / Job Title Independence**:
   - Free-text position titles (e.g. "Department Chair", "Assistant Dean") remain purely descriptive and never infer or override academic rank.

---

## 6. Comprehensive Verification & Test Results

### 1. Focused Suite: `PersonnelHROverrideAndEditSafetyD2Phase3.test.jsx` (40/40 Passed)
- Existing-Rank Preservation (Req 1–7): 7/7 passed
- Recommendation Separation & State Model (Req 8–11): 4/4 passed
- Downgrade & Reset Protection (Req 12–15): 4/4 passed
- Promotion Protection & Boundaries (Req 16–20): 5/5 passed
- Explicit HR Override & Audit (Req 21–25): 5/5 passed
- Legacy Reconciliation (Req 26–29): 4/4 passed
- Faculty Status Switching & Backend Safety (Req 30–36): 7/7 passed
- Boundaries & Regressions (Req 37–40): 4/4 passed

### 2. Full Master Suite Verification
- **Total Test Files**: 157 passed (157 total)
- **Total Tests**: 1,777 passed (1,777 total)
- **Failures / Errors**: 0
- **Backend Linting**: 0 syntax errors across all controllers, services, and routes.

---

## 7. Evidence Package & Artifact Index

All supporting logs, hashes, and verification documents are archived under:
`docs/implementation/evidence/plan-d2-d2-3-hr-override-existing-rank-preservation/`

- `environment.md`
- `repository-head.md`
- `current-vs-recommendation-state.md`
- `edit-initialization.md`
- `manual-override.md`
- `existing-rank-preservation.md`
- `silent-downgrade-protection.md`
- `silent-reset-protection.md`
- `auto-promotion-protection.md`
- `phd-exception-boundary.md`
- `migration-reconciliation.md`
- `legacy-rank-handling.md`
- `server-catalog-validation.md`
- `explicit-rank-change-detection.md`
- `plan-j-audit-integration.md`
- `faculty-status-switch-safety.md`
- `payload-minimality.md`
- `concurrency-risk.md`
- `focused-test-output.txt`
- `full-suite-output.txt`
- `full-suite-result.json`
- `checksum-manifest.md`

---

## 8. Final Phase Status

**PHASE D2-3 COMPLETE — HR RANK/TITLE OVERRIDE, EXISTING-RANK PRESERVATION, MIGRATION SAFETY & NO-SILENT-RESET GUARANTEES VERIFIED**
