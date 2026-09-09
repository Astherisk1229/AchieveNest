# Personnel Evaluation Track — Plan K — Phase K0
# Test Matrix Freeze & Acceptance Baseline Report

## Executive Summary

**Phase K0 (Final Acceptance Matrix Freeze)** has established the canonical end-to-end acceptance baseline for the entire Personnel Evaluation Track. 

Plan K is an **audit and validation track** designed to prove the end-to-end stability and correctness of the completed systems (Plans A–J and Plan D2). In strict adherence to the governing principles of Phase K0:
- **Zero Production Mutations**: No production code, database seeds, or business logic were altered.
- **Zero Inferred Rules**: All business rules, reviewer routes, rank progressions, scoring rubrics, and final outcomes trace directly to confirmed source documents.
- **Explicit Unresolved Boundaries**: Items lacking authoritative governance definitions (e.g. post-deletion audit retention policy, Position/Job Title catalog, Non-Teaching Non-Academic teaching rank rules) remain explicitly designated as unresolved by design.

---

## 1. Authoritative Source Hierarchy

All acceptance criteria and test expectations adhere to the following strict hierarchy:
1. **Authoritative Plan Implementation Plans & Reports**: Plans A, B, C, D, D2, E, F, G, H, I, and J.
2. **HR Business-Rule Documents**: NDMU Faculty Manual, Rating Sheets (`NDMU-DOC-EVAL-ADMIN-2026-V1`, `NDMU-DOC-EVAL-NON-TEACHING-2026-V1`), Rank Catalogue (`NDMU-DOC-ACAD-RANKS-2026-V1`).
3. **Current Active Implementation**: Frontend controllers, backend endpoints, and evaluation domain services.
4. **Focused Regressions**: Consolidated suites across all tracks.

---

## 2. Final Personnel Model Freeze

- **Personnel Groups**: Exactly two active groups: `Faculty` (`faculty`) and `Non-Teaching Faculty` (`non_teaching_faculty`).
- **Organizational Sides**: Exactly two sides: `Academic` (`academic`) and `Non-Academic` (`non_academic`).
- **Allowed Combinations**:
  - `Faculty` + `Academic`
  - `Non-Teaching Faculty` + `Academic`
  - `Non-Teaching Faculty` + `Non-Academic`
- **Unsupported Combination**: `Faculty` + `Non-Academic` (rejected with HTTP 422 `INVALID_CLASSIFICATION_PAIR`).
- **Faculty Status (Engagement)**: `Full-time Faculty` (`full_time_faculty`), `Part-time Faculty` (`part_time_faculty`).
- **Employment Status**: `Permanent` (`permanent`), `Probationary` (`probationary`).

---

## 3. Evaluation Eligibility Rules Freeze

1. **Part-time Faculty Exclusion**: Part-time faculty receive qualification-mapped titles (`Lecturer` $\dots$ `Professorial Lecturer`) but are barred from ranking evaluations and sequential rank promotion.
2. **Full-time Evaluation Precondition**: Full-time faculty are evaluated only when `subject_to_evaluation = true`.
3. **One Evaluation per Cycle**: A personnel profile can have at most one active ranking evaluation per academic evaluation cycle.

---

## 4. Reviewer Routing Matrix Freeze

| Personnel Context | Personnel Group | Organizational Side | Evaluator / Reviewer | Scope Type |
|---|---|---|---|---|
| Academic Faculty | `faculty` | `academic` | **Dean** | `COLLEGE_ACADEMIC_SCOPE` (College Match) |
| Academic Non-Teaching | `non_teaching_faculty` | `academic` | **Dean** | `COLLEGE_ACADEMIC_SCOPE` (College Match) |
| Non-Academic Non-Teaching | `non_teaching_faculty` | `non_academic` | **HR Staff / Admin** | `UNIVERSITY_HR_SCOPE` |
| Dean Evaluation | `faculty` | `academic` | **HR Staff / Admin** | `UNIVERSITY_HR_SCOPE` |
| Vice President | `faculty` / `non_teaching_faculty` | Institutional | **HR Staff / Admin** | `UNIVERSITY_HR_SCOPE` |

