# Plan 05 Phase 2 — Serializer Comparison & Consolidation Design
## Field-by-Field Analysis of Existing Serialization Paths

### 1. Comparison Matrix

| Field / Feature | `StudentPortfolioController::index` (Canonical Base) | `AwardEvaluationController::getStudentAwardReview` (Award Lens) | Target Consolidated Architecture |
|---|---|---|---|
| Record ID | `spr.id` (UUID) | `spr.id` (UUID) | Shared Canonical Base DTO |
| Category & Subcategory | Joins `portfolio_categories`, `portfolio_subcategories` | Evaluates via `AwardEvidenceMappingService` | Canonical Taxonomy Resolver |
| Title, Organizer, Dates | Direct root columns from `student_portfolio_records` | Reads root columns from `student_portfolio_records` | Shared Base Normalizer |
| Description | Root `spr.description` | Reads `spr.description` | Shared (Contextual Only) |
| Structured Metadata | Native JSON decode of `spr.structured_metadata` | Evaluated directly by award mapping engines | Shared Parser |
| Evidence | Joins `student_portfolio_evidence` child records | Evaluated via `evidence_id` FK references | Canonical Evidence Resolver |
| Verification Status | `spr.status` (`draft`, `submitted`, `verified`) | Filters by `status = 'verified'` | Shared Status Gate |
| OSAD Evaluation Data | Omitted (Student-safe) | Appends `award`, `criteria`, `manual_panel_criteria` | Optional `osad_evaluation` Decorator |

### 2. Target Consolidation Pattern
- **Base Serializer**: `PortfolioPresentationService` outputs `CanonicalPortfolioRecord`.
- **Extension Decorator**: Appends `osad_evaluation` extension ONLY when request actor holds `osad_staff` / evaluator role and award context is present.
