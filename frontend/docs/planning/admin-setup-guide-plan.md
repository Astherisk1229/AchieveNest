# Compact Admin Setup Guide Widget — Refined Implementation Plan

## Status

**Status:** Proposed  
**Module:** Shared Administrative Layout  
**Roles:** OSAD Admin and HR Admin  
**Design system:** Premium Utilitarian Minimalism

## 1. Objective

Replace the inaccurate, full-width InstitutionalWorkflowGuideBar with two compact, role-specific **Get Started** guides selected from the authenticated administrator's active role.

This is not one shared institutional checklist. OSAD and HR must receive independent guide definitions, progress totals, action destinations, prerequisites, and completion rules. The widget must:

- occupies minimal persistent space;
- expands into a short operational checklist;
- derives status from current institutional records;
- distinguishes Not Started, In Progress, Blocked, Complete, and Not Applicable;
- links directly to the correct authorized workspace;
- preserves only widget UI preferences in local storage; and
- never allows a user to manually mark institutional setup complete.

### Role Resolution Rule

1. Read the authenticated user's active administrative role from the existing authorization/session source.
2. Resolve exactly one guide definition: `OSAD_GET_STARTED` or `HR_GET_STARTED`.
3. Render only steps owned by that role.
4. Calculate progress only from that role's applicable steps.
5. Never include another administrator's task as a checklist item. If another role must first supply data, show that dependency only as a read-only Blocked reason.
6. If the user has multiple administrative roles, use the currently active portal/role context. Changing role context must reload the matching guide and its separately scoped UI preferences.
7. If no supported administrative role is active, do not render the widget.

## 2. Current-State Findings

The existing InstitutionalWorkflowGuideBar has workflow and UI problems:

1. It assigns Departments and Programs to HR / OSAD rather than OSAD.
2. It routes Dean assignment to an OSAD page even though HR owns Dean designation.
3. It labels Coordinator assignment as HR-owned even though OSAD assigns Coordinators to Departments.
4. It says Coordinators are assigned to Degree Programs rather than Departments.
5. It uses a manually supplied currentStep rather than derived records.
6. It treats a cross-team process as one linear eight-step sequence even though each role needs an actionable view.
7. It occupies a large horizontal region and requires scrolling.
8. It uses heavy active styling, pulsing decoration, rounded-2xl, and shadow-md.
9. It uses the banned word Seamless and broad governance language.
10. It has no clear handling for missing prerequisites, incomplete coverage, empty datasets, or permissions.

## 3. Correct Ownership and Dependencies

### OSAD

- creates Colleges;
- creates Departments under Colleges;
- creates Degree Programs under Departments;
- manages Student accounts and Program placement;
- assigns Program Coordinators to Departments;
- creates Organizations; and
- assigns Organization Moderators to Organizations.

### HR

- creates Personnel accounts;
- assigns Personnel to Colleges;
- designates College Deans; and
- assigns Department Secretaries to Colleges.

### Shared Read-Only Dependencies

- HR reads OSAD academic structure for College assignments.
- OSAD reads eligible HR Personnel records for Coordinator and Moderator selection.
- Neither administrator mutates the other administrator’s owned records through the guide.

## 4. User Review Required

> [!IMPORTANT]
> Confirm these decisions before implementation:
>
> 1. **Completion thresholds:** Confirm whether initial setup completion means at least one valid record or full expected institutional coverage.
> 2. **Expected structure:** Full coverage requires an authoritative expected list of Colleges, Departments, and Programs.
> 3. **Organization step:** Decide whether zero Organizations is Not Started or Not Applicable.
> 4. **Guide dismissal:** Recommended: allow Dismiss with a visible Show Setup Guide action in Settings or the Sidebar.
> 5. **Mobile placement:** Recommended: use an inline compact strip or bottom sheet, not a floating control over page actions.
> 6. **Cross-role visibility:** Recommended: show only the current administrator’s actionable steps and a read-only prerequisite message when waiting on the other team.
> 7. **Progress calculation:** Recommended: count only Complete steps; show In Progress separately rather than rounding partial coverage into a completed step.

