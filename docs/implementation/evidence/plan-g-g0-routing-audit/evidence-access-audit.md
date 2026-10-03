# Personnel Evaluation Track — Plan G — Phase G0: Evidence Access Audit

## Evaluator Evidence Inspection Architecture

Evaluators must be able to inspect submitted evidence documents in full context during portfolio review.

### 1. Evidence Access Flow
1. Evaluator opens `PortfolioEvaluationStudio`.
2. For each submitted accomplishment item, the evaluator selects the item in `PortfolioNavigator`.
3. The studio loads the attached evidence document via the local storage/evidence preview endpoint (`/evidence/preview/(:segment)` / `LocalEvidenceStorageService.php`).
4. Evaluator inspects the document in the split-view document previewer alongside the criterion scoring fields.

### 2. Immutability & Access Isolation
- Evaluator has read-only access to the candidate's uploaded evidence file.
- Evaluator cannot delete, replace, or overwrite candidate evidence files.
- Unauthorized users (e.g. cross-college deans, other candidates) cannot access evidence preview URLs.
