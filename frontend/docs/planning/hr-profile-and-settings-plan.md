# HR My Profile and Settings — Refined Implementation Plan

## Status

**Status:** Proposed  
**Module:** Shared Account, Settings, and HR Portal Navigation  
**Target routes:** /hr/account and /hr/settings  
**Design system:** Premium Utilitarian Minimalism

## 1. Objective

Provide HR Staff with correctly routed, role-aware Account and Settings pages while preserving clear ownership boundaries:

- Account displays authenticated identity and allows only approved self-service profile edits.
- Settings manages user preferences such as notifications and appearance.
- Security actions are shown as functional only when backed by a real authentication or session service.
- Navigation resolves destinations from authenticated role context rather than pathname guesses.

## 2. Current-State Findings

The current code confirms:

1. App.jsx has no /hr/account or /hr/settings routes.
2. Topbar falls back to Student account and settings routes for HR.
3. AccountPage treats every non-Personnel context as Student, so HR receives incorrect defaults and labels.
4. SettingsPage treats only Personnel and Program Coordinator as its non-Student branch.
5. AccountPage stores edits only in local component state.
6. Settings toggles also exist only in local component state.
7. The current password modal validates form shape but does not securely verify or update a password.
8. No active-session service exists, so View Active HR Sessions cannot be claimed as operational.
9. Shared pages contain role-specific demo defaults and presentation logic that should be configuration-driven.
10. Existing rounded-3xl containers, rounded-2xl surfaces, and strong shadows conflict with the referenced 12px minimalist limit.

## 3. User Review Required

> [!IMPORTANT]
> Confirm these decisions before implementation:
>
> 1. **Editable HR fields:** Recommended self-service fields are phone, location, avatar, and optional display preferences. Employee ID, legal name, designation, office, role, and institutional email remain authoritative and read-only unless a separate approved workflow exists.
> 2. **Profile ownership:** Profile fields are edited only on Account. Settings must not duplicate the profile form.
> 3. **Preference persistence:** Notification and portal preferences may use user-scoped local storage for the current prototype.
> 4. **Password change:** Keep disabled or marked unavailable until an authentication service can verify the current password and perform a secure update.
> 5. **Active sessions:** Treat as future scope until a backend session inventory and revocation service exists.
> 6. **HR roles:** HR Officer and HR Director may share user_type = hr_staff; authorization must come from explicit permissions or role claims, not designation text.
> 7. **Demo identity:** Director Evelyn Tan may remain a seeded demo user in authService, but shared pages must not hard-code her as every HR user.

## 4. Information Ownership

### Account Page

Display:

- avatar;
- full name;
- employee ID;
- HR designation;
- office or division;
- institutional email;
- phone;
- location;
- account role;
- last sign-in, if genuinely available.

Recommended editable fields:

- phone;
- location;
- avatar URL or approved upload;
- optional preferred display name only if policy permits.

Read-only fields:

- employee ID;
- legal full name;
- institutional email;
- designation;
- office;
- user type;
- permissions and administrative roles.

### Settings Page

Manage:

- notification preferences;
- theme and appearance;
- compact or comfortable display density if supported;
- optional portal preference defaults;
- links to supported security actions.

Do not duplicate:

- full name;
- email;
- phone;
- avatar; or
- authoritative HR assignment fields.

## 5. Route and Navigation Architecture

### App.jsx

Add under the existing HR LayoutShell:

    /hr/account  → AccountPage
    /hr/settings → SettingsPage
    /hr/profile  → redirect to /hr/account

Both routes inherit:

    allowedRoles = ['hr_staff']

Verify direct URL entry, refresh, and unauthorized access.

### Central Portal Route Resolver

Do not duplicate pathname conditionals in each Topbar link.

Create:

    src/utils/portalRoutes.js

Recommended mappings:

| Role context | Account | Settings | Dashboard |
| :--- | :--- | :--- | :--- |
| hr_staff | /hr/account | /hr/settings | /hr/dashboard |
| osad_staff | /osad/account | /osad/settings | /osad/dashboard |
| student | /student/account | /student/settings | /student/dashboard |
| personnel and assigned Personnel roles | /personnel/account | /personnel/settings | /personnel/dashboard |