## 5. Status Model

Each step must return:

| Status | Meaning |
| :--- | :--- |
| NOT_STARTED | No qualifying record or action exists. |
| IN_PROGRESS | Some records exist, but required coverage is incomplete. |
| BLOCKED | A prerequisite owned by the same or another administrator is missing. |
| COMPLETE | The defined completion rule is satisfied. |
| NOT_APPLICABLE | Stakeholder policy says the step does not apply. |

Each step also returns:

- completedCount;
- requiredCount when known;
- statusLabel;
- explanation;
- blockingReason;
- destination;
- actionLabel;
- ownerRole.

Do not store step completion in local storage. Recalculate it from domain records.

## 6. Role-Specific Get Started Guides

The registry must contain two separate guide objects. They may share the same reusable widget component, status model, and controller infrastructure, but they must not share a combined step array or progress denominator.

### 6.1 OSAD Get Started Guide

Header:

- title: `Get Started with OSAD Administration`;
- description: `Set up academic structure, student placement, coordinators, and organizations.`

Only OSAD-owned actions appear below.

#### Step 1 — Academic Structure

Destination:

    /osad/dashboard?tab=departments

Complete when:

- at least one College exists;
- every active Department has a valid parent College;
- every active Degree Program has a valid parent Department; and
- the configured structure meets the approved initial or full-coverage threshold.

In Progress when only part of the hierarchy is valid.

#### Step 2 — Student Accounts and Program Placement

Destination:

    /osad/dashboard?tab=accounts

Blocked when no Degree Program exists.

Complete when:

- active Student records exist; and
- every active Student requiring placement has a valid Degree Program.

#### Step 3 — Department Coordinators

Destination:

    /osad/dashboard?tab=departments

Blocked when:

- no Department with a Degree Program exists; or
- no eligible Personnel record is available from HR.

Complete when every active Department containing Programs has one active Program Coordinator.

#### Step 4 — Organizations and Moderators

Destination:

    /osad/dashboard?tab=organizations

Complete when:

- every active Organization has a valid scope or parent link; and
- every active Organization has one active Organization Moderator.

If Organizations are optional, support Not Applicable through approved institutional configuration rather than assuming an empty list is complete.

### 6.2 HR Get Started Guide

Header:

- title: `Get Started with HR Administration`;
- description: `Onboard personnel and complete College leadership and assignment setup.`

Only HR-owned actions appear below.

#### Step 1 — Personnel Accounts

Destination:

    /hr/personnel-directory

Complete when active Personnel records exist and required identifiers are valid.

#### Step 2 — College Placement

Destination:

    /hr/personnel-directory?tab=departments

Blocked when OSAD has not created Colleges.

Complete when every active Personnel account requiring academic placement has a valid College assignment.

Non-academic administrative Personnel may be excluded only through an explicit placement policy.

#### Step 3 — College Deans

Destination:

    /hr/personnel-directory?tab=departments

Blocked when no College or eligible Personnel exists.

Complete when every active College requiring leadership has one HR-designated Dean.

#### Step 4 — Department Secretaries

Destination:

    /hr/personnel-directory?tab=departments

Blocked when no College or eligible Personnel exists.

Complete when every active College receiving Personnel submissions has one Department Secretary.

The stakeholder title Department Secretary is retained, but verification and assignment scope is College-based.

## 7. Progress Calculation

### Collapsed Counter

Display:

    Getting Started · 2 of 4 complete

Rules:

- denominator excludes Not Applicable;
- numerator includes Complete only;
- Blocked and In Progress do not count as complete;
- show a small status summary when blocked steps exist;
- progress percentage equals completed applicable steps divided by total applicable steps.

Do not use a manual Reset Guide action to alter this value.

### Coverage Detail

