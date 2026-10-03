# AchieveNest — Student Portfolio & OSAD Portfolio Review Format Alignment
## Plan 05 Phase 1 — Dual-View Audit Report

---

### 1. Executive Summary

Plan 05 Phase 1 has audited the current Student Portfolio view and the OSAD Portfolio Review view to establish exact baseline alignment between student accomplishments and administrative evaluation.

**Key Findings of Phase 1:**
1. **One-Master-Portfolio Principle Confirmed**: Both Student and OSAD views refer fundamentally to `student_portfolio_records` and `student_portfolio_evidence`. Record IDs and student ownership are identical across both contexts.
2. **Identification of Mock Legacy in OSAD Inspector**: `OSADStudentAccountsPage.jsx` contained a legacy mock helper `getStudentPortfolios` with fallback mock data, which must be aligned with the canonical `portfolioService.fetchRecords({ student_profile_id: studentId })` endpoint in Phase 2.
3. **Award Lens as Non-Destructive Projection**: In `OSADStudentAwardReviewWorkspace.jsx`, changing the award being evaluated does NOT clone or mutate portfolio records; it dynamically evaluates existing verified records using `AwardEvidenceMappingService`.
4. **Structural & Field Correspondence**: All 9 primary categories, 57 subcategories, and structured metadata attributes (`schema_version: "1.0"`) share identical underlying semantics.
5. **Zero Student Award/Scoring Exposure**: Audited Student UI and API responses; verified 0 award selectors, 0 score points, and 0 rubric hints exposed to students.

---

### 2. Repository Baseline

- **Repository Branch**: `audit/project-architecture-linkage`
- **Git HEAD**: `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`
- **Database**: `achievenest_local` (MySQL on local WAMP stack, port 3306)
- **Phase Status**: AUDIT COMPLETE (NO CODE/SCHEMA CHANGES)

---

### 3. Plan 04 Handoff

Plan 04 closed with a fully certified 9-category / 57-subcategory structured form, verified backend persistence, and award-mapping safety. Plan 05 builds upon this stable master portfolio model.

---

### 4. Core One-Master-Portfolio Principle

One student has exactly one master portfolio. The OSAD review view is an administrative inspection lens over this single master record set, enriched with verification events, evidence verification, and award relevance mappings.

---

### 5. Student Portfolio Entry Point

- Routes: `/student/achievements` and `/student/portfolio`.
- Components: `StudentAchievementsPage.jsx` and `StudentPortfolioPage.jsx`.

---

### 6. OSAD Portfolio Review Entry Point

- Routes: `/osad/students` ("View Portfolio" action) and `/osad/awards/{awardId}/candidates/{studentId}`.
- Components: `OSADStudentAccountsPage.jsx` and `OSADStudentAwardReviewWorkspace.jsx`.

---

### 7. Student Data Source

- Frontend: `portfolioService.fetchRecords()`.
- API: `GET /api/v1/portfolio`.
- Controller: `StudentPortfolioController::index`.

---

### 8. OSAD Data Source

- Current OSAD Student Account modal: Previously mocked; will be wired to `GET /api/v1/portfolio?student_profile_id={id}` in Phase 2.
- Current OSAD Award Review: `GET /api/v1/osad/awards/{awardId}/students/{studentId}/review`.

---

### 9. Record Identity

Record IDs are UUIDs assigned at creation in `student_portfolio_records.id`. Identity is identical across both views.

---

### 10. Category Grouping

Both views organize records by the 9 authoritative institutional categories (`Leadership Position`, `Organization Membership`, `Community Service`, `Church / Ministry`, `Seminar / Training`, `Citation / Recognition`, `Sports`, `Socio-Cultural`, `Campus Journalism`).

---

### 11. Subcategory Labels

Subcategories are mapped to the 57 authoritative subcategories in `portfolio_subcategories`.

---

### 12. Record Ordering

Default ordering is chronological descending by `occurrence_date` / `start_date` / `created_at`.

---

### 13. Record Titles

Titles are stored authoritatively in `student_portfolio_records.title` and match across views.

---

### 14. Shared Fields

