# Implementation Plan: Multi-Role Personnel Sidebar Navigation & Query Parameter Reactivity

This implementation plan documents the resolution to ensure seamless, instantaneous navigation updates across all 4 Personnel role contexts (**Personnel (own)**, **Department Secretary**, **Program Coordinator**, and **Organization Moderator**) without requiring manual browser reloads.

## User Review Required

> [!IMPORTANT]
> **Zero UI Disruption Guarantee**: All modifications are strictly architectural and logic-focused. 100% of Tailwind CSS layout classes, typography, colors, dark mode tokens, and visual components will be preserved verbatim.

## Problem Summary

Personnel users assigned to multiple role contexts experience frozen view states or unresponsive sidebar navigation links due to three technical factors:
1. **Query-Parameter Same-Path Inertia**: Navigation between role tabs (e.g. `?tab=overview`, `?tab=workspace`, `?tab=students`) stays on `/personnel/dashboard`. React Router does not unmount component trees when only query parameters change unless reactive keying and state listeners are explicitly wired up.
2. **Role Context Desynchronization**: `MainLayout` holds `currentUser` in static `useState(getCurrentUser())` that evaluates once on layout mount, causing `<Sidebar>` to render stale navigation links when a user switches roles in `<Header>`.
3. **Route Fallback Redirection**: Incomplete role string matching in `Sidebar.jsx` causes fallback to `/student/*` routes, which `AuthGuard` in `App.jsx` immediately rejects and bounces back to the homepage.

---

## Proposed Changes

### 1. Global Layout & Authentication State Synchronization
Ensure role context changes trigger instantaneous, synchronized re-renders across the layout shell and sidebar.

#### [MODIFY] `src/layouts/MainLayout.jsx`
- Replace static `useState(getCurrentUser())` with reactive user state from `useAuth()`.
- Pass updated `currentUser` and `activeRoleContext` down to `<Sidebar>` and `<Header>`.

---

### 2. Sidebar Navigation & Route Scoping
Ensure all 4 Personnel role contexts generate valid `/personnel/*` routes and reactively update active tab highlights.

#### [MODIFY] `src/components/Sidebar.jsx`
- Consume `useAuth()` to get the active role context (`personnel`, `program_coordinator`, `organization_moderator`, `department_secretary`).
- Audit `getNavItems()` to ensure every role context maps its tabs correctly (`?tab=overview`, `?tab=workspace`, `?tab=students`, `?tab=events`, etc.).
- Enforce strict personnel route scoping so personnel users are never served `/student/*` fallback links.

---

### 3. Personnel Dashboard Sub-View Reactivity
Ensure sub-dashboards update instantly when query parameters change.

#### [MODIFY] `src/pages/PersonnelDashboard.jsx`
- Read `activeTabParam` reactively using `useSearchParams()`.
- Wrap the sub-dashboard container in a reactive key: `key={activeRoleContext + '_' + (activeTabParam || 'default')}` to force React to unmount the old tab view and mount the new tab view on every click.

#### [MODIFY] `src/components/coordinator/CoordinatorDashboardView.jsx`
#### [MODIFY] `src/components/organization/OrgModeratorDashboardView.jsx`
#### [MODIFY] `src/components/depsec/DepSecDashboardView.jsx`
- Ensure internal `activeTab` calculations parse `searchParams.get('tab')` cleanly and react to URL updates.

---

## Verification Plan

### Manual Verification
1. Log in as a Personnel user assigned to multiple roles (e.g. `faculty@ndmu.edu.ph` or `coordinator@ndmu.edu.ph`).
2. Switch role context to **Program Coordinator**.
   - Click **Verification Workspace** (`?tab=workspace`). Verify the workspace view renders instantly without a page reload.
   - Click **Students** (`?tab=students`). Verify the student roster view renders instantly.
   - Click **Homepage** (`?tab=overview`). Verify the overview view renders instantly.
3. Switch role context to **Department Secretary**.
   - Click **Personnel Roster** (`?tab=personnel`). Verify the roster view renders instantly.
   - Click **Edit Portfolio** (`/personnel/portfolio/edit`). Verify the edit portfolio page loads.
4. Verify that zero visual layout changes or styling regressions occurred.
