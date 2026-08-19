# Portfolio Evaluation Studio Refinement & Cognitive Load Reduction Plan

Comprehensive design document and implementation plan for the **HR Portfolio Evaluation Studio** (`src/pages/hr-admin/evaluation-submissions/evaluation/PortfolioEvaluationStudio.jsx`).

## 1. Objective

Refine the Portfolio Evaluation Studio into a professional, low-cognitive-load evaluation workspace for HR Staff by:
- organizing student evidence, criterion points, and score breakdowns into clear visual layers;
- providing three distinct workspace layout modes (`Split`, `Scoring`, `Preview`);
- establishing an authoritative evaluation decision bar with clear action hierarchy;
- preserving all underlying scoring calculations, rating engine rules, and evidence verification contracts.

## 2. Information Architecture & Modes

### 2.1 Workspace Layout Modes
1. **Split Mode (Default)**: Side-by-side evidence preview and scoring panel.
2. **Scoring Mode**: Expanded scoring panel for detailed criterion entry.
3. **Preview Mode**: Full-canvas evidence document viewer.

### 2.2 Header & Decision Bar Rules
- Restrained header height with submission identity, candidate status, and mode switcher.
- Sticky bottom decision bar with prominent `Finalize & Rank Submission` action, `Return for Revision` option, and score summary.
- No glassmorphic footer overlays; use solid contrast borders for high readability.

## 3. Implementation Phases

1. **Phase 1 — Mode Orchestration**: Stateful workspace mode switching (`Split`, `Scoring`, `Preview`).
2. **Phase 2 — Rating Engine Integration**: Real-time NDMU scoring calculations (Area A, Area B, Area C, tenure points, caps).
3. **Phase 3 — Evidence Document Viewer**: Supporting proof modal and document viewer with verified status tags.
4. **Phase 4 — Quality Gate & Tests**: Zero-error quality gate and Vitest rating engine assertions.

## 4. Verification & Acceptance Criteria
- All 3 layout modes function smoothly on desktop and tablet viewports.
- Score calculation caps (Area A: 70, Area B: 50, Area C: 40, Total: 160) are enforced.
- Lint, Vitest unit tests, and production build pass with 0 errors.
