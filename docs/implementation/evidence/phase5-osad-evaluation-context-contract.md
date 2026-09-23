# Plan 05 Phase 5 — OSAD Evaluation Context Contract
## Administrative Award Evaluation Specification

### 1. Separation of Concerns
1. **Verification Phase**: Verifies factual truth of student claims and authenticity of evidence files (`status = 'verified'`). Handled by Program Coordinators and OSAD.
2. **Award Evaluation Phase**: Analyzes verified records against institutional award rubrics using `AwardEvidenceMappingService`.

### 2. Multi-Award Support & Deduplication
- **Multi-Award**: One verified accomplishment (e.g. Regional Basketball Championship) can qualify for both *Athlete of the Year* and *Special Citation for Sports* simultaneously without duplicating the underlying record.
- **Subsection Deduplication**: When multiple scoring rules within the same criteria subsection match a single record/result, the system applies points exactly once, blocking double-counting.
