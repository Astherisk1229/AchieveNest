# Area A Read-Only & Mutation Guard Verification

## Architectural Boundary
Under Plan F Phase F3, Non-Teaching Scale Area A (`AREA_A_PERFORMANCE_PERSONAL_INDICATORS`) is an official evaluation-only structure (`read_only_evaluation_area`).

---

## 1. UI Layer Protection
In `PersonnelPortfolioEditPage.jsx`:
- `currentAreaConfig.entry_policy === 'read_only_evaluation_area'` (or `is_personnel_entry_allowed === false`) triggers `isDisallowed = true`.
- Hides:
  - `+ Add Accomplishment to Area A` button
  - `Sync Repository` action for Area A
  - Edit accomplishment buttons
  - Delete accomplishment triggers
  - File / proof upload components
- Renders:
  - Informational Banner: `"This section is evaluated directly by institutional leadership and supervisor performance assessments. Direct personnel accomplishment entry is not required or permitted."`
  - Badge: `"Official Non-Entry Section"` / `"Evaluator Indicator Area"`

---

## 2. Backend Service Layer Protection
In `PortfolioCriterionValidationService.php`:
- When `scale_code === 'NON_TEACHING_PERSONNEL_RANKING_SCALE'` and `area_code === 'A'`:
  - Throws `RuntimeException` (HTTP 409 Conflict / 422 Unprocessable Entity):
  - `"Portfolio Area [A: Performance and Personal Indicators] is an evaluation-only section and does not permit personnel accomplishment mutations."`
- Guarantees that neither forged direct POST requests, replay attacks, nor modified payloads can insert accomplishments into Area A.