The resolver should:

- accept activeRoleContext and user_type;
- normalize assigned Personnel roles to the Personnel portal;
- return an explicit safe fallback;
- never infer authorization solely from location.pathname; and
- be shared by settings icon, My Profile, Settings, and post-role-switch navigation.

Topbar may use pathname only as secondary context during transitional routes, never as the primary identity source.

## 6. Role-Aware Account Configuration

Create a role presentation registry:

    src/models/AccountRolePresentation.js

It should define role-specific:

- page label;
- identity-field labels;
- badge text;
- metadata visibility;
- editable fields;
- read-only fields; and
- supported actions.

AccountPage should consume authenticated user data from AuthContext first. getCurrentUser may remain a compatibility fallback.

Resolution order:

1. currentUser prop when explicitly provided;
2. AuthContext user;
3. getCurrentUser compatibility fallback;
4. role-specific demo seed only in development.

Do not merge HR users with Student defaults.

## 7. HR Demo Profile

If the demo account is Director Evelyn Tan, define it once in authService or the demo-user fixture:

- full_name: Director Evelyn Tan;
- employee_id: HR-DIR-2010-001;
- designation: Director of Human Resource Management and Development;
- office: Human Resource Management and Development Office;
- division: NDMU General Administration and Governance;
- email: etan@ndmu.edu.ph;
- office_email: hr@ndmu.edu.ph;
- phone: +63 917 845 2910;
- user_type: hr_staff;
- permissions or role claims as applicable.

The UI must render whichever authenticated HR user is active. It must not assume that every hr_staff account is a Director.

## 8. Profile Persistence

### Prototype Phase

If no profile API exists:

- create a user-scoped profile preference store;
- persist only approved self-service overrides;
- namespace by stable user ID;
- validate and sanitize all values;
- keep authoritative HR fields read-only;
- clearly treat the behavior as local prototype persistence.

Recommended files:

- src/models/UserProfilePreferencesModel.js;
- src/controllers/UserProfileController.js;
- src/hooks/useUserProfile.js.

### Validation

- phone: defined length and allowed characters;
- location: trimmed, bounded text;
- avatar URL: http or https only, or approved local upload reference;
- display name: policy-controlled and bounded;
- no HTML rendering from profile fields.

Save behavior:

- await persistence;
- show success only after confirmed save;
- retain edits and show error on failure;
- provide Cancel to restore the last persisted values.

## 9. HR Settings Preferences

### Notification Keys

Use stable keys:

- faculty_submission_received;
- personnel_password_reset_requested;
- weekly_evaluation_audit_digest;
- evaluation_return_or_finalization_updates.

For each preference, define:

- label;
- description;
- supported delivery channels;
- default;
- role eligibility.

Do not label a preference Email if the application has no email-delivery service. In the prototype, describe it as a saved preference for future notification delivery or clearly mark it as simulated.

### Preference Persistence

Recommended files:

- src/models/UserSettingsModel.js;
- src/controllers/UserSettingsController.js;
- src/hooks/useUserSettings.js.

Namespace settings by stable user ID and schema version.

The page should expose:

- loading;
- saving;
- saved;
- save failed;
- reset to defaults.

Do not show a success toast immediately before persistence succeeds.

## 10. Theme Integration

Continue using useTheme as the single source of truth.

Requirements:

- Light;
- Dark;
- System, if the existing hook supports it;
- visible selected state;
- keyboard access;
- no flash caused by competing local state; and
- no duplicate theme persistence inside SettingsPage.

Do not maintain separate theme state in the page.

## 11. Security Features

### Password Change

The current modal must not be presented as a secure working password change because it:

- does not verify the current password through an authentication service;
- does not securely update stored credentials;
- performs client-side form progression only.

Choose one:

1. hide the action until supported;
2. display Coming soon or Unavailable in this prototype; or
3. implement an approved authentication-service method.

A real password-change contract must:

