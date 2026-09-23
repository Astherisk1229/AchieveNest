# Plan 05 Phase 1 — Award Evaluation Data Map
## Separation Between Master Portfolio Facts and OSAD Award Lenses

### 1. Master Portfolio Authority
- Master portfolio records reside permanently in `student_portfolio_records`.
- Category classifications, subcategories, titles, dates, descriptions, and structured metadata remain invariant regardless of what institutional award is selected for evaluation.

### 2. Award Evaluation Lenses (Dynamic Projection)
- Changing the selected award in OSAD review evaluates the student's existing verified records against that specific award's rubrics via `AwardEvidenceMappingService.php`.
- **Zero Cloning**: The portfolio records are never cloned, copied, or mutated into a separate table.
- **Evaluation Annotations**: Criteria mappings, points, and deliberation notes attach non-destructively as projection overlays.