*Exclusions*: Department Secretaries are strictly excluded from evaluator authority. Deans cannot evaluate cross-college candidates. Self-evaluations are prohibited.

---

## 5. Rank & Title Cases Freeze

1. **Full-Time Initial Recommendation**: MS in CS $\rightarrow$ Suggests `Assistant Professor I`.
2. **Part-Time Initial Recommendation**: PhD $\rightarrow$ Suggests `Professorial Lecturer`.
3. **Board-Passer Professional Path**: Verified licensure $\rightarrow$ Suggests `Senior Instructor`.
4. **Sequential Progression**: `Instructor I` $\rightarrow$ Passed Evaluation + Approved Promotion $\rightarrow$ `Instructor II`.
5. **Verified PhD Exception Jump**: `Assistant Professor I` $\rightarrow$ Verified PhD + Passed + Approved $\rightarrow$ `Professor I`.
6. **Existing High-Rank Preservation**: Saved `Professor III` + MS qualification $\rightarrow$ Rank remains `Professor III`.
7. **No Auto-Promotion from Modal**: D2 modal suggestion cannot alter official rank without explicit HR selection.
8. **Non-Teaching Non-Academic Boundary**: Formally designated as `NO GUESSED ACADEMIC-RANK RULE`.

---

## 6. Scoring Cases Freeze

1. **Automatic Scale Assignment**:
   - Academic personnel $\rightarrow$ `ADMINISTRATORS_RANKING_SCALE` (Max 160.0, Pass 120.0).
   - Non-academic personnel $\rightarrow$ `NON_TEACHING_PERSONNEL_RANKING_SCALE` (Max 160.0, Pass 120.0).
2. **Scoring Cap Enforcement**: Area A capped at 70.0 points; Area B capped at 60.0; Area C capped at 30.0.
3. **Evaluator Points**: Areas B.3 and B.6 require authorized evaluator input.
4. **Evaluation Result Formula**:
   - Accepted Total $\ge 120.00 \implies$ **`Passed`**.
   - Accepted Total $< 120.00 \implies$ **`Retained`**.

---

## 7. Final Outcomes Freeze

| Case | Evaluation Result | Promotion Decision | Effective Rank Outcome |
|---|---|---|---|
| **Case A** | `Passed` | `Approved` | Promoted to next valid rank (e.g. `Instructor II`) |
| **Case B** | `Passed` | `Not Approved` | Current rank retained (e.g. `Instructor I`) |
| **Case C** | `Retained` | N/A (Ineligible) | Current rank retained |
| **Case D** | Blocked | Blocked | Part-time title retained (Ranking blocked) |
| **Case E** | Blocked | Blocked | Evaluation does not start (`subject_to_evaluation = false`) |

---

## 8. Required Test Persona Matrix

| Persona ID | Description | Group | Side | Faculty Status | Context |
|---|---|---|---|---|---|
| **P1** | Full-Time Faculty Candidate | `faculty` | `academic` | `full_time_faculty` | College 1 (Engineering) |
| **P2** | Part-Time Faculty Candidate | `faculty` | `academic` | `part_time_faculty` | College 1 (Engineering) |
| **P3** | Academic Non-Teaching Candidate | `non_teaching_faculty` | `academic` | `full_time_faculty` | College 2 (Arts & Sciences) |
| **P4** | Non-Academic Non-Teaching Candidate | `non_teaching_faculty` | `non_academic` | `full_time_faculty` | Administrative Unit (Registrar) |
| **P5** | College Dean (Evaluator) | `faculty` | `academic` | `full_time_faculty` | College 1 Dean |
| **P6** | HR Administrator | `hr_staff` / `hr_admin` | Institutional | N/A | HRMO |
| **P7** | Vice President | `faculty` / `non_teaching_faculty` | Institutional | `full_time_faculty` | Institutional Executive |
| **P-SEC** | Department Secretary | `non_teaching_faculty` | `academic` | `full_time_faculty` | Clerical Negative Test |
| **P-LEG** | Legacy Personnel Record | `non_teaching_personnel` | Legacy | `full_time_faculty` | Migration Test |