- verify the current password server-side;
- enforce the institutional password policy;
- rate-limit attempts;
- avoid logging passwords;
- invalidate or rotate sessions according to policy;
- return explicit success or failure;
- clear password fields on close and success; and
- produce a safe security audit event.

Never persist currentPassword, newPassword, or confirmPassword in local storage.

### Active Sessions

Do not implement a fake active-session list.

A functional version requires:

- server-issued session IDs;
- device and last-active metadata;
- current-session identification;
- authorization-controlled session listing;
- revoke-one and revoke-others operations;
- confirmation;
- audit events.

Until those exist, omit or mark the feature unavailable.

## 12. Audit Events

When supported persistence is implemented, record safe events for:

- profile contact information updated;
- avatar updated;
- notification preferences updated;
- theme preference updated, only if governance policy requires it;
- password changed;
- other sessions revoked.

Audit records must include authenticated actor ID and must never include passwords, tokens, reset links, or full sensitive before-and-after values.

## 13. UI Structure

### Account

Recommended layout:

1. identity summary;
2. employment and office details;
3. editable contact information;
4. account security status;
5. supported security action.

### Settings

Recommended layout:

1. notifications;
2. appearance;
3. portal preferences;
4. supported security links;
5. reset preferences.

### Minimalist Constraints

- use 8px or 12px card radius;
- replace rounded-2xl and rounded-3xl;
- use one-pixel light borders;
- remove heavy shadows;
- use warm white and off-white surfaces;
- avoid large saturated panels;
- do not add new Lucide icons during this refinement;
- use icons already present only where they aid scanning;
- do not use emojis;
- preserve full labels and responsive wrapping.

The referenced design system permits subtle semantic pastel accents, not broad green surfaces.

## 14. Accessibility

- use semantic headings and grouped form controls;
- label all inputs and switches;
- switches use role=switch and aria-checked;
- errors connect with aria-describedby;
- preserve visible focus;
- announce save success and failure through an aria-live region;
- focus the first invalid field;
- trap focus in modals;
- restore focus to the trigger after modal close;
- provide accessible names for avatar and security actions;
- do not rely on color alone.

## 15. Change Manifest

| Change | File | Purpose |
| :--- | :--- | :--- |
| MODIFY | src/App.jsx | Add protected HR Account and Settings routes and profile redirect. |
| MODIFY | src/components/layout/Topbar.jsx | Use centralized portal route resolution. |
| NEW | src/utils/portalRoutes.js | Resolve portal routes from authenticated role context. |
| MODIFY | src/pages/common/AccountPage.jsx | Render role-aware fields and supported HR self-service behavior. |
| MODIFY | src/pages/common/SettingsPage.jsx | Render HR preferences without duplicating profile editing. |
| NEW | src/models/AccountRolePresentation.js | Define role-specific labels, fields, and capabilities. |
| NEW | src/models/UserProfilePreferencesModel.js | Validate local profile overrides if prototype persistence is approved. |
| NEW | src/controllers/UserProfileController.js | Own profile preference operations. |
| NEW | src/hooks/useUserProfile.js | Bridge AccountPage to profile persistence. |
| NEW | src/models/UserSettingsModel.js | Validate notification and portal preferences. |
| NEW | src/controllers/UserSettingsController.js | Own preference persistence. |
| NEW | src/hooks/useUserSettings.js | Bridge SettingsPage to preferences. |
| VERIFY | src/services/authService.js | Keep demo HR identity and supported auth operations in one source. |
| VERIFY | src/context/AuthContext.jsx | Expose stable current user and active role context. |
| VERIFY | src/hooks/useTheme.js | Remain the sole theme source. |

## 16. Implementation Phases

### Phase 0 — Confirm Scope

- [ ] Confirm the seven user-review decisions.
- [ ] Identify stable HR user IDs.
- [ ] Define editable and read-only profile fields.
- [ ] Confirm notification-delivery capabilities.
- [ ] Decide password and active-session presentation.

### Phase 1 — Routing

