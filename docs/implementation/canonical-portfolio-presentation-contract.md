# AchieveNest — Student Portfolio & OSAD Portfolio Review Format Alignment
## Plan 05 Phase 2 — Canonical Portfolio Presentation Contract

---

### 1. Executive Summary

Plan 05 Phase 2 defines the **Canonical Portfolio Presentation Contract (DTO & Serializer Architecture)**, establishing a unified presentation model that guarantees structural and semantic consistency across the Student Portfolio and OSAD Portfolio Review views.

**Core Contract Highlights:**
1. **Unified Base DTO (`CanonicalPortfolioRecord`)**: Both Student and OSAD views consume the exact same underlying record structure (`record_id`, `category`, `subcategory`, `title`, `dates`, `structured_details`, `evidence`, `verification`).
2. **Non-Destructive OSAD Evaluation Extension (`osad_evaluation`)**: Award criteria mappings, point assignments, deliberation notes, and verification timelines attach as an overlay extension for OSAD reviewers without mutating canonical record content.
3. **Decoupled Award Lenses**: Selecting different institutional awards dynamically updates the `osad_evaluation` projection without creating duplicate or separate portfolio datasets.
4. **Student Insulation**: Server-side serialization strictly strips `osad_evaluation`, rubric weights, and potential candidate rankings from all Student-facing payloads.

---

### 2. Phase 1 Baseline

Phase 1 verified that both views already trace back to `student_portfolio_records` and `student_portfolio_evidence`. Phase 2 formalizes the contract to eliminate serialization drift and mock discrepancies.

---

### 3. Design Goals

- Ensure identical record IDs, taxonomy labels, and structured details between Student and OSAD.
- Enable OSAD to evaluate records against award rubrics seamlessly.
- Preserve zero student award/scoring exposure.

---

### 4. Non-Goals

- Modifying underlying database schema or table structures.
- Altering Plan 04 taxonomy (9 categories, 57 subcategories) or controlled vocabularies.
- Modifying award rubrics or scoring calculation logic.

---

### 5. One-Master-Portfolio Principle

A student maintains exactly one master portfolio. Administrative reviews and award evaluations are specialized projection lenses over this single source of truth.

---

### 6. Canonical Record Identity

Every record is keyed by its primary key UUID (`student_portfolio_records.id`). Record identity remains immutable across all views and award lenses.

---

### 7. Student Identity Context

Student profile metadata (`student_profile_id`, `full_name`, `institutional_id`, `academic_program`, `year_level`) resides in the top-level response envelope rather than being duplicated in every record.

---

### 8. Category Contract

Exposes authoritative primary category information:
- `category.id`: UUID
- `category.code`: Stable uppercase machine string (e.g. `SPORTS`)
- `category.label`: 1 of 9 Authoritative Category Names
- `category.order`: Sequence 1 through 9

---

### 9. Subcategory Contract

Exposes authoritative subcategory information:
- `subcategory.id`: UUID
- `subcategory.code`: Stable uppercase machine string
- `subcategory.label`: 1 of 57 Authoritative Subcategory Names

---

### 10. Ordering Contract

- Primary: `category.order` ASC (1–9).
- Secondary: `occurrence_date` / `start_date` DESC.
- Tertiary: `created_at` DESC.

---

### 11. Shared Fields

Consistently exposes `title`, `organizer_or_body`, `start_date`, `end_date`, `occurrence_date`, and `description`.

---

### 12. Date Contract

Exposes raw ISO dates (`YYYY-MM-DD`) along with pre-formatted human-readable `display_range` strings (e.g. "Feb 14, 2026 – Feb 18, 2026").

---

### 13. Description Contract

`description` is strictly contextual narrative; never parsed for classification or award evaluation.

---

### 14. Structured Metadata

Retains raw sanitized JSON in `structured_metadata` with `"schema_version": "1.0"`.

---

### 15. Structured Details Presentation

Projected into an ordered array of `{ key, label, value, display_value }` matching the Plan 04 schema registry.

---

### 16. schema_version

New records consistently declare and validate `"schema_version": "1.0"`.

---

### 17. Legacy Compatibility

Legacy rows lacking `schema_version` are served via read-only fallback adapters without fabricating schema 1.0 metadata.

---

### 18. Evidence Contract

Exposes attached evidence objects referencing `student_portfolio_evidence.id`.

---

### 19. Evidence Authorization

