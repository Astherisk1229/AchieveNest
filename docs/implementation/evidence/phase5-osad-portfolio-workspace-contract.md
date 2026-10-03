# Plan 05 Phase 5 — OSAD Portfolio Review Workspace Contract
## Architecture and Component Layout of the Administrative Review Workspace

### 1. Workspace Structural Hierarchy

```text
[OSAD Student Portfolio Review Workspace]
    │
    ├── [1. Student Identity Header]
    │       ├── Full Name, ID Number, Academic Program, College, Year Level
    │       └── Enrollment / Academic Context
    │
    ├── [2. Canonical Portfolio Navigation]
    │       ├── 9 Authoritative Categories (Fixed Rank 1–9)
    │       └── Factual Record Counts & Verified Counts
    │
    ├── [3. Canonical Portfolio Content Pane]
    │       ├── Category Record Cards (Title, Subcategory, Date, Status, Structured Summary)
    │       └── Record Detail Drawer/Modal (Overview, Structured Details, Evidence, Verification)
    │
    └── [4. Administrative Evaluation Context Overlay]
            ├── Award Lens Selector (Dynamic Dropdown)
            ├── Mapped Award Relevance & Eligibility Badges
            ├── Criterion & Subsection Derivation Breakdown
            ├── Scoring Traceability Logs
            └── Evaluator Deliberation Remarks & Scoring Actions
```

### 2. Core Invariants
- **Single Source of Truth**: Evaluates the canonical master portfolio directly via `GET /api/v1/portfolio?student_profile_id={id}`.
- **Zero Record Mutation**: Selecting an award does not create cloned records, alter IDs, or change categories.