- [ ] Add /hr/account and /hr/settings.
- [ ] Add /hr/profile redirect.
- [ ] Create portalRoutes.
- [ ] Update all Topbar account and settings actions.
- [ ] Test direct entry, refresh, unauthorized access, and role switching.

### Phase 2 — Account Role Model

- [ ] Create AccountRolePresentation.
- [ ] Add hr_staff configuration.
- [ ] Remove Student fallback behavior for HR.
- [ ] Source identity from AuthContext.
- [ ] Render authoritative and self-service fields separately.

### Phase 3 — Profile Persistence

- [ ] Create model, controller, and hook if local persistence is approved.
- [ ] Validate and sanitize approved fields.
- [ ] Add loading, saving, success, and failure states.
- [ ] Preserve cancel and reset behavior.
- [ ] Add profile tests.

### Phase 4 — Settings

- [ ] Add HR notification definitions.
- [ ] Create user-scoped preference persistence.
- [ ] Integrate useTheme.
- [ ] Add reset-to-defaults.
- [ ] Remove duplicated profile form.
- [ ] Add switch accessibility.

### Phase 5 — Security Presentation

- [ ] Hide or mark unsupported password change.
- [ ] Hide or mark unsupported active sessions.
- [ ] If services exist, integrate them through controllers and hooks.
- [ ] Ensure no credential values enter local storage or logs.

### Phase 6 — UI and Verification

- [ ] Apply 12px radius and flat-border styling.
- [ ] Remove heavy shadows and oversized cards.
- [ ] Test responsive layouts and dark mode.
- [ ] Run production build.
- [ ] Run targeted lint.
- [ ] Complete keyboard and screen-reader checks.

## 17. Automated Verification

Add tests for:

- hr_staff route protection;
- portal route resolution for all role contexts;
- unknown-role fallback;
- HR identity not merging with Student defaults;
- editable-field restrictions;
- profile validation and persistence failure;
- user-scoped preference isolation;
- notification defaults and reset;
- theme integration;
- unsupported security feature presentation;
- no password persistence;
- switch semantics and keyboard interaction.

Run separately:

    npm run build
    npm run lint

The Vite build command does not run linting.

## 18. Manual Acceptance Tests

1. Sign in as HR and open My Profile from Topbar.
2. Confirm /hr/account loads under the HR LayoutShell.
3. Confirm the authenticated HR identity appears without Student labels.
4. Verify employee ID, designation, office, role, and institutional email are read-only.
5. Edit an approved contact field and verify confirmed persistence.
6. Cancel an edit and verify the last saved values return.
7. Open Settings from both Topbar locations.
8. Confirm /hr/settings displays HR notifications, appearance, and portal preferences only.
9. Toggle preferences, reload, and verify user-scoped persistence.
10. Switch Light and Dark themes and verify no duplicate theme state.
11. Sign in as another user and verify preferences and profile overrides do not leak.
12. Verify password and active-session actions are not falsely functional.
13. Test direct URL refresh and unauthorized access.
14. Test narrow width, dark mode, keyboard navigation, switch semantics, and focus restoration.

## 19. Acceptance Criteria

- HR account and settings routes exist and are protected by HR role authorization.
- Topbar resolves HR destinations from authenticated role context.
- HR users never receive Student default data or labels.
- Shared pages do not hard-code Director Evelyn Tan as every HR user.
- Profile editing is not duplicated in Settings.
- Authoritative HR identity and assignment fields remain read-only.
- Approved profile and preference changes persist per user or clearly remain unavailable.
- Theme uses useTheme as its only state source.
- Unsupported password and session features are not represented as operational.
- Password values never enter local storage or audit logs.
- Controls meet keyboard, focus, label, and switch accessibility requirements.
- UI follows the 12px radius, flat-border, low-shadow constraints.
- The production build succeeds and modified files introduce no new lint errors.

## 20. Future Backend Phase

Replace local prototype persistence with authenticated services for:

- profile contact updates;
- notification preference delivery;
- password verification and change;
- active-session listing and revocation;
- server-side authorization;
- audit events;
- validation and rate limiting;
- conflict handling and optimistic concurrency.
