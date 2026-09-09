# AchieveNest — Student Portfolio & OSAD Portfolio Review Format Alignment
## Plan 05 — Final Workflow Specification

---

### 1. Student Achievement & Portfolio Workflow

```text
[1. Student Achievement Entry]
    • Category Selection (9 Categories)
    • Subcategory Selection (57 Subcategories)
    • Shared Core Fields (Title, Organizer, Dates, Description)
    • Dynamic Structured Details (Schema-validated)
    • Evidence File Upload (LocalEvidenceStorageService)
    • Action: Save as Draft or Submit
        │
        ▼
[2. Lifecycle Status Progression]
    • Draft: Editable, Deletable, Excluded from review queue
    • Submitted: Entered into coordinator review queue, Locked from student edits
    • Under Review: Coordinator actively evaluating authenticity
    • Revisions Requested: Returns to student with feedback; student edits & resubmits SAME record_id
    • Verified: Certified factual achievement; eligible for award mapping; permanently immutable
    • Rejected: Declined claim; permanently archived
```

---

### 2. OSAD Portfolio Review & Award Evaluation Workflow

```text
[1. Entry & Student Discovery]
    • OSAD opens Student Accounts management table
    • Action: "View Portfolio" opens OSADStudentAwardReviewWorkspace
        │
        ▼
[2. Canonical Portfolio Inspection]
    • Browse 9 primary categories (Rank 1 to 9)
    • Inspect canonical record cards (Title, Organizer, Dates, Status)
    • Open Record Detail (Overview, Structured Details, Evidence files, Verification history)
        │
        ▼
[3. Award Evaluation Lens Engagement]
    • Select institutional award from dropdown
    • View relevant vs excluded evidence annotations
    • Inspect criterion and subsection derivation breakdowns
    • Record evaluator deliberation notes and scoring determinations
```

---

### 3. Re-Verification Lifecycle Flow

When revisions are requested:
1. Verifier enters public remarks and marks status `revisions_requested`.
2. Student views feedback in `StudentPortfolioPage.jsx`.
3. Student edits fields, uploads new evidence if needed, and resubmits.
4. **Invariant**: The record retains the exact same `portfolio_record_id` (0 duplicate rows created).
5. Verifier approves -> status transitions to `verified` -> award mapping eligibility unlocks automatically.