File system storage paths are withheld; safe download/preview URLs are resolved based on actor role.

---

### 20. Verification Status

Exposes authoritative status string: `draft`, `submitted`, `under_review`, `revisions_requested`, `verified`, `rejected`.

---

### 21. Verification Summary

Includes `submitted_at`, `verified_at`, and summary remarks.

---

### 22. Verification History

Full timeline of `student_portfolio_verification_events` is attached to OSAD views and restricted from student views.

---

### 23. Viewer Context

Derived from authenticated server session (`student`, `osad_staff`, `program_coordinator`, `dean`).

---

### 24. Capabilities

Exposes boolean permissions: `can_edit`, `can_delete`, `can_resubmit`, `can_view_evidence`, `can_evaluate`.

---

### 25. Student-Safe Projection

Server serializer automatically omits `osad_evaluation`, internal notes, and award scoring data when `actor.role === 'student'`.

---

### 26. OSAD Extension

Appends `osad_evaluation` dictionary to the canonical record when requested by authorized staff.

---

### 27. Award Relevance

Identifies matched award ID, name, code, and qualification status.

---

### 28. Criterion / Subsection Mapping

Identifies matched criterion ID, subsection code, and calculated point credits.

---

### 29. Scoring Traceability

Traces point derivation to specific verified structured attributes (`placement`, `event_level`, `hours_rendered`).

---

### 30. Evaluator Notes

Enables OSAD committee members to record deliberation remarks.

---

### 31. Award Lens

Switching evaluated award in OSAD review recalculates `osad_evaluation` only; underlying portfolio record remains untouched.

---

### 32. Multi-Award Support

Single verified portfolio records can support multiple awards without database record duplication.

---

### 33. Double-Count Protection

Deduplication keys (`subsection_key:record_id`) prevent duplicate scoring within the same criteria subsection.

---

### 34. Empty Category Behavior

Categories with 0 records render clean empty-state placeholders in UI while preserving taxonomy navigation.

---

### 35. Portfolio Summary

Provides high-level counters (`total_records`, `verified_records`, `submitted_records`, `draft_records`).

---

### 36. Source / Origin Decision

Source type remains deferred / N/A as established in Plan 04 Phase 3.

---

### 37. Canonical DTO

Refer to [phase2-canonical-portfolio-dto.md](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/evidence/phase2-canonical-portfolio-dto.md).

---

### 38. OSAD Extended DTO

Refer to [phase2-osad-evaluation-extension-contract.md](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/evidence/phase2-osad-evaluation-extension-contract.md).

---

### 39. Serializer Ownership

Consolidated in `StudentPortfolioController` and `PortfolioPresentationService`.

---

### 40. Existing Serializer Comparison

Refer to [phase2-portfolio-serializer-comparison.md](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/evidence/phase2-portfolio-serializer-comparison.md).

---

### 41. Consolidation Design

Single base serializer with an optional award-evaluation decorator.

---

### 42. Frontend Reconstruction

Single API call (`GET /api/v1/portfolio`) populates the entire portfolio view.

---

### 43. API Compatibility

Maintains `GET /api/v1/portfolio` with query parameter scoping (`student_profile_id`, `award_id`).

---

### 44. Authorization-Sensitive Serialization

Server automatically filters output fields based on session role.

---

### 45. Null Handling

Empty metadata, null dates, or missing descriptions default to standard null/empty arrays rather than omitted keys.

---

### 46. Presentation Invariants

- Record ID: $100\%$ identical.
- Category & Subcategory: $100\%$ identical.
- Structured Details: $100\%$ identical.
- Evidence IDs: $100\%$ identical.

---

### 47. Allowed Differences

OSAD views include verification event history, award relevance, criteria mappings, and evaluator notes.

---

### 48. Forbidden Differences

OSAD cannot rename categories, change subcategory labels, replace titles with criterion names, or duplicate evidence.

---

### 49. Test Contract

Automated tests will assert identical field values across Student and OSAD serialization outputs.

---

### 50. Phase 3 Handoff

Phase 2 formalizes the presentation contract. Phase 3 will execute **Category Structure Alignment** across frontend views.

---

### 51. Exit Decision

Contract fully defined with zero code/schema modifications.

**PLAN 05 PHASE 2 DECISION: GO FOR PHASE 3 — CATEGORY STRUCTURE ALIGNMENT.**
