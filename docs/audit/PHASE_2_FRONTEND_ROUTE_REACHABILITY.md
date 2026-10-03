# AchieveNest — Phase 2: Frontend Route & Reachability Audit Report

- **Audit Date:** August 29, 2026
- **Branch:** `audit/project-architecture-linkage`
- **Preceding Baseline Tag:** `prefinal-defense-local-v1` (commit `22b9718967ff54a03eeda753d7de975737edff14`)
- **Phase 0 Baseline:** `PASSED / COMPLETED` (`docs/audit/PHASE_0_FREEZE_AND_SAFETY_BASELINE.md`)
- **Phase 1 Inventory:** `PASSED / COMPLETED` (`docs/audit/PHASE_1_REPOSITORY_INVENTORY.csv`, `docs/audit/PHASE_1_REPOSITORY_INVENTORY.md`)
- **Deliverables Generated:**
  - `docs/audit/PHASE_2_FRONTEND_ROUTE_MAP.csv` (Machine-readable 23-column route register)
  - `docs/audit/PHASE_2_FRONTEND_ROUTE_REACHABILITY.md` (This comprehensive narrative report)

---

## 1. Executive Summary & Routing Architecture Overview

AchieveNest frontend routing is built on **React 19 + React Router v7 (`react-router-dom`)** bundled with **Vite 8**. The application utilizes a layered routing model combining:

1. **Top-Level Entry Point:** `frontend/src/main.jsx` mounts `<BrowserRouter>` wrapping the root `<App />` component.
2. **Global Providers & Shells:** `App.jsx` wraps the route hierarchy in `<AuthProvider>`, `<ThemeProvider>`, `<ErrorBoundary>`, and `<SessionTimeoutModal>`.
3. **Role-Based Layout Shells:** Protected sections are isolated inside `<LayoutShell>` components configured with `allowedAccountTypes` and `requiredRoles`.
4. **Active Context Guards:** Fine-grained role switching for personnel (Faculty, Program Coordinator, Organization Moderator, Dean) is protected by `<ActiveRoleGuard>`.
5. **Query/Tab-Based Dynamic Routing:** Single-page dashboard hubs (such as `OSADDashboardPage.jsx`, `CoordinatorDashboardPage.jsx`, and `OrganizationModeratorDashboardPage.jsx`) use URL search parameters (`?tab=...`) with seamless fallback defaults and backwards-compatible aliases.
6. **Alias & Backward Compatibility Layer:** Legacy route redirects ensure existing bookmarks and links from prior naming conventions (`/depsec`, `/hr/personnel-governance`, etc.) gracefully resolve to canonical targets.

---

## 2. Quantitative Route Statistics Summary

| Route Category | Count | Primary Gateway Component | Key Characteristics |
| :--- | :---: | :--- | :--- |
| **Public & Common Routes** | 7 | `LoginPage.jsx`, `PublicCertificateVerificationPage.jsx`, `OfficerScannerPage.jsx` | Public access, error pages, cryptographic cert verification, event attendance scanner |
| **Student Portal Routes** | 6 | `StudentDashboardPage.jsx`, `StudentAchievementsPage.jsx`, `StudentPortfolioPage.jsx` | Account type `student`, role `student` |
| **Personnel Portal Routes** | 7 | `PersonnelDashboardPage.jsx`, `PersonnelPortfolioEditPage.jsx`, `PersonnelPortfolioPage.jsx` | Multi-role context hub for Faculty, Coordinators, Moderators, and Deans |
| **HR Admin Portal Routes** | 9 | `HRDashboardPage.jsx`, `HRPersonnelDirectoryPage.jsx`, `HREvaluationSubmissionsPage.jsx` | Account type `hr_admin`, role `hr_staff` |
| **OSAD Admin Portal Routes** | 4 | `OSADDashboardPage.jsx`, `AccountPage.jsx`, `SettingsPage.jsx`, `NotificationsPage.jsx` | Account type `osad_admin`, role `osad_staff` |
| **OSAD Query / Tab Routes** | 10 | `OSADDashboardPage.jsx` via `?tab=` | 10 sub-views: command center, academic hierarchy, accounts, orgs, awards, cert templates, candidate review, reports, audit, password resets |
| **Program Coordinator Tab Routes** | 3 | `CoordinatorDashboardPage.jsx` via `?tab=` | 3 sub-views: overview, verification workspace, student roster dossiers |
| **Organization Moderator Tab Routes** | 5 | `OrganizationModeratorDashboardPage.jsx` via `?tab=` | 5 sub-views: dashboard, events, attendance, digital certificates workspace, profile |
| **Dean Tab Routes** | 3 | `PersonnelDashboardPage.jsx` / `navigationCatalog.js` | 3 sub-views: overview, ranking review workspace, faculty roster |
| **Legacy & Shortcut Redirects** | 12 | `App.jsx` `<Navigate replace />` | Aliases for `/depsec`, `/coordinator`, `/org-moderator`, HR legacy tabs, generic routes |
| **Wildcard Fallback Route** | 1 | `App.jsx` (`path="*"`) | Redirects all unmapped URL paths to `/` |
| **TOTAL CATALOGUED ROUTES** | **67** | — | **100% Accounted in Route Register** |

