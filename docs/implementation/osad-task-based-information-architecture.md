# AchieveNest — OSAD Navigation, Action Hierarchy & Layout UX Cleanup
## Plan 06 Phase 2 — Task-Based Information Architecture Specification

---

### 1. Executive Summary

Plan 06 Phase 2 establishes the authoritative **Task-Based Information Architecture (IA)** for the OSAD portal. By organizing navigation around user intent and administrative workflow dependencies, the platform transitions from an unsegmented 10-item list into five structured workflow clusters:

1. **Overview** (High-level system metrics and command dashboard)
2. **Student & Institutional Setup** (Academic programs, coordinator assignments, student roster, organizations, and credential resets)
3. **Portfolio & Evaluation** (Award criteria configuration, student portfolio evaluation, and candidate deliberations)
4. **Events & Certificates** (Institutional certificate template management)
5. **Governance & Reports** (Accreditation matrices and administrative audit trails)

---

### 2. Repository Baseline

- **Repository Branch**: `audit/project-architecture-linkage`
- **Git HEAD**: `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`
- **Database**: `achievenest_local` (MySQL on local WAMP stack, port 3306)

---

### 3. Phase 1 Handoff

Phase 1 verified 10 active OSAD navigation items declared in `navigationCatalog.js`, with 0 broken routes, 0 duplicate destinations, and 0 manual refresh defects.

---

### 4. IA Design Principles

- **Task-Oriented Grouping**: Groups reflect what the OSAD administrator intends to accomplish.
- **Strict Route Preservation**: All existing routes (`/osad/dashboard?tab=...`) remain 100% stable (0 URL breaks).
- **Single Source of Truth**: Group metadata is attached directly to the canonical catalog (`navigationCatalog.js`).
- **No Empty Groups**: Section headers render only when at least one child destination is authorized for the current user context.

---

### 5. Current Flat Navigation

Currently, all 10 items render in an unsegmented vertical stack under the generic label `NAVIGATION`.

---

### 6–11. Proposed Workflow Families

1. **Overview (`ADOPT`)**: Contains `OSAD Dashboard` (`/osad/dashboard`).
2. **Student & Institutional Setup (`ADOPT`)**: Contains `Academic Structure`, `Student Accounts`, `Student Organizations`, `Password Resets`.
3. **Portfolio & Evaluation (`ADOPT`)**: Contains `Awards & Scoring Criteria`, `Award Candidate Review`.
4. **Events & Certificates (`ADOPT WITH MODIFICATION`)**: Contains `Certificate Templates`.
5. **Governance & Reports (`ADOPT`)**: Contains `Accreditation Reports`, `OSAD Activity Log`.

---

### 12–18. Component Placements & Rationale

- **Student Accounts & Password Resets**: Positioned under Setup as foundational student identity management.
- **Academic Structure & Organizations**: Positioned under Setup as core institutional prerequisite master data.
- **Awards & Scoring Criteria**: Positioned under Portfolio & Evaluation as the upstream criteria engine for candidate reviews.
- **Award Candidate Review**: Positioned under Portfolio & Evaluation as the active deliberation and scoring workspace.
- **Certificate Templates**: Positioned under Events & Certificates for institutional credential layout management.
- **Accreditation Reports & Activity Log**: Positioned under Governance & Reports for compliance and audit oversight.

---

### 19. Workflow Overlap Resolution

- **Student Accounts vs Candidate Review**: Student Accounts manages identity and offers ad-hoc portfolio inspection; Candidate Review performs structured award evaluation and candidate ranking.
- **Student Accounts vs Password Resets**: Student Accounts provides inline profile resets; Password Resets provides a consolidated pending-request triage queue.

---

### 20. Route Alias Ownership

- `?tab=academic-structure` is owned by `Academic Structure` (`OSADAcademicProgramsPage.jsx`).
- `?tab=awardees` is normalized to `candidate-review` and owned by `Award Candidate Review` (`OSADAwardCandidateReviewPage.jsx`).

---

### 21–25. System Integrations & Non-Functional Requirements

- **Frequency & Dependency**: High-frequency operational pages remain at the top of their respective workflow families.
- **Permission-Aware Grouping**: Section headers render conditionally based on user role authorization.
- **Responsive Parity**: Grouped hierarchy translates cleanly across desktop, tablet, and mobile drawer views.
- **Accessibility**: Section headers will use semantic `<nav>` groupings with `aria-label` landmarks.

---

### 26. Canonical Catalog Target

Group metadata will be added directly into `frontend/src/config/navigationCatalog.js` without creating shadow configuration files.

---

### 27. Current-to-Proposed Structure Matrix

Detailed mapping provided in [phase2-osad-navigation-current-proposed-structure.md](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/evidence/phase2-osad-navigation-current-proposed-structure.md).

---

### 28. Parent Conceptual Group Validation

- **Overview**: `ADOPT`
- **Student & Institutional Setup**: `ADOPT`
- **Portfolio & Evaluation**: `ADOPT`
- **Events / Certificates**: `ADOPT WITH MODIFICATION`
- **Governance / Reports**: `ADOPT`

---

### 29. Phase 3 Handoff

Phase 2 design is complete and validated. Phase 3 will establish the authoritative **Sequence Rules & Execution**.

---

### 30. Exit Decision

**PLAN 06 PHASE 2 DECISION: GO FOR PHASE 3 — SEQUENCE RULES.**
