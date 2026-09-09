# AchieveNest — OSAD Navigation, Action Hierarchy & Layout UX Cleanup
## Plan 06 Phase 6 — Clickable Entity Card Pattern Specification

---

### 1. Executive Summary

Plan 06 Phase 6 establishes the authoritative **Clickable Entity Card Pattern** for the OSAD portal. Navigable entity cards—such as Recognized Student Organizations and Award Candidate Standing cards—now feature whole-card navigation affordance, enabling users to click or keyboard-activate the card body to transition to canonical detail views, while rigorously isolating nested actions (such as Moderator assignment) to prevent unintended parent navigation.

---

### 2. Repository Baseline

- **Repository Branch**: `audit/project-architecture-linkage`
- **Git HEAD**: `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`
- **Database**: `achievenest_local` (MySQL on local WAMP stack, port 3306)

---

### 3. Phase 5 Handoff

Phase 5 confirmed that all page content grids, headers, and card layouts follow purpose-based placement rules, providing a stable foundation for interaction enhancements.

---

### 4–7. Eligibility Rules & Semantic Architecture

- **Eligible Cards**: Cards that represent a discrete database entity with an established canonical detail route/modal.
- **Non-Eligible Cards**: Informational metrics tiles, form containers, or multi-action workflow cards.
- **Semantic Structure**: Uses accessible `role="button" tabIndex={0}` or semantic links with `Enter` and `Space` keyboard activation.
- **Nested Control Isolation**: Nested interactive elements (e.g. `Assign Moderator`) use `e.stopPropagation()` to completely prevent parent navigation.

---

### 8–13. Accessibility, Styling & Responsive Patterns

- **Hover & Focus Affordance**: Enhanced subtle emerald border emphasis (`hover:border-emerald-300 dark:hover:border-emerald-700/60`) and distinct focus rings (`focus:ring-2 focus:ring-[#16834a]`).
- **Screen Reader Context**: Descriptive names include entity identifiers and acronyms.
- **Responsive Layout**: Multi-column grids (3 cols desktop -> 2 cols tablet -> 1 col mobile) maintain touch target safety (>= 44px) without overlay collisions.

---

### 14–20. Inventory & Card Classification

- **Organization Cards (`WHOLE-CARD NAVIGABLE`)**: Card body opens `OSADOrganizationDetailsView`. Moderator assignment isolated.
- **Candidate Cards (`WHOLE-CARD NAVIGABLE`)**: Card body opens `AwardEvaluationSummaryModal`. Batch checkboxes isolated.
- **Certificate Templates (`WHOLE-CARD NAVIGABLE`)**: Card body opens template preview.
- **Program & Award Cards (`NESTED-ACTION ONLY`)**: Actions contained within dedicated buttons.
- **Metric Tiles (`NON-NAVIGABLE`)**: Informational data displays.

---

### 21–24. Decisions & Deferred Items

- **Existing View Details Cues**: Retained as visual discovery cues alongside whole-card clickability.
- **Deferred Items**:
  - Page-header shared component -> Deferred to **Phase 7 (Page Header Standardization)**.
  - Loading/empty states -> Deferred to **Phase 8 (Loading, Empty & Error States)**.
  - Global CSS tokens & polish -> Deferred to **Phase 10 (Visual Consistency)**.

---

### 25–26. Automated Testing & Regressions

- Created `frontend/src/pages/osad-admin/__tests__/OSADClickableEntityCards.test.jsx` (**2 / 2 PASS**).
- Full Vitest suite: **60 test files passed (60), 330 tests passed (330)**.
- Placement regression: `OSADPlacementAlignment.test.jsx` (**3 / 3 PASS**).
- Action hierarchy regression: `OSADRedundantButtonAudit.test.jsx` (**3 / 3 PASS**).
- Sequence regression: `OSADNavigationSequence.test.js` (**6 / 6 PASS**).

---

### 27. Phase 7 Handoff

Entity card patterns are standardized and verified. Ready for **Phase 7 — Page Header Standardization**.

---

### 28. Exit Decision

**PLAN 06 PHASE 6 DECISION: GO FOR PHASE 7 — PAGE HEADER STANDARDIZATION.**