---

## 3. Complete Portal-by-Portal Route Mapping

### 3.1 Public & Authentication Layer
- `/` — Canonical landing page mounting `LoginPage.jsx`
- `/login` — Direct login route mounting `LoginPage.jsx`
- `/reset-password` — Self-service password recovery initiating `ResetPasswordPage.jsx`
- `/change-password` — Mandatory password rotation intercept for initial logins via `ChangePasswordPage.jsx`
- `/403` — Access forbidden terminal via `ForbiddenPage.jsx`
- `/verify/certificate/:publicId` — Public verification terminal for issued cryptographic certificate QR codes
- `/scanner/:eventId` — Standalone mobile/desktop barcode and QR event scanner for authorized officers

### 3.2 Student Portal (`allowedAccountTypes=['student']`, `requiredRoles=['student']`)
- `/student/dashboard` — Student metrics, leaderboard preview, recent activity feed
- `/student/achievements` — Achievement submission creation, category filtering, evidence attachment
- `/student/portfolio` — Official verified student accomplishments showcase and booklet export
- `/student/account` — Profile details, student ID, enrolled academic program
- `/student/settings` — Application theme and notification configuration
- `/student/notifications` — System alerts, verification status notifications

### 3.3 Personnel Portal (`allowedAccountTypes=['personnel']`, `requiredRoles=['personnel']`)
- `/personnel/dashboard` — Multi-context dashboard gateway:
  - When `active_role_context === 'personnel'`: Renders faculty portfolio summary and accomplishments list.
  - When `active_role_context === 'program_coordinator'`: Dispatches to `CoordinatorDashboardPage.jsx`.
  - When `active_role_context === 'organization_moderator'`: Dispatches to `OrganizationModeratorDashboardPage.jsx`.
  - When `active_role_context === 'dean'`: Renders college oversight summary.
- `/personnel/portfolio/edit` — Accomplishment CRUD, criterion matrix classification, PDF proof attachment
- `/personnel/portfolio` — Published faculty portfolio booklet showcase
- `/personnel/achievements` — Personnel individual accomplishment catalog
- `/personnel/account` — Academic placement, department assignment, role context switcher
- `/personnel/settings` — Personnel settings
- `/personnel/notifications` — Evaluation updates, verification receipts

### 3.4 HR Admin Portal (`allowedAccountTypes=['hr_admin']`, `requiredRoles=['hr_staff']`)
- `/hr/dashboard` — Institutional HR analytics, faculty metrics, review queues
- `/hr/personnel-directory` — Personnel master roster, faculty onboarding, Dean assignment modal
- `/hr/evaluation-submissions` — Multi-factor evaluation studio with 6-criteria rating engine
- `/hr/faculty-evaluation-and-ranking` — Institutional faculty ranking and points summary
- `/hr/audit-trail` — Immutable governance audit trail
- `/hr/rank-assignment-logs` — Historical faculty rank assignment records
- `/hr/password-resets` — Personnel password reset requests queue
- `/hr/account` & `/hr/settings` — HR administrator account and preferences

