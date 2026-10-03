# Personnel Evaluation Track — Plan C — Phase C0
## Whole-Portfolio Submission, Versioning, Locking & Revision — Audit and Rule Freeze Report

### Objective

This audit establishes the baseline for **Plan C: Whole-Portfolio Submission, Versioning, Locking & Revision**. It examines the current submission mechanisms across frontend controllers and backend database schemas, identifies mutability and synchronization gaps, reconciles status vocabularies, and freezes the core architectural rules prior to implementing Phases C1–C4.

---

### 1. Executive Summary & Core Architectural Rule

Plan B successfully established the **live canonical working portfolio**, reflecting backend achievements without mock seeds or local storage dependencies. 

The primary rule governing Plan C is:

> **Plan B owns the editable working portfolio. Plan C owns whole-portfolio submission, immutable submitted version snapshots, server-enforced locking, return-for-revision lifecycle, and version history.**

#### Primary Audit Findings:
1. **Frontend-Backend Disconnect**: Clicking "Submit Portfolio to Dean" in `PersonnelPortfolioEditPage.jsx` currently triggers an in-memory transition to `'SUBMITTED_TO_DEP_SEC'` inside `PersonnelPortfolioController.js` / `PersonnelPortfolioModel.js`. **No backend API request is dispatched**, and no record is created in the database.
2. **Existing Backend Evaluation Tables**: The backend schema already defines `personnel_evaluations`, `personnel_evaluation_items`, `personnel_evaluation_events`, and `personnel_evaluation_reports`, but these tables are presently only manipulated by evaluators (`HREvaluationController.php`). No dedicated Personnel submission endpoint exists in `Routes.php`.
3. **Status Terminology Mismatch**:
   - Frontend Model uses: `DRAFT`, `SUBMITTED_TO_DEP_SEC`, `ENDORSED_TO_HR`, `HR_APPROVED`.
   - Backend Database Schema enforces: `CHECK (status IN ('submitted', 'in_evaluation', 'ready_for_finalization', 'returned_for_revision', 'completed'))`.
4. **Lack of Immutable Snapshotting on Submission**: Because no submitted version snapshot is stored when Personnel submits, subsequent edits to canonical achievements in Plan A/B directly alter the un-snapshotted draft state.
5. **No Version History Tracking**: There is currently no multi-version tracking table or version incrementing mechanism for resubmissions following a return for revision.

---

### 2. Current Submission Flow Trace

| Step | Component / Action | Current Behavior | Gap / Limitation |
| :--- | :--- | :--- | :--- |
| **1. User Action** | `PersonnelPortfolioEditPage.jsx` (`handleSubmitPortfolio`) | Checks proof document presence across reflected line items; calls `submitToDean()` | Client-side check only; no network dispatch |
| **2. Hook Execution** | `usePersonnelPortfolio.js` (`submitToDean`) | Invokes `PersonnelPortfolioController.submitToDean(portfolio)` | Updates React hook memory state only |
| **3. Controller Transition** | `PersonnelPortfolioController.js` (`submitToDean`) | Calls `portfolioModel.transitionStatus('SUBMITTED_TO_DEP_SEC')` | No backend API service called |
| **4. In-Memory Mutation** | `PersonnelPortfolioModel.js` (`transitionStatus`) | Appends transition object to `#audit_trail` in memory and sets `#status` | State resets to `DRAFT` upon page reload or logout |
| **5. Backend Persistence** | Backend API / Database | **None called** | `personnel_evaluations` table remains unpopulated by Personnel |
| **6. Reviewer Visibility** | `HREvaluationController.php` (`list`, `get`) | Reads `public.personnel_evaluations` where status = `'submitted'` | Evaluators cannot see submissions unless pre-seeded or manually inserted in DB |
| **7. Return / Revision** | `HREvaluationController.php` (`returnEvaluation`) | Sets DB status to `'returned_for_revision'` with `return_reason` | Personnel frontend has no endpoint to read or resubmit the returned package |

---

### 3. Submission Data Model Inventory

| Table / Structure | Schema Location | Purpose | Plan Classification | Status & Observations |
| :--- | :--- | :--- | :--- | :--- |
| `personnel_evaluations` | PostgreSQL `public` | Master evaluation record: `personnel_profile_id`, `status`, `academic_year`, `total_score`, `final_snapshot`, `submitted_at` | **Plan C / Plan G** | Exists in DB with check constraints; needs canonical submission endpoint for Personnel (Phase C1) |
| `personnel_evaluation_items` | PostgreSQL `public` | Line items submitted for ranking evaluation: `accomplishment_id`, `category_area`, `criterion_code`, `verification_status`, `awarded_points` | **Plan C (Snapshot) / Plan G (Scoring)** | Line item storage exists; needs population upon portfolio submission |
| `personnel_evaluation_events` | PostgreSQL `public` | Audit event log: `evaluation_id`, `event_type`, `performed_by`, `payload`, `created_at` | **Plan C / Plan J** | Event log table exists for transition audits |
| `personnel_evaluation_reports` | PostgreSQL `public` | Finalized evaluation reports with full JSONB payload | **Plan H** | Final evaluation output table |
| `PersonnelPortfolioModel` | Frontend Model | In-memory working draft model encapsulating line items, claimed points, and UI status | **Plan B** | Active working portfolio model |

