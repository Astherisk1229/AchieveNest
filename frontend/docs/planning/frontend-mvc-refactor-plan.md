# Frontend MVC Refactor Plan

## 1. Purpose

This plan brings the AchieveNest frontend into strict compliance with the architecture rules in:

- [frontend/.agents/AGENTS.md](../../.agents/AGENTS.md)
- [frontend/docs/architecture/frontend-architecture-and-readiness.md](../architecture/frontend-architecture-and-readiness.md)

The objective is to preserve the existing visual design and interaction behavior while moving the codebase to the intended Model-Controller-Hook-View structure.

---

## 2. Source-of-truth rules

The architecture rule is explicit:

- Models live in `src/models/` and own entity shape, validation, and domain mutations.
- Controllers live in `src/controllers/` and own business logic, filtering, sorting, report generation, persistence, and workflow orchestration.
- Hooks live in `src/hooks/` and act as the bridge between React views and controllers.
- Views in `src/pages/` and `src/components/` must stay lightweight and presentational.
- No visual redesign is allowed; only architectural refactoring without UI disruption.

---

## 3. Verified baseline

The following checks were run in this workspace and are the current baseline:

- `npm test` -> 19 test files passed, 91 tests passed.
- `npm run build` -> Vite production build completed successfully.
- `npm run lint` -> no lint errors; warnings only.

This means the application is functionally healthy, but the architecture is only partially aligned with the stated rule.

---

## 4. Current architecture findings

The codebase contains real MVC patterns, but the following files are the main violations of the strict rule:

### 4.1 High-risk view-level violations

These files currently do too much business logic and should be reduced to view composition:

- [frontend/src/App.jsx](../../src/App.jsx)
- [frontend/src/pages/personnel/PersonnelDashboardPage.jsx](../../src/pages/personnel/PersonnelDashboardPage.jsx)
- [frontend/src/pages/osad-admin/OSADDashboardPage.jsx](../../src/pages/osad-admin/OSADDashboardPage.jsx)

Observed issues:

- route decision logic mixed with UI composition
- local state tracking for domain data and filters
- mock data generation embedded in the page layer
- modal orchestration and business flow logic inside the page
- role-switching behavior handled in the page layer rather than a controller/hook boundary

### 4.2 Oversized controller violation

The highest-risk controller is:

- [frontend/src/controllers/OSADController.js](../../src/controllers/OSADController.js)

This file mixes several domain responsibilities:

- user/account management
- organization and department data
- college/department/program setup
- role assignment and audit logging
- award-category logic
- accreditation report data
- data mutation methods

This is a god-controller pattern and conflicts with the MVC rule.

### 4.3 Auth ownership split

The auth domain is spread across:

- [frontend/src/controllers/AuthController.js](../../src/controllers/AuthController.js)
- [frontend/src/context/AuthContext.jsx](../../src/context/AuthContext.jsx)
- [frontend/src/services/authService.js](../../src/services/authService.js)

This creates duplication in:

- session loading
- role normalization
- user persistence
- role switching
- storage synchronization

The architecture should have one clear owner for authentication state and behavior.

### 4.4 Good existing examples to preserve

The architecture is already implemented well in some files and should remain the model to copy:

- [frontend/src/models/UserModel.js](../../src/models/UserModel.js)
- [frontend/src/models/AchievementModel.js](../../src/models/AchievementModel.js)
- [frontend/src/models/VerificationQueueModel.js](../../src/models/VerificationQueueModel.js)
- [frontend/src/controllers/VerificationController.js](../../src/controllers/VerificationController.js)
- [frontend/src/hooks/useVerification.js](../../src/hooks/useVerification.js)

These are examples of clean model/controller/hook boundaries.

---

## 5. Refactor target state

The refactor should end with this structure:

### Models

- Own schema, validation, serialization, and state transitions only.
- Continue to use classes such as `UserModel`, `AchievementModel`, `VerificationQueueModel`, `CollegeModel`, `DepartmentModel`, `DegreeProgramModel`, and related entities.