Expanded rows may display:

    Department Coordinators
    3 of 5 Departments covered

This provides more useful information than a binary checkmark.

## 8. Widget Behavior

### Collapsed

- recommended height: 42–48px;
- title, completed-step count, slim progress track, expand control;
- no emoji;
- no pulsing decoration;
- entire header may toggle expansion, with a clear accessible name.

### Expanded

- dock upward from the Sidebar footer;
- maximum height with internal scrolling;
- one row per step;
- status icon plus visible status text;
- explanation or coverage count;
- Open action when authorized;
- disabled action plus blocking reason when blocked;
- Collapse;
- Dismiss Guide.

Replace Reset Guide with:

- Reset Widget Preferences, which only restores expansion/dismissal defaults; or
- remove it entirely.

### Dismissal

If dismissal is allowed:

- persist it per authenticated user and role;
- provide a discoverable Show Setup Guide action;
- never interpret dismissal as setup completion.

### Completion

When all applicable steps are complete:

- collapse to a quiet Setup complete summary;
- allow dismissal;
- avoid celebratory animation that distracts from administration work.

## 9. Sidebar Integration

The current Sidebar uses one full-height overflow-y-auto container. A bottom-docked expanded widget may scroll away or compete with navigation.

Refactor Sidebar into:

1. fixed brand header;
2. flex-1 scrollable navigation region;
3. docked setup-guide region for HR and OSAD;
4. fixed user/actions footer as applicable.

Requirements:

- widget does not cover navigation;
- expanded checklist has a bounded height;
- page actions remain unobstructed;
- widget is hidden for Student and Personnel roles;
- role switching immediately loads the correct guide;
- mobile behavior uses the existing navigation drawer or an accessible bottom sheet;
- no fixed floating bottom-left widget over application content.

## 10. Navigation

Use React Router navigation with approved destinations.

Query-tab navigation must be supported by the target page:

- OSADDashboardPage already reads tab query state.
- HRPersonnelDirectoryPage currently uses local activeTab state and must be updated to read and synchronize the tab query before links such as ?tab=departments can be relied upon.

If a destination is unavailable or unauthorized:

- do not navigate;
- show a blocking explanation;
- never route the user into another administrator’s mutation workflow.

## 11. Architecture

### Setup Guide Registry

Create:

    src/models/AdminSetupGuideRegistry.js

Define:

- two top-level guide definitions keyed by supported active role;
- role-specific guide title and description;
- role-specific step IDs;
- labels;
- owner role;
- prerequisites;
- destination;
- action label;
- completion evaluator key.

Recommended shape:

```js
const ADMIN_SETUP_GUIDES = {
  OSAD_ADMIN: {
    id: 'osad-get-started',
    title: 'Get Started with OSAD Administration',
    steps: [/* OSAD steps only */],
  },
  HR_ADMIN: {
    id: 'hr-get-started',
    title: 'Get Started with HR Administration',
    steps: [/* HR steps only */],
  },
}
```

Do not concatenate these arrays into a universal workflow.

Do not embed record-query logic inside the visual component.

### Setup Status Model

Create:

    src/models/AdminSetupStatusModel.js

Responsibilities:

- validate statuses and coverage counts;
- calculate applicable steps and progress;
- expose blocked reasons;
- serialize no domain data.

### Controller

Create:

    src/controllers/AdminSetupGuideController.js

Responsibilities:

- read OSAD and HR records through existing controllers;
- evaluate role-specific step status;
- handle missing or corrupt data safely;
- subscribe to relevant domain changes;
- expose derived progress;
- never mutate setup records.

### Hook

Create:

    src/hooks/useAdminSetupGuide.js

Responsibilities:

- bridge Sidebar to the controller;
- expose steps, counts, progress, loading, and errors;
- manage expansion and dismissal preferences;
- namespace preferences by user ID and role;
- resolve the guide from the active portal role, not merely from all roles assigned to the account;
- clean up event subscriptions.