---

### 4. Status Vocabulary Ownership Matrix

| Lifecycle Status | Frontend Code | Backend DB Constraint | Canonical Owner | Semantic Definition |
| :--- | :--- | :--- | :--- | :--- |
| **`DRAFT`** | `PersonnelPortfolioModel` | *(Implicit / Working)* | **Plan B** | Active editable working portfolio draft |
| **`submitted`** | `SUBMITTED_TO_DEP_SEC` | `'submitted'` | **Plan C** | Whole portfolio submitted by Personnel, locked from direct mutation |
| **`in_evaluation`** | *(N/A)* | `'in_evaluation'` | **Plan G** | Evaluator has commenced official review |
| **`returned_for_revision`** | `RETURNED_TO_PERSONNEL` | `'returned_for_revision'` | **Plan C** | Returned by reviewer to Personnel for required adjustments |
| **`ready_for_finalization`** | `ENDORSED_TO_HR` | `'ready_for_finalization'` | **Plan G / Plan H** | All items verified & scored, pending committee closure |
| **`completed`** | `HR_APPROVED` | `'completed'` | **Plan H** | Evaluation finalized, immutable snapshot permanently stored |

> **Alignment Action**: In Phase C1/C2, frontend lifecycle state transitions will be normalized to align with the authoritative backend database status vocabulary (`draft`, `submitted`, `in_evaluation`, `returned_for_revision`, `ready_for_finalization`, `completed`).

---

### 5. Working Portfolio vs. Submitted Version Analysis

| Dimension | Plan B Working Portfolio | Plan C Submitted Portfolio Version |
| :--- | :--- | :--- |
| **Mutability** | Fully editable (add, update, delete achievements) | **Strictly Immutable** once submitted |
| **Data Nature** | Live dynamic reflection over Plan A records | Frozen submitted-time snapshot of achievements & metadata |
| **Identity** | Tied to `personnel_profile_id` | Unique `submission_id` / `evaluation_id` with `version_number` |
| **Evidence Access** | Live authenticated evidence stream | Bound to the exact evidence record active at submission time |
| **Downstream Impact** | Does not affect active evaluations | Authoritative basis for Plan G reviewer scoring |

---

### 6. Immutability, Locking & Concurrency Audit

1. **Submitted Version Immutability**:
   - Currently, if an achievement is edited in the repository, any hypothetical submission viewing that achievement via live joins would mutate.
   - **Plan C Requirement**: Submission must capture a point-in-time snapshot (in `personnel_evaluation_items` and `final_snapshot` JSONB) so that subsequent working draft edits do not rewrite prior submitted versions.
2. **Locking Mechanism**:
   - Client-side disabling of "Submit" or "Edit" buttons is insufficient.
   - **Plan C Requirement**: The backend must enforce server-side validation rejecting modifications to submitted portfolios while status is `'submitted'`, `'in_evaluation'`, `'ready_for_finalization'`, or `'completed'`.
3. **Duplicate Submission Protection**:
   - No unique constraint currently prevents multiple simultaneous submissions for the same personnel in the same academic year.
   - **Plan C Requirement**: Backend must enforce an idempotency check or active submission constraint preventing duplicate active submissions for the same evaluation cycle.

---

### 7. Return-for-Revision & Resubmission Trace

1. **Reviewer Return Action (Plan G Trigger)**:
   - Evaluator calls `POST /api/v1/hr/evaluations/{id}/return` with `{ "reason": "Missing signature on proof doc" }`.
   - Backend transitions status to `'returned_for_revision'`, recording `return_reason` and `returned_at`.
2. **Personnel Reaction (Plan C Responsibility)**:
   - Working portfolio unlocks into editable state for Personnel to rectify cited deficiencies.
   - Personnel adjusts canonical achievements or uploads replacement evidence via Plan A/B flows.
   - Personnel resubmits the portfolio package via `POST /api/v1/personnel/portfolio/resubmit`.
   - System increments `version_number` (or records a distinct resubmission event), preserving the historical submission and reviewer comments.

---

### 8. Architectural Boundary Confirmation

