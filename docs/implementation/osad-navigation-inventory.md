# AchieveNest — OSAD Navigation, Action Hierarchy & Layout UX Cleanup
## Plan 06 Phase 1 — Full OSAD Navigation Inventory Report

---

### 1. Executive Summary

Plan 06 Phase 1 has completed the **Full OSAD Navigation Inventory**, capturing the current state of all sidebar navigation items, routing parameters, target components, primary user tasks, workflow dependencies, responsive behaviors, and potential workflow overlaps.

**Key Findings:**
1. **Single Authoritative Navigation Catalog**: OSAD navigation is declared centrally in `frontend/src/config/navigationCatalog.js` and rendered via `Sidebar.jsx` consuming `getAuthorizedNavigationForSession`.
2. **Current Item Set (10 Items)**: 10 items currently render in a flat sequence under a generic "NAVIGATION" header.
3. **Zero Manual-Refresh Defects**: SPA navigation across all query-param tabs updates instantly without browser reloads.
4. **Clean Profile Separation**: Account, Settings, and Notifications reside strictly in the topbar/profile dropdown (0 duplicate sidebar items).
5. **Clear Workflow Clustering Opportunities**: Identified natural groupings for *Overview*, *Institutional & Student Setup*, *Evaluation & Scoring*, and *Governance & Reports* to be structured in Phase 2.

---

### 2. Repository Baseline

- **Repository Branch**: `audit/project-architecture-linkage`
- **Git HEAD**: `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`
- **Database**: `achievenest_local` (MySQL on local WAMP stack, port 3306)

---

### 3. Audit Scope

Comprehensive inventory of OSAD administrative navigation, routing, layout shell components, and responsive viewport adapters.

---

### 4. OSAD Navigation Source

- **Catalog Declaration**: `frontend/src/config/navigationCatalog.js` (Items under section `7. OSAD STAFF NAVIGATION`).
- **Rendering Component**: `frontend/src/components/layout/Sidebar.jsx`.

---

### 5. Navigation Definition Count

- **Independent Navigation Definitions**: **1 (Canonical)**.
- **Conflicting Active Definitions**: **0**.

---

### 6. Current Sidebar Order

1. `OSAD Dashboard` (`/osad/dashboard`)
2. `Academic Structure` (`/osad/dashboard?tab=academic-structure`)
3. `Student Accounts` (`/osad/dashboard?tab=accounts`)
4. `Student Organizations` (`/osad/dashboard?tab=organizations`)
5. `Awards & Scoring Criteria` (`/osad/dashboard?tab=awards`)
6. `Certificate Templates` (`/osad/dashboard?tab=certificate-templates`)
7. `Award Candidate Review` (`/osad/dashboard?tab=candidate-review`)
8. `Accreditation Reports` (`/osad/dashboard?tab=reports`)
9. `OSAD Activity Log` (`/osad/dashboard?tab=audit`)
10. `Password Resets` (`/osad/dashboard?tab=password-resets`)

---

### 7. Current Section Headings

Current sidebar uses a single flat section header: **`NAVIGATION`**. (Workflow-oriented grouping to be established in Phase 2).

---

### 8. Route Inventory

All 10 items route to `/osad/dashboard` with distinctive `?tab=` query parameters.

---

### 9. Destination Page Inventory

Mapped to modular components within `frontend/src/pages/osad-admin/`:
- `OSADCommandCenterPage.jsx`
- `OSADAcademicProgramsPage.jsx`
- `OSADStudentAccountsPage.jsx`
- `OSADStudentOrganizationsPage.jsx`
- `OSADAwardsAndCriteriaPage.jsx`
- `OSADCertificateTemplatesPage.jsx`
- `OSADAwardCandidateReviewPage.jsx`
- `OSADAccreditationReportsPage.jsx`
- `OSADSystemAuditLogsPage.jsx`
- `OSADPasswordResetRequestsPage.jsx`

---

### 10. Primary Task Inventory

Documented in [phase1-osad-navigation-workflow-family-matrix.md](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/evidence/phase1-osad-navigation-workflow-family-matrix.md).

---

### 11. Frequency Classification

