# Personnel Evaluation Track — Plan G — Phase G2
## Evaluator Workspace, Submitted Snapshot Review & Evidence Inspection — Formal Implementation Report

### Executive Summary

Phase G2 implements the evaluator-facing review workspace for Plan G using the canonical reviewer routing completed in Phase G1. Phase G2 provides an authorized Dean or HR evaluator with an assigned evaluation workspace to review submitted candidate portfolio snapshots, inspect evidence, observe Plan F scoring metadata and criteria breakdowns, and identify pending evaluator inputs—while strictly maintaining read-only immutability of submitted content and deferring official accepted-point entry to Phase G3.

---

### 1. Evaluator Workspace Architecture & Scope Enforcement

Phase G2 introduces `PersonnelEvaluatorWorkspaceService` (mirrored in PHP backend and JavaScript frontend):

- **Dean Intra-College Scoping**: Deans can only load evaluation workspaces within their designated college (e.g., CEAC Dean can review CEAC faculty, but is blocked with 403 Forbidden when attempting to access CBA faculty evaluations).
- **HR Scope Enforcement**: HR evaluators can only access evaluation records assigned to HR reviewer routing (`HR_REVIEWER_ONLY`).
- **Department Secretary Exclusion**: Department Secretaries have read-only monitoring access in portfolio modules, but zero evaluator workspace access.
- **Anti-Self-Review Invariant**: Evaluated personnel attempting to load their own record with evaluator privileges are blocked immediately.
- **State Guard**: Direct URL navigation to draft or inactive evaluations is rejected.

---

### 2. Submitted Snapshot Integrity (Plan C Integration)

- **Immutability Guarantee**: The workspace reads strictly from the candidate's frozen submission snapshot (`submitted_snapshot`).
- **Live Portfolio Decoupling**: If candidate edits, adds, or modifies portfolio items post-submission, the evaluator workspace remains completely insulated and displays the historical submission snapshot.
- **Read-Only Master Data**: Candidate profile context (Rank, College, Department, Designation) is strictly read-only.

---

### 3. Scale-Specific Review Workspace Rendering (Plan F Integration)

#### Administrators Ranking Scale (`ADMINISTRATORS_RANKING_SCALE`)
- **Overall Max**: 160 points | **Passing Threshold**: 120 points
- **Area A (Max 70)**: Educational Qualification & Service Experience deterministic breakdown.
- **Area B (Max 50)**:
  - Deterministic: Seminars (B.1), Trainings (B.2), Awards (B.4), Memberships (B.5), Certifications (B.7).
  - Judgment-Required: Research (B.3, max 40.0) and Creative Work (B.6, max 20.0) render with `awaiting_evaluator` status, displaying max point allowances.
- **Area C (Max 40)**: Community Extension & Institutional Service.

#### Non-Teaching Personnel Ranking Scale (`NON_TEACHING_PERSONNEL_RANKING_SCALE`)
- **Overall Max**: 150 points | **Passing Threshold**: 75 points
- **Area A (Max 90)**: Rendered as an official evaluator-only structure (Job Performance 50 pts, Personal Attitudes 25 pts, Efficiency 15 pts) in read-only state. Accomplishment portfolio submissions are blocked from Area A.
- **Area B (Max 60)**: Service and Leadership submitted achievements with deterministic scoring metadata and Recognition Award (B.5, max 30.0) pending judgment status.

---

### 4. Evidence Review & Missing Evidence Degradation

- **Inspection**: Reviewers can inspect and preview candidate evidence references (PDF/images) linked to each submission item.
- **Protection**: Reviewers cannot access evidence files belonging to other colleges or unauthorized evaluation records.
- **Graceful Handling**: Missing or corrupt evidence produces a controlled `evidence_unavailable` warning banner without crashing the workspace or falsifying point values.

---

### 5. Verification & Test Results

- **Phase G2 Focused Suite**:
  - `src/controllers/__tests__/PersonnelEvaluatorWorkspaceG2.test.jsx`: **12/12 passed (100%)**
- **Full System Regression Suite**:
  - **132 test files passed (100%)**
  - **1036 total tests passed (0 failures)**

---

### Final Phase Status

**PHASE G2 COMPLETE — EVALUATOR WORKSPACE, SUBMITTED SNAPSHOT REVIEW & EVIDENCE INSPECTION VERIFIED**
