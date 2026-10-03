# Plan 05 Phase 1 — Dual-View Field Matrix
## Structural and Semantic Comparison Between Student View and OSAD View

| Concept | Student View | OSAD View | Same Source? | Difference Type | Status |
|---|---|---|---|---|---|
| Record ID | `spr.id` (UUID) | `spr.id` (UUID) | YES (`student_portfolio_records.id`) | None | **PASS** |
| Student ID | `spr.student_profile_id` | `spr.student_profile_id` | YES (`profiles.id`) | None | **PASS** |
| Category | 9 Authoritative Categories | 9 Authoritative Categories | YES (`portfolio_categories`) | None | **PASS** |
| Subcategory | 57 Authoritative Subcategories | 57 Authoritative Subcategories | YES (`portfolio_subcategories`) | None | **PASS** |
| Title / Activity | `spr.title` | `spr.title` | YES (`student_portfolio_records.title`) | None | **PASS** |
| Organizer / Body | `spr.organizer_or_body` | `spr.organizer_or_body` | YES (`student_portfolio_records.organizer_or_body`) | None | **PASS** |
| Dates | `start_date`, `end_date`, `occurrence_date` | `start_date`, `end_date`, `occurrence_date` | YES (`student_portfolio_records`) | None | **PASS** |
| Structured Metadata | `structured_metadata` (schema 1.0) | `structured_metadata` (schema 1.0) | YES (`student_portfolio_records.structured_metadata`) | None | **PASS** |
| Evidence | `student_portfolio_evidence` | `student_portfolio_evidence` | YES (`student_portfolio_evidence`) | None | **PASS** |
| Verification Status | `spr.status` (`draft`, `submitted`, `verified`, etc.) | `spr.status` (`draft`, `submitted`, `verified`, etc.) | YES (`student_portfolio_records.status`) | None | **PASS** |
| Verification Events | N/A (Summary feedback only) | Full timeline (`student_portfolio_verification_events`) | YES | OSAD Extension | **PASS** |
| Award Relevance | N/A (Zero student exposure) | Mapped award criteria & rubrics | YES (`AwardEvidenceMappingService`) | OSAD Extension | **PASS** |
| Criterion Relevance | N/A (Zero student exposure) | Scored subsection / criterion | YES (`AwardEvidenceMappingService`) | OSAD Extension | **PASS** |
| Evaluation Controls | N/A | Manual score & deliberation notes | YES (`award_evaluations`) | OSAD Extension | **PASS** |