### Controllers

- Own all workflow logic: filtering, sorting, persistence, exports, validation, role assignment, and domain actions.
- One controller per business domain, not one giant controller.

### Hooks

- Own bridge behavior only.
- Expose controller actions and derived states to components.
- Keep hooks small and consistent.

### Views

- Presentational only.
- Receive data and callbacks from hooks.
- Perform layout rendering only.
- No raw domain schemas, mutation logic, or filtering logic in JSX.

---

## 6. Implementation phases

### Phase 1: Freeze the UI contract

Goal: Ensure no visual/design break while moving logic.

Tasks:

1. Identify the current rendered output contract for the high-risk pages.
2. Record the inputs and rendered structure without changing CSS classes or layout structure.
3. Confirm that all state transitions still produce the same visible result.
4. Keep all existing JSX structure unless strictly necessary for code extraction.

Acceptance criteria:

- no CSS/class changes
- no layout changes
- no interaction behavior changes
- no design refactor

---

### Phase 2: Extract route and app-shell logic from App.jsx

File target:

- [frontend/src/App.jsx](../../src/App.jsx)

Tasks:

1. Move route access decisions into a dedicated controller or route service.
2. Keep `App.jsx` limited to route definitions and shell composition.
3. Preserve the same route paths and redirect behavior.
4. Maintain lazy loading and `Suspense` structure.
5. Keep `LayoutShell` and `ErrorBoundary` as runtime infrastructure only.

Desired end state:

- `App.jsx` is mainly routing configuration.
- access control rules live in a controller or authorization helper.
- route decisions are not embedded in markup logic.

Acceptance criteria:

- same route flow
- same redirects
- same access rules
- no visual change

---

### Phase 3: Refactor the largest pages into presentational views

Files to target:

- [frontend/src/pages/personnel/PersonnelDashboardPage.jsx](../../src/pages/personnel/PersonnelDashboardPage.jsx)
- [frontend/src/pages/osad-admin/OSADDashboardPage.jsx](../../src/pages/osad-admin/OSADDashboardPage.jsx)

Tasks:

1. Move all domain data shaping into a dedicated controller or hook.
2. Move local filtering logic into the controller layer.
3. Replace embedded data generation with controller-provided values.
4. Keep JSX focused on layout and rendering only.
5. Preserve all current button labels, tabs, sections, and content output.

Desired end state:

- a page file only renders data received from a hook/controller
- domain logic is not embedded in JSX
- filter and business actions are methods on a controller or hook

Acceptance criteria:

- same visible page output
- same user interactions
- no CSS or layout behavior differences

---

### Phase 4: Split OSADController into domain-specific controllers

File to split:

- [frontend/src/controllers/OSADController.js](../../src/controllers/OSADController.js)

Proposed decomposition:

1. `AcademicStructureController`
   - department/college/program operations
   - hierarchy queries
   - validation and assignment metadata

2. `StudentOrganizationController`
   - organizations/clubs management
   - moderator assignment logic
   - scope filtering

3. `AwardManagementController`
   - award categories
   - awardee confirmation
   - candidate generation and batch operations

4. `AuditLogController`
   - audit log queries
   - report generation
   - event log writing

5. `UserAssignmentController`
   - program coordinator assignment
   - moderator assignment
   - role revocation

Implementation method:

- Keep the facade API stable until the hooks and pages are migrated.
- Migrate consumers gradually to the split controllers.
- Remove duplicated state-bearing logic from the old monolithic file.

Acceptance criteria:

- no business domain lives in a single giant controller
- each controller owns one clear domain
- same runtime behavior as before

---

### Phase 5: Standardize hooks to pure bridge behavior

Files to review:

- [frontend/src/hooks/useOSAD.js](../../src/hooks/useOSAD.js)
- [frontend/src/hooks/useOrganization.js](../../src/hooks/useOrganization.js)
- [frontend/src/hooks/useHR.js](../../src/hooks/useHR.js)
- [frontend/src/hooks/usePersonnelPortfolio.js](../../src/hooks/usePersonnelPortfolio.js)