---

## 9. Versioning & Whole-Portfolio Revision Freeze

- **Whole Portfolio Return**: When returning for revision, the entire portfolio returns to the candidate with an overall mandatory revision message.
- **Immutable Historical Snapshots**: Submissions generate immutable numbered snapshots (`v1`, `v2`).
- **Resubmission Lineage**: Resubmitting resolves the active revision request flag and links version lineage.

---

## 10. Security Negative Scenarios Freeze

1. **Cross-User Access Denial**: User A cannot view User B's evidence (HTTP 403).
2. **Cross-College Dean Denial**: Dean of College 1 cannot evaluate College 2 (HTTP 403).
3. **Department Secretary Evaluator Denial**: Department Secretary cannot evaluate (HTTP 403).
4. **Locked Submission Protection**: Direct modifications to submitted snapshots are rejected.
5. **Audit Immutability**: All client attempts to modify or delete audit log entries are rejected.

---

## 11. Migration Cases Freeze

- Legacy records with `personnel_group = 'non_teaching_personnel'` map to `non_teaching_faculty` only when official unit placement data exists.
- Ambiguous records lacking placement require manual HR reconciliation.
- Legacy unmatched ranks remain preserved with an amber warning badge until explicitly reconciled.

---

## 12. Unresolved Rule Register

The following boundaries are frozen as **UNRESOLVED BY DESIGN**:
1. `UNRESOLVED — AUDIT RETENTION AFTER COMPLETE OWNER DELETION`
2. `POSITION / JOB TITLE SOURCE — UNRESOLVED`
3. `NO GUESSED ACADEMIC-RANK RULE — NON-TEACHING FACULTY + NON-ACADEMIC`
4. `ANNUAL REVIEW / SUBJECT-TO-EVALUATION EXACT ALGORITHM`
5. `EVALUATION CYCLE AUTOMATED ROLLOVER SCHEDULE`

---

## 13. Conflict Register

| Conflict ID | Topic | Resolution |
|---|---|---|
| **CONF-K0-01** | Legacy 3rd Group vs 2-Group Model | 2-Group Model is canonical; legacy group is migration-only. |
| **CONF-K0-02** | Position Free-Text vs Master-Data Catalogs | Position is descriptive text; ranks & units are canonical catalogs. |
| **CONF-K0-03** | Auto-promotion assumption | Recommendation is strictly advisory; promotions require authorized decision. |

---

## 14. Canonical Acceptance Matrix

The canonical acceptance matrix contains 39 stable test cases (`K0-A01` through `K0-U02`) covering all 10 evaluation domains. The full matrix is persisted at [acceptance-matrix.md](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/evidence/plan-k-k0-test-matrix-freeze/acceptance-matrix.md).

---

## 15. Focused & Master Regression Results

### K0 Focused Audit Suite
- **File**: `frontend/src/controllers/__tests__/PersonnelPlanKPhaseK0Audit.test.jsx`
- **Tests**: **40 / 40 passed** (0 failures).

### Master Full Regression Suite
- **Files**: **159 test files passed (159 total)**
- **Tests**: **1,883 passed (1,883 total)**
- **Failures**: **0**
- **Duration**: **78.14s**
- **Exit Code**: **0**

### Backend PHP Syntax Lint
- **Scanned Files**: 182 files across `backend/app`
- **Syntax Errors**: 0 errors detected

---

## 16. K1 Readiness Decision

> **Phase K0 is formally APPROVED and FROZEN.**
>
> **The Personnel Evaluation Track acceptance matrix is 100% complete, verified, and locked.**
>
> **The track is fully ready to proceed to Phase K1 (Test Persona & Account Preparation).**

---

*Report certified by: Antigravity Automated Verification Agent*  
*Date: 2026-09-09*
