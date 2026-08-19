# AchieveNest Master Feature and Implementation Plan

Authoritative feature matrix, technical architecture, and phase plan for the **AchieveNest Institutional Achievement & Evaluation System**.

## 1. Executive Summary

AchieveNest is Notre Dame of Marbel University's institutional portal for:
- Student achievement tracking, portfolio generation, and OSAD Honor Roll / Araw ng Parangal evaluations;
- Faculty and Personnel professional portfolio management, HR evaluation, and NDMU ranking;
- Student Organization event management, QR attendance tracking, and certificate generation;
- Academic Structure governance (Colleges, Departments, Programs, Personnel assignments).

Current project status is tracked authoritatively in [project-progress-roadmap.md](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/frontend/docs/planning/project-progress-roadmap.md).

## 2. Core Functional Modules & Role Ownership

| Module / Area | Primary Role | Key Components & Capabilities |
|---|---|---|
| Student Achievements & Portfolio | Student | Achievement entry, verified proof attachments, digital ID card, portfolio PDF preview |
| Program Verification Queue | Program Coordinator | Department-scoped submission verification, approval/return actions |
| Department Endorsement Workbench | Department Secretary | Department portfolio endorsement, faculty submission evaluation |
| Student Org & Attendance | Organization Moderator | Event creation, QR code scanner, attendance tracking, certificate generation |
| HR Personnel Directory & Ranking | HR Staff | Personnel directory, onboarding, evaluation studio, ranking assignment logs |
| OSAD Honor Roll & Awardees | OSAD Staff | Category leaderboards, candidate evaluation, award confirmations, draft/official rosters |

## 3. Technical Implementation Architecture

- **Frontend Core**: React 18, Vite, React Router v6, Lucide React icons, Tailwind CSS / Vanilla CSS design system.
- **State & Domain Layer**: OOP Model-Controller-Hook pattern (`src/models/`, `src/controllers/`, `src/hooks/`).
- **Code Splitting & Shell Preservation**: `React.lazy()` with `<Suspense fallback={<RouteLoadingFallback />}>` preserving `<LayoutShell>` sidebar and topbar.
- **Quality Gate & Testing**: ESLint / Oxlint 0-error gate, Vitest unit test runner (`src/**/__tests__/`).