```
+-------------------------------------------------------------------------------+
| PLAN B (Complete)                                                             |
| - Live achievement reflection over canonical backend                          |
| - Advisory-only claimed points presentation                                    |
| - Deterministic area grouping & sorting                                       |
+-------------------------------------------------------------------------------+
                                      │
                                      │ (Personnel Submits Whole Portfolio)
                                      ▼
+-------------------------------------------------------------------------------+
| PLAN C (Current Scope - Phases C1-C4)                                         |
| - Canonical Whole-Portfolio Submission Endpoint (POST /personnel/portfolio/submit)|
| - Server-Enforced Immutability & Status Locking                               |
| - Submitted Version Snapshotting (Items, Claimed Points, Evidence References)  |
| - Return-for-Revision & Resubmission Lifecycle                                |
| - Version History Tracking                                                    |
+-------------------------------------------------------------------------------+
                                      │
                                      │ (Reviewer Access & Scoring)
                                      ▼
+-------------------------------------------------------------------------------+
| DOWNSTREAM BOUNDARIES (Excluded from Plan C)                                  |
| - Plan D: Personnel Group classification & eligibility validation             |
| - Plan E: Rank progression & title criteria                                   |
| - Plan F: Authoritative criteria scoring algorithms & ceiling caps            |
| - Plan G: Reviewer routing, evaluator verification & accepted scoring         |
| - Plan H: Final deliberation, printing & promotion approval                   |
| - Plan I: Advanced evidence lifecycle hardening & storage deduplication       |
| - Plan J: Notification delivery & audit-trail event pub/sub                   |
+-------------------------------------------------------------------------------+
```

---

### 9. Rule Freeze

#### 9.1 Confirmed Architectural Rules
1. **Working Draft Independence**: Plan B working portfolio remains the editable draft workspace; Plan C manages the discrete submission packages derived from it.
2. **Submission Immutability**: Submitted portfolio versions must never silently mutate when source canonical achievements are modified after submission.
3. **Authoritative Backend Storage**: All submission transitions, snapshots, and version states must be stored in PostgreSQL (`personnel_evaluations`, `personnel_evaluation_items`, `personnel_evaluation_events`).
4. **Server-Enforced Locking**: Lock enforcement must be validated server-side, not solely through frontend button states.
5. **Separation of Reviewer Scoring**: Evaluator verification, accepted points, and rating modes belong strictly to Plan G. Plan C provides only the submission package and lifecycle state.
6. **Separation of Evidence Storage Hardening**: File storage retention and orphan cleanup belong to Plan I. Plan C references active canonical evidence IDs.

#### 9.2 Explicitly Unresolved Rules (Deferred / To Be Formalized)
1. **Academic Evaluation Cycle Definition**: Whether evaluation cycles are strictly annual (`AY 2025-2026`) or multi-period semester terms.
2. **Submission Withdrawal Policy**: Whether Personnel can formally withdraw a submitted portfolio before evaluation begins (deferred to HR governance).
3. **Maximum Resubmission Attempts**: Whether there is a strict numerical cap on return-for-revision iterations per cycle.
4. **Frozen Profile Snapshot Fields**: Exact extent of HR master profile fields captured in the submission snapshot versus joined dynamically from `profiles`.

---

### 10. Phase C1–C4 Cleanup & Implementation Roadmap

| Implementation Phase | Key Deliverables & Responsibilities |
| :--- | :--- |
| **Phase C1: Canonical Submission & Snapshot Creation** | - Build `POST /api/v1/personnel/portfolio/submit` endpoint.<br>- Wire `PersonnelPortfolioEditPage.jsx` to real backend submission service.<br>- Populate `personnel_evaluations` and `personnel_evaluation_items` with submitted snapshot.<br>- Implement duplicate submission / concurrency guard. |
| **Phase C2: Server-Enforced Immutability & Locking** | - Enforce server-side lock rejecting updates to submitted portfolios.<br>- Reflect read-only locked UI state in Personnel workspace upon submission.<br>- Verify source achievement edits do not mutate submitted snapshots. |
| **Phase C3: Return-for-Revision, Resubmission & Version History** | - Build `POST /api/v1/personnel/portfolio/resubmit` endpoint.<br>- Handle unlock upon reviewer return and capture revision reasons.<br>- Maintain submission version history and event trail. |
| **Phase C4: End-to-End Validation & Plan C Closure** | - End-to-end integration testing across submission, locking, return, and resubmission.<br>- Full regression audit against Plan A and Plan B.<br>- Author final Plan C closure report. |

---

### 11. Final Phase Status

**PHASE C0 — COMPLETE — WHOLE-PORTFOLIO SUBMISSION, VERSIONING & REVISION FLOW AUDITED**