### View

Create:

    src/components/common/AdminOnboardingGuideWidget.jsx

The view only renders derived status and dispatches navigation or preference actions.

## 12. Local Storage

Store only UI preferences:

    achievenest_admin_setup_guide_preferences_v1

Example preference fields:

- userId;
- roleContext;
- isExpanded;
- isDismissed;
- updatedAt.

Do not store:

- manually completed step IDs;
- copied institutional counts;
- sensitive Personnel or Student data;
- arbitrary redirect URLs.

## 13. Change Manifest

| Change | File | Purpose |
| :--- | :--- | :--- |
| NEW | src/models/AdminSetupGuideRegistry.js | Define correct HR and OSAD steps. |
| NEW | src/models/AdminSetupStatusModel.js | Represent status, coverage, and progress. |
| NEW | src/controllers/AdminSetupGuideController.js | Derive status from institutional records. |
| NEW | src/hooks/useAdminSetupGuide.js | Expose status and user-scoped widget preferences. |
| NEW | src/components/common/AdminOnboardingGuideWidget.jsx | Render collapsed and expanded modes. |
| MODIFY | src/components/layout/Sidebar.jsx | Add docked guide region and separate navigation scrolling. |
| MODIFY | src/pages/osad-admin/OSADCommandCenterPage.jsx | Remove InstitutionalWorkflowGuideBar. |
| MODIFY | src/pages/hr-admin/HRPersonnelDirectoryPage.jsx | Synchronize Governance tab with tab query parameter. |
| DELETE after verification | src/components/common/InstitutionalWorkflowGuideBar.jsx | Remove inaccurate guide after replacement passes tests. |
| VERIFY | src/controllers/OSADController.js and HRController.js | Expose required read-only records and change notifications. |

## 14. Design Rules

- 8px or 12px maximum radius;
- one-pixel light borders;
- no heavy shadows;
- no gradient;
- no glassmorphism;
- no rounded-full for the widget container;
- semantic pale green, yellow, red, and blue only;
- avoid purple unless the design palette is expanded;
- no emojis;
- do not add new Lucide icons during this refinement;
- text-xs minimum for operational labels;
- full action labels without clipping;
- visible keyboard focus.

Progress tracks may use rounded ends because they are small status indicators rather than large containers.

## 15. Accessibility

- toggle uses aria-expanded and aria-controls;
- progress uses role=progressbar with numeric values;
- each status includes visible text, not color alone;
- expanded checklist is a semantic list;
- blocked reasons are programmatically associated;
- focus moves into the expanded drawer only when appropriate;
- Escape collapses the drawer without dismissing it;
- focus returns to the toggle;
- navigation actions have clear accessible names;
- reduced-motion preferences disable expansion animation.

## 16. Failure and Loading States

### Loading

Show a compact neutral Loading setup status label without displaying a false percentage.

### Data Error

- keep Sidebar usable;
- show Setup status unavailable;
- provide Retry if safe;
- do not mark steps complete.

### Partial Data

Use In Progress and show coverage counts.

### Missing Prerequisite

Use Blocked and state which role or record is required.

## 17. Implementation Phases

### Phase 0 — Confirm Completion Policy

- [ ] Confirm the seven user-review decisions.
- [ ] Define initial versus full-coverage thresholds.
- [ ] Confirm expected institutional structure source.
- [ ] Confirm Organization Not Applicable policy.
- [ ] Confirm dismissal and rediscovery behavior.

### Phase 1 — Registry and Status Model

- [ ] Define corrected HR and OSAD steps.
- [ ] Implement status enum and coverage model.
- [ ] Implement progress calculation.
- [ ] Add registry and model tests.

### Phase 2 — Controller and Hook

- [ ] Read required HR and OSAD records.
- [ ] Evaluate prerequisites and completion.
- [ ] Add domain-change subscriptions.
- [ ] Implement user- and role-scoped UI preferences.
- [ ] Add loading and error behavior.
- [ ] Add controller and hook tests.

