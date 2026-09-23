# AchieveNest — Student Achievement Entry & Dynamic Category-Based Structured Forms
## Plan 04 Phase 3 — Shared Core Fields Implementation Report

---

### 1. Executive Summary

Plan 04 Phase 3 has finalized and implemented the canonical **Shared Core Fields** layer for Student Achievement / Portfolio Record entry in AchieveNest.

**Key Outcomes of Phase 3:**
1. **Minimal & Standardized Shared Core**: Implemented `SharedAchievementFields.jsx` and `EvidenceUploadSection.jsx` covering the universal properties common across all 9 primary categories (`title`, `organizer_or_body`, `start_date`, `end_date`, `description`, `evidence`).
2. **Strict Boundary Separation**: Award-relevant facts (`placement`, `event_level`, `position_level`, `publication_status`, etc.) are strictly excluded from the shared layer and preserved for category-specific structured metadata in Phase 4.
3. **Contextual-Only Description**: Narrative description is explicitly designated as background context only with client help text preventing structured data dumping.
4. **State Preservation Invariant**: Shared field values and uploaded evidence attachments survive category and subcategory state transitions in parent form workflows.
5. **Test Certification**: All 5 Phase 3 tests passed; full test suite (49 test files, 283 / 283 tests) passed with zero regressions.

---

### 2. Repository Baseline

- **Repository Branch**: `audit/project-architecture-linkage`
- **Git HEAD**: `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`
- **Database**: `achievenest_local` (MySQL on local WAMP stack, port 3306)
- **Phase Status**: IMPLEMENTATION & VERIFICATION COMPLETE

---

### 3. Phase 2 Handoff

Phase 2 defined the 57-subcategory schema registry, metadata dictionaries, and controlled vocabularies. Phase 3 receives this contract and isolates the common top-level fields from category-specific JSON keys.

---

### 4. Shared Field Principles

1. **Semantic Invariance**: A field is shared if and only if it carries the exact same business meaning across all 9 categories.
2. **Minimalism**: Keep shared fields strictly to identity, organizer/venue, dates, narrative context, and document evidence.
3. **No Catch-All Overload**: No generic field (e.g. `rank_conferred`) may be used across diverse categories.

---

### 5. Final Shared Field Set

| Field Name | User-Facing Label | Input Type | Required on Submit? | Storage Column |
|---|---|---|---|---|
| `title` | Activity / Event Title | `text` | **YES** | `student_portfolio_records.title` |
| `organizer_or_body` | Organizer / Issuing Body | `text` | **YES** | `student_portfolio_records.organizer_or_body` |
| `start_date` | Activity Date / Start Date | `date` | **YES** | `student_portfolio_records.start_date` / `occurrence_date` |
| `end_date` | End Date | `date` | Optional (Single-day events) | `student_portfolio_records.end_date` |
| `description` | Narrative Description / Context | `textarea` | Optional | `student_portfolio_records.description` |
| `evidence` | Supporting Evidence Documents | File Upload (PDF/JPG/PNG) | **YES** (At least 1 file) | `student_portfolio_evidence` |

---

### 6. Title

- Dedicated column: `student_portfolio_records.title`.
- Trimmed text, required on submit, max length 255 characters.
- Must not encode placement, scores, or award targets.

---

### 7. Organizer / Body

- Dedicated column: `student_portfolio_records.organizer_or_body`.
- Captures who conducted the event or issued the citation.
- Kept distinct from internal organization membership entities (e.g. `organization_name` in Leadership metadata).

---

### 8. Dates

- `start_date`: Date event took place or began.
- `end_date`: Optional for single-day activities; validated to ensure `end_date >= start_date`.
- Single-day events map `start_date` to `occurrence_date` and leave `end_date` null.

---

### 9. Description

- Strictly designated as **Contextual Narrative Only**.
- User guidance explicitly states: *"Provide brief context about the activity. Do not use this field for placement, level, role, or other structured details requested in Category-Specific Fields."*

---

### 10. Evidence

- Reuses the canonical `LocalEvidenceStorageService` and `student_portfolio_evidence` table.
- Accepts PDF, JPG, PNG up to 10MB per file with file list preview and remove triggers.

---

### 11. Source-Type Decision

- **Decision**: **N/A / DEFER**.
- Source attribution is already captured by student identity authentication and `organizer_or_body` without introducing unapproved database columns.

---

### 12. Shared vs Structured Boundary

| Field | Shared Layer | Structured Metadata | Reason |
|---|---|---|---|
| Title / Event Name | YES | NO | Universal event title |
| Organizer / Body | YES | NO | Universal issuing entity |
| Dates | YES | NO | Universal time boundary |
| Description | YES | NO | Universal narrative context |
| Evidence Attachments | YES | NO | Universal document proof |
| Placement / Result | NO | YES | Meaningful only in competitive categories |
| Event Level / Scope | NO | YES | Evaluated specifically per award category |
| Position / Role | NO | YES | Specific to Leadership / Organization / Journalism |
| Publication Status | NO | YES | Exclusive to Campus Journalism |

---

### 13. Storage Mapping

- Shared fields map directly to root columns on `student_portfolio_records` and child table `student_portfolio_evidence`.
- Structured fields serialize into the `structured_metadata` JSON column.

---

### 14. Draft Validation

- In draft mode (`submit_now: false`), partial inputs are permitted without blocking errors.

---

### 15. Submit Validation

- In submit mode (`submit_now: true`), `title`, `organizer_or_body`, `start_date`, and at least one evidence attachment are strictly required.

---

### 16. State Ownership

- Parent achievement form state maintains structured separation:
  ```javascript
  {
    category_id: "...",
    subcategory_id: "...",
    shared: { title, organizer_or_body, start_date, end_date, description },
    structured_metadata: { ... },
    evidence: [ ... ]
  }
  ```

---

### 17. Category Change Preservation

- Switching the Primary Category clears `subcategory_id` and resets `structured_metadata`, while `shared` fields and `evidence` attachments remain completely preserved.

---

### 18. Evidence Preservation

- Uploaded files are preserved during category or subcategory changes unless explicitly removed by the user.

---

### 19. Accessibility

- Implemented standard HTML `<label>` associations, `aria-required="true"`, `aria-invalid`, `aria-describedby` error links, and keyboard navigation.

---

### 20. Responsive Behavior

- Grid layout collapses smoothly from 2 columns on desktop (`sm:grid-cols-2`) to a single column on mobile screens.

---

### 21. Tests

- Tested in `frontend/src/pages/student/__tests__/SharedAchievementFields.test.jsx`:
  - `instantiates SharedAchievementFields element with standard props`: PASS
  - `correctly passes field-level errors to SharedAchievementFields`: PASS
  - `instantiates EvidenceUploadSection element with sample attachments`: PASS
  - `validates date relationship helper logic`: PASS
  - `validates category preservation state boundary`: PASS

---

### 22. Regression

- Full frontend test suite: **49 test files passed, 283 / 283 tests passed**.
- 9 categories & 57 subcategories taxonomy: Unchanged & 100% intact.
- Student award selectors: **0**.
- Student scoring fields: **0**.

---

### 23. Phase 4 Handoff

Phase 3 delivers a robust, category-neutral shared field foundation (`SharedAchievementFields.jsx` and `EvidenceUploadSection.jsx`). Phase 4 can now focus exclusively on designing and implementing the **Category-Specific Structured Fields** across the 9 primary category families.

---

### 24. Exit Decision

All criteria have been met with zero defects and zero regressions.

**PLAN 04 PHASE 3 DECISION: GO FOR PHASE 4 — CATEGORY-SPECIFIC STRUCTURED FIELDS.**