Tasks:

1. Remove direct domain logic from hooks where it belongs in controllers.
2. Keep hooks as the abstraction layer between views and controllers.
3. Return normalized values and controller actions only.
4. Ensure each hook has a single responsibility.

Desired end state:

- hooks are a thin API layer
- controllers own the real logic
- UI code does not implement business rules

Acceptance criteria:

- hooks do not contain domain mutation logic
- pages call hooks; hooks call controllers; models own data rules

---

### Phase 6: Consolidate auth ownership

Files to align:

- [frontend/src/controllers/AuthController.js](../../src/controllers/AuthController.js)
- [frontend/src/context/AuthContext.jsx](../../src/context/AuthContext.jsx)
- [frontend/src/services/authService.js](../../src/services/authService.js)

Tasks:

1. Choose the single owner of authentication state: `AuthController` or a dedicated `AuthSessionController`.
2. Keep `AuthContext` as the React integration wrapper only.
3. Move duplicated normalization and persistence logic into the chosen controller.
4. Keep `authService` as a thin adapter or data source if needed.

Desired end state:

- one source of truth for current session and role context
- no duplicate auth logic across multiple layers

Acceptance criteria:

- same login/logout/role-switch behavior
- no auth logic duplicated in UI or service

---

### Phase 7: Strengthen model ownership and eliminate inline state mutation

Files to review:

- [frontend/src/models](../../src/models)
- pages with inline domain-shape state objects

Tasks:

1. Ensure all domain objects are created via models.
2. Remove inline object mutation patterns across page components.
3. Move validation and state transitions into model classes where missing.
4. Keep only UI-specific local state in components.

Acceptance criteria:

- domain state is represented by models
- raw inline unencapsulated state is eliminated from business data

---

## 7. File-by-file migration sequence

This is the recommended order to reduce risk while staying within the strict MVC rule:

1. [frontend/src/App.jsx](../../src/App.jsx)
2. [frontend/src/pages/personnel/PersonnelDashboardPage.jsx](../../src/pages/personnel/PersonnelDashboardPage.jsx)
3. [frontend/src/pages/osad-admin/OSADDashboardPage.jsx](../../src/pages/osad-admin/OSADDashboardPage.jsx)
4. [frontend/src/controllers/OSADController.js](../../src/controllers/OSADController.js)
5. [frontend/src/hooks/useOSAD.js](../../src/hooks/useOSAD.js)
6. [frontend/src/hooks/useOrganization.js](../../src/hooks/useOrganization.js)
7. [frontend/src/context/AuthContext.jsx](../../src/context/AuthContext.jsx)
8. [frontend/src/controllers/AuthController.js](../../src/controllers/AuthController.js)
9. [frontend/src/services/authService.js](../../src/services/authService.js)
10. remaining large pages and domain-specific controllers using the same pattern

This sequence minimizes risk while keeping the application stable.

---

## 8. Definition of done

The refactor is complete only when all of the following are true:

1. All domain logic sits in `src/models/` and `src/controllers/`.
2. All views in `src/pages/` and `src/components/` are presentational only.
3. Hooks are thin adapters and never contain domain mutation logic.
4. No page contains business rules, model definitions, or dataset logic directly in JSX.
5. The design and visual output remain unchanged.
6. The following commands still pass:
   - `npm test`
   - `npm run build`
   - `npm run lint`

---

## 9. Verification checklist for completion

Before marking the refactor done, all of the following must be satisfied:

- Domain logic moved out of heavy pages
- OSAD controller split into focused responsibilities
- auth ownership unified
- hooks aligned to bridge-only behavior
- no UI output changes
- tests still pass
- build still passes
- lint still passes without errors

---

## 10. Risk note

The main risk is not technical complexity; it is accidental regression in page behavior while extracting logic. To reduce that risk, the refactor must be done in small steps and should be validated after each phase with:

- `npm test`
- `npm run build`
- `npm run lint`

No design changes should be introduced during the refactor. The focus is pure architectural compliance.