### Phase 3 — Widget and Sidebar

- [ ] Build collapsed widget.
- [ ] Build expanded checklist.
- [ ] Refactor Sidebar scrolling regions.
- [ ] Add dismissal and rediscovery.
- [ ] Add mobile behavior.
- [ ] Add accessibility interactions.

### Phase 4 — Navigation and Replacement

- [ ] Synchronize HR Personnel Directory tab query.
- [ ] Verify all OSAD tab destinations.
- [ ] Remove guide usage from OSADCommandCenterPage.
- [ ] Verify no other guide usage remains.
- [ ] Delete InstitutionalWorkflowGuideBar after validation.

### Phase 5 — Verification

- [ ] Run production build.
- [ ] Run targeted lint.
- [ ] Test every status and role.
- [ ] Test desktop, narrow width, dark mode, keyboard, and reduced motion.

## 18. Automated Verification

Add tests for:

- role ownership mappings;
- HR and OSAD step registry;
- Not Started, In Progress, Blocked, Complete, and Not Applicable;
- denominator excluding Not Applicable;
- empty datasets not becoming falsely complete;
- missing College blocking HR placement;
- missing eligible Personnel blocking OSAD assignments;
- Department Coordinator coverage;
- Organization Moderator coverage;
- College Dean coverage;
- College-based Department Secretary coverage;
- user- and role-scoped preferences;
- dismissal and rediscovery;
- query-tab navigation;
- loading and error states.

Run separately:

    npm run build
    npm run lint

The Vite build command does not run linting.

## 19. Manual Acceptance Tests

1. Sign in as OSAD and verify four OSAD-owned steps.
2. Sign in as HR and verify four HR-owned steps.
3. Confirm OSAD cannot navigate to Dean or Secretary assignment.
4. Confirm HR cannot mutate academic structure through the guide.
5. Start with no data and verify Not Started or Blocked, not Complete.
6. Create a partial academic hierarchy and verify In Progress.
7. Complete Department Coordinator coverage and verify the step updates.
8. Complete Organization Moderator coverage and verify the step updates.
9. Complete College Dean and Secretary coverage and verify HR progress.
10. Expand, collapse, dismiss, and rediscover the guide.
11. Switch roles and verify preference and checklist isolation.
12. Click every available action and verify the correct tab.
13. Test loading and corrupt-data behavior.
14. Test Sidebar overflow, narrow width, dark mode, keyboard, and reduced motion.

## 20. Acceptance Criteria

- The widget shows only the current administrator’s approved responsibilities.
- OSAD sees `Get Started with OSAD Administration`; HR sees `Get Started with HR Administration`.
- OSAD and HR use separate step arrays, progress denominators, status evaluation, destinations, and saved UI preferences.
- Switching the active administrative role immediately replaces the guide instead of merging both guides.
- A prerequisite owned by another role appears only as a read-only Blocked explanation and never as a step to complete.
- Step completion is derived from current records and cannot be manually reset.
- OSAD steps reflect Academic Structure, Students, Department Coordinators, and Organizations/Moderators.
- HR steps reflect Personnel, College Placement, Deans, and College-based Department Secretaries.
- Missing prerequisites produce Blocked rather than false completion.
- Partial coverage produces In Progress with counts.
- Widget preferences are isolated by user and role.
- Expanded content does not cover navigation or page actions.
- Every action opens an authorized working destination.
- The inaccurate full-width guide is removed after replacement verification.
- UI follows the 12px radius, flat-border, low-shadow constraints.
- The production build succeeds and modified files introduce no new lint errors.

## 21. Future Backend Phase

Move readiness calculation to authenticated services when backend data exists:

- server-derived coverage;
- institutional expected-structure configuration;
- assignment effective dates;
- cross-user real-time updates;
- authorization-controlled status;
- audit events for setup mutations;
- centralized dismissal preferences if required.