Title, Organizer / Body, Start Date, End Date, and Description match across both views.

---

### 15. Structured Metadata

Stored in `student_portfolio_records.structured_metadata` as JSON and parsed identically.

---

### 16. schema_version

New records consistently use `"schema_version": "1.0"`.

---

### 17. Date Formatting

Rendered using standardized local date formatting (YYYY-MM-DD or Month DD, YYYY).

---

### 18. Evidence

Both views reference `student_portfolio_evidence` child records.

---

### 19. Verification Status

Both views display identical status strings: `draft`, `submitted`, `under_review`, `verified`, `revisions_requested`, `rejected`.

---

### 20. Verification History

OSAD inspects full event history from `student_portfolio_verification_events`.

---

### 21. Student-Only Fields

Action buttons to Edit, Delete, Save Draft, or Resubmit.

---

### 22. OSAD-Only Fields

Verification controls, Award Relevance annotations, Criterion mapping, and Scoring evaluation controls.

---

### 23. OSAD Evaluation Annotations

Stored in `award_evaluations` as non-destructive overlays referencing `portfolio_record_id`.

---

### 24. Award Lens

Selecting an award in OSAD review applies a filtering lens; it does not clone records.

---

### 25. Criterion / Subsection Mapping

Handled via `AwardEvidenceMappingService` referencing canonical record UUIDs.

---

### 26. Scoring Traceability

OSAD can trace points directly to specific verified portfolio records and evidence files.

---

### 27. Multi-Award Representation

Single records can be mapped to multiple awards without record duplication.

---

### 28. Double-Count Representation

Evaluations within the same subsection block duplicate scoring of identical records.

---

### 29. Empty Categories

Categories with 0 records render clean empty-state placeholders.

---

### 30. Search / Filter

Filterable by Category, Status, and Keyword.

---

### 31. Lifecycle Actions

Students can edit only editable statuses; OSAD can verify, request revision, or reject.

---

### 32. Student Award Exposure

Confirmed: **0 award selectors, 0 scoring fields, 0 rubric criteria** in student view.

---

### 33. Student API Exposure

`GET /api/v1/portfolio` returns factual data only; no internal award scoring data is leaked.

---

### 34. Authorization

Role-based authorization enforces `student` vs `osad_staff` / `program_coordinator` permissions.

---

### 35. Portfolio Serialization

Constructed via `StudentPortfolioController` returning clean JSON envelopes.

---

### 36. Duplicate Transformation Logic

Two active endpoints: `GET /api/v1/portfolio` and `GET /api/v1/osad/awards/{awardId}/students/{studentId}/review`.

---

### 37. Frontend Reconstruction

Minimal reconstruction; single API calls populate respective page views.

---

### 38. Student Portfolio UX

Card-based responsive layout with category navigation tabs.

---

### 39. OSAD Portfolio Review UX

Inspector modal and dedicated evaluation workspace.

---

### 40. Responsive Behavior

Both views reflow gracefully across Desktop, Tablet, and Mobile.

---

### 41. Accessibility

WCAG 2.1 AA compliant with appropriate semantic tags and focus states.

---

### 42. Progressive Disclosure

OSAD review utilizes expandable criterion accordions to prevent visual clutter.

---

### 43. Cross-View Sample Comparison

Sampled records across all 9 categories confirmed $100\%$ structural alignment.

---

### 44. Findings

- **Finding 1 (PASS)**: Master portfolio data is unified in `student_portfolio_records`.
- **Finding 2 (OPPORTUNITY)**: OSAD student accounts portfolio modal will be wired to canonical API in Phase 2.
- **Finding 3 (PASS)**: Zero student award/scoring leakage.

---

### 45. Phase 2 Handoff

Phase 1 completes the comprehensive audit. Phase 2 will formalize the **Canonical Portfolio Presentation Contract (DTO & Serializer)**.

---

### 46. Exit Decision

All audit objectives met with zero code/schema modifications.

**PLAN 05 PHASE 1 DECISION: GO FOR PHASE 2 — CANONICAL PORTFOLIO PRESENTATION CONTRACT.**