- **High**: Dashboard, Student Accounts, Award Candidate Review.
- **Medium**: Academic Structure, Student Organizations, Awards & Scoring Criteria, Password Resets.
- **Occasional / Low**: Certificate Templates, Accreditation Reports, OSAD Activity Log.

---

### 12. Access / Permission Conditions

Guarded by `allowedAccountTypes: ['osad_admin']`, `requiredActiveContexts: ['osad_staff']`, and role-based permissions (`osad.academic_structure.manage`, `osad.award_candidate.review`, etc.).

---

### 13. Duplicate Destinations

Exact duplicate destinations: **0 (Zero)**.

---

### 14. Overlapping Workflows

Identified overlap between `Student Accounts` (portfolio inspection) and `Award Candidate Review` (award-lens scoring).

---

### 15. Route Aliases

`?tab=academic-structure` aliases to `academic-programs`; `?tab=awardees` aliases to `candidate-review`.

---

### 16. Workflow Families

Provisional clusters: (1) Overview, (2) Setup & Records, (3) Evaluation & Scoring, (4) Governance & Reports.

---

### 17. Dependency Mapping

Documented upstream/downstream relationships across academic structure, student records, and awards.

---

### 18. Dashboard / Home

`OSADCommandCenterPage.jsx` serves as the central high-level administrative overview.

---

### 19. Student Accounts

Provides student discovery and entry point to canonical portfolio inspection.

---

### 20. Academic Programs / Coordinator Coverage

Consolidated under `Academic Structure` (`OSADAcademicProgramsPage.jsx`).

---

### 21. Organizations

Managed via `OSADStudentOrganizationsPage.jsx` (Clubs & Organizations).

---

### 22. Portfolio Review

Embedded inside `OSADStudentAwardReviewWorkspace.jsx` and accessed via Student Accounts.

---

### 23. Awards / Criteria

Managed via `OSADAwardsAndCriteriaPage.jsx`.

---

### 24. Potential Candidates

Integrated within `OSADAwardCandidateReviewPage.jsx`.

---

### 25. Events / Attendance

N/A for core OSAD (Owned by Organization Moderators).

---

### 26. Certificates

Template management owned via `OSADCertificateTemplatesPage.jsx`.

---

### 27. Reports

Accreditation export matrices housed in `OSADAccreditationReportsPage.jsx`.

---

### 28. Audit Trail

Housed in `OSADSystemAuditLogsPage.jsx`.

---

### 29. Other Governance Pages

Password resets managed via `OSADPasswordResetRequestsPage.jsx`.

---

### 30. Header / Profile Navigation

Account (`/osad/account`), Settings (`/osad/settings`), Notifications (`/osad/notifications`) reside in top header.

---

### 31. Sidebar / Header Duplicates

Sidebar/header duplicate destinations: **0 (Zero)**.

---

### 32. Desktop Sidebar

Persistent `w-64` left navigation bar with search input and role badge.

---

### 33. Collapsed Sidebar

Accessible via responsive collapse states.

---

### 34. Tablet Navigation

Collapsible overlay drawer with backdrop.

---

### 35. Mobile Navigation

Slide-over mobile drawer with automatic close-on-navigate.

---

### 36. Active Route Behavior

Consistently highlights active item based on `location.pathname` and `?tab=` query parameter.

---

### 37. Manual Refresh Behavior

0 manual refresh required for SPA navigation across all tabs.

---

### 38. Role Change Behavior

Role context switches dynamically refresh navigation items via `normalizeRoleContext`.

---

### 39. Keyboard / Screen Reader Audit

Full keyboard accessibility (`Tab`, `Enter`, `Space`) with `aria-label` and `aria-selected` attributes.

---

### 40. Unlinked Routes

Unlinked OSAD routes: **0 (Zero)**.

---

### 41. Dead / Legacy Routes

Dead / broken routes: **0 (Zero)**.

---

### 42. Conceptual Grouping Validation

Parent conceptual groups are **SUPPORTED** by current workflow architecture.

---

### 43. Phase 2 Handoff

Phase 1 completes the full navigation inventory. Phase 2 will execute **Task-Based Information Architecture & Grouping**.

---

### 44. Exit Decision

All criteria fulfilled with zero defects.

**PLAN 06 PHASE 1 DECISION: GO FOR PHASE 2 — TASK-BASED INFORMATION ARCHITECTURE.**