### 3.5 OSAD Admin Portal (`allowedAccountTypes=['osad_admin']`, `requiredRoles=['osad_staff']`)
- `/osad/dashboard` — Central hub supporting 10 query tabs:
  1. `?tab=overview` — Executive KPI command center
  2. `?tab=academic-programs` (alias `?tab=academic-structure`) — Colleges & degree programs hierarchy
  3. `?tab=accounts` — Student accounts directory and dossier viewer
  4. `?tab=organizations` — Student organizations and club governance
  5. `?tab=awards` — Award category definitions and point criteria
  6. `?tab=certificate-templates` — Certificate template designer and placeholder registry
  7. `?tab=candidate-review` (alias `?tab=awardees`) — Automated 80% evaluation candidates & Dean nomination reviewer
  8. `?tab=reports` — Accreditation export matrices (CHED/PAASCU)
  9. `?tab=audit` — OSAD activity log
  10. `?tab=password-resets` — Student password reset requests queue

---

## 4. Frontend Pages Reachability Audit

Every file located in `frontend/src/pages/` (119 total files) was audited for direct route reachability, internal component composition, and test coverage:

- **Direct Route Pages (Top-Level / Layout Shell):** 28 files — `PROVEN ROUTE-REACHABLE`
- **Query Tab Pages & Views:** 18 files — `PROVEN ROUTE-REACHABLE`
- **Modals, Drawers & In-Page Subcomponents:** 52 files — `PROVEN INTERNAL-REACHABLE`
- **Active Unit & E2E Test Suites:** 4 files — `PROVEN TEST-COVERAGE`
- **Superceded / Unreferenced Candidates Flagged for Phase 3 Review:** 17 files — `REVIEW REQUIRED`
  - Examples include superseded sub-components replaced during the Evaluation Studio upgrade (e.g. `FacultyPortfolioPane.jsx`, `NDMURatingPane.jsx`, `PersonnelPortfolioForm.jsx`, `ProgramCoordinatorDashboard.jsx`).
  - **Phase 2 Non-Destructive Protection:** Per execution rules, all 17 files remain completely untouched and preserved in place.

---

## 5. Security & RBAC Enforcement Matrix

| Account Type (`account_type`) | Authorized Active Roles (`active_role_context`) | Permitted URL Prefix | Route Access Guard | Fallback on Unauthorized Access |
| :--- | :--- | :--- | :--- | :--- |
| **student** | `student` | `/student/*` | `LayoutShell allowedAccountTypes=['student']` | Redirects to `/student/dashboard` or `/login` |
| **personnel** | `personnel`, `dean`, `program_coordinator`, `organization_moderator` | `/personnel/*` | `LayoutShell allowedAccountTypes=['personnel']` | Redirects to `/personnel/dashboard` or `/login` |
| **hr_admin** | `hr_staff` | `/hr/*` | `LayoutShell allowedAccountTypes=['hr_admin']` | Redirects to `/hr/dashboard` or `/login` |
| **osad_admin** | `osad_staff` | `/osad/*` | `LayoutShell allowedAccountTypes=['osad_admin']` | Redirects to `/osad/dashboard` or `/login` |

---

## 6. Audit Conclusion & Phase Gate Sign-off

- **Phase 2 Status:** `PASSED / COMPLETED`
- **Evidence Produced:** `docs/audit/PHASE_2_FRONTEND_ROUTE_MAP.csv` and `docs/audit/PHASE_2_FRONTEND_ROUTE_REACHABILITY.md`
- **Strict Execution Assertion:** No frontend route, navigation, source, naming, UI, API, auth, schema, migration, seed, or business-logic changes were performed in Phase 2.
