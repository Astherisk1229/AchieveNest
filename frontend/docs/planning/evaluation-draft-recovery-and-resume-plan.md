# Unfinished Evaluation Draft Recovery and Resume System — Implementation Plan

## Implementation Status

**Status:** Proposed  
**Target:** AchieveNest frontend prototype  
**Persistence:** Browser local storage, same browser and device only  
**Delivery strategy:** Shared foundation followed by one role integration at a time

## User Review Required

> [!IMPORTANT]
> Confirm the following product decisions before implementation begins:
>
> 1. **One active draft per evaluator:** An evaluator may pause the current draft before opening another evaluation.
> 2. **Pause versus discard:** Save and Pause retains work; Discard Draft permanently removes it and requires confirmation.
> 3. **Paused-draft access:** Each evaluator workspace needs a visible way to reopen paused drafts.
> 4. **Shared-device policy:** Decide whether drafts remain stored after logout or are removed for privacy.
> 5. **Local-only limitation:** This phase does not provide cross-device recovery or a true multi-user record lock.

## Change Manifest

| Change | File | Purpose |
| :--- | :--- | :--- |
| NEW | src/models/EvaluationDraftModel.js | Own draft schema, validation, serialization, and transitions. |
| NEW | src/controllers/EvaluationSessionController.js | Manage persistence, ownership, revisions, lifecycle actions, and browser events. |
| NEW | src/hooks/useEvaluationDraft.js | Bridge role views to the controller and manage debounce, heartbeat, and subscriptions. |
| NEW | src/components/common/UnfinishedEvaluationAlertBanner.jsx | Present the active-draft reminder and safe actions. |
| NEW | src/components/common/UnfinishedEvaluationGuardModal.jsx | Prevent accidental switching while another draft is active. |
| NEW | src/components/common/DiscardEvaluationDraftModal.jsx | Confirm permanent local draft deletion. |
| MODIFY | src/pages/hr-admin/HRDashboardPage.jsx | Mount HR draft status UI once at the evaluator portal level. |
| MODIFY | src/pages/hr-admin/HREvaluationSubmissionsPage.jsx | Start, resume, pause, and complete HR drafts. |
| MODIFY | src/pages/hr-admin/evaluation-submissions/evaluation/PortfolioEvaluationStudio.jsx | Capture and restore supported HR evaluation inputs. |
| MODIFY | src/pages/personnel/department-secretary/DepSecDashboardPage.jsx | Mount Secretary recovery UI and coordinate resume routing. |
| MODIFY | src/pages/personnel/department-secretary/DepSecEvaluatorWorkbench.jsx | Capture and restore Secretary workbench state. |
| MODIFY | src/hooks/useDepSecVerification.js | Connect Secretary domain actions to draft lifecycle events. |
| MODIFY | src/pages/personnel/program-coordinator/CoordinatorDashboardPage.jsx | Mount Coordinator recovery UI and restore the workspace target. |
| MODIFY | src/pages/personnel/program-coordinator/tabs/CoordinatorQueueTab.jsx | Guard attempts to open a second Student evaluation. |
| MODIFY | src/hooks/useVerification.js | Connect Coordinator decisions to draft lifecycle events. |

Explicitly excluded:

- HRPersonnelDirectoryPage;
- OrgModeratorDashboardPage;
- OSADAccountsTab; and
- any Organization Moderator or OSAD account-management workflow.

## 1. Objective

Implement a shared draft-recovery workflow for the three roles that evaluate or verify submissions:

- HR Staff;
- Department Secretary; and
- Program Coordinator.

If an evaluator refreshes the page, closes the browser, loses the session unexpectedly, or navigates away, AchieveNest preserves the latest draft and offers a safe way to resume it.

This phase uses browser local storage because the current frontend is local-storage based. It provides recovery on the same browser and device only. It is not a server-enforced multi-user lock.

## 2. Correct Role Integration

| Role | Evaluation scope | Integration point |
| :--- | :--- | :--- |
| HR Staff | HR evaluation submissions and personnel cases routed directly to HR | HRDashboardPage and HREvaluationSubmissionsPage |
| Department Secretary | Personnel submissions within the Secretary's assigned College | DepSecDashboardPage, DepSecEvaluatorWorkbench, and useDepSecVerification |
| Program Coordinator | Student submissions from programs under the Coordinator's assigned Department | CoordinatorDashboardPage and useVerification |

Organization Moderator and OSAD account-management screens are excluded. Organization Moderators manage events, attendance, and certificates; they do not verify achievements.

## 3. Terminology and Scope

Use Active Evaluation Draft rather than Active Evaluation Lock for this frontend-only phase.

Local storage can coordinate tabs in one browser, but it cannot prevent a different evaluator, browser, or device from opening the same submission. A true institutional lock requires a backend record with ownership, expiry, heartbeat, and concurrency control.

Current guarantees:

- one active evaluation draft per evaluator identity in the same browser profile;
- recovery after refresh, navigation, or browser closure;
- same-browser tab synchronization;
- prevention of accidentally opening a second evaluation in the same client session; and
- explicit completion, pause, and discard transitions.

Current non-guarantees:

- cross-device recovery;
- cross-browser recovery;
- multi-user exclusion;
- secure storage of sensitive evidence; and
- guaranteed final writes during browser shutdown.

## 4. User Decisions

### Resume Evaluation

Opens the original evaluation workspace and restores the last saved scores, criterion decisions, remarks, selected section, and other supported draft fields.

### Save and Pause

Changes the active draft to PAUSED, removes the single-active-evaluation guard, and returns the submission to its normal pending queue state. The draft remains available for later recovery from a paused-drafts entry point.

### Discard Draft

Permanently deletes the local draft after explicit confirmation. This action is separate from Save and Pause because pausing must not silently destroy work.

### Complete Evaluation

Deletes the active draft only after the actual finalization operation succeeds. Opening a confirmation modal or attempting a failed submission must not clear recovery data.

## 5. State Model

    ACTIVE
      → PAUSED
      → COMPLETED
      → DISCARDED

Allowed transitions:

| Current state | Action | Next state |
| :--- | :--- | :--- |
| None | Start evaluation | ACTIVE |
| ACTIVE | Auto-save | ACTIVE |
| ACTIVE | Resume | ACTIVE |
| ACTIVE | Save and pause | PAUSED |
| ACTIVE | Finalization succeeds | COMPLETED, then remove draft |
| ACTIVE | Discard confirmed | DISCARDED, then remove draft |
| PAUSED | Resume | ACTIVE |
| PAUSED | Discard confirmed | DISCARDED, then remove draft |

Unexpected tab closure does not create a new transition. The last successfully saved ACTIVE record remains recoverable.

## 6. Storage Design

### Storage Key

Use a versioned key:

    achievenest_evaluation_drafts_v1

Store records by evaluator identity rather than one global unscoped value. At minimum, identity must include:

- evaluator ID;
- evaluator role; and
- institution or tenant identifier if the application later supports multiple institutions.

Never show or restore a draft unless the currently authenticated evaluator ID and role match the stored ownership fields.

### Draft Record

Each draft should include:

| Field | Purpose |
| :--- | :--- |
| schemaVersion | Supports future migration. |
| draftId | Stable draft identity. |
| evaluatorId | Prevents another signed-in account from restoring it. |
| evaluatorRole | Confirms the correct evaluator workspace. |
| targetType | Portfolio, achievement, or evaluation-submission type. |
| targetId | Stable reviewed-record identifier. |
| targetOwnerId | Student or Personnel identifier. |
| targetLabel | Safe display label for the banner. |
| routeDescriptor | Role-specific resume destination without storing arbitrary URLs. |
| status | ACTIVE or PAUSED. |
| startedAt | Initial start timestamp. |
| updatedAt | Most recent successful save. |
| heartbeatAt | Most recent active-session heartbeat. |
| draftVersion | Monotonic revision used for tab conflict resolution. |
| draftData | Whitelisted partial evaluation inputs. |

Draft data should contain only editable evaluator inputs needed for recovery. Do not duplicate uploaded evidence files, document contents, passwords, access tokens, or unnecessary personal information in local storage.

### Corrupt and Legacy Data

The controller must validate parsed storage data. Invalid JSON, missing ownership fields, unsupported schema versions, or missing target IDs should be quarantined or removed without crashing the workspace.

## 7. Core Architecture

### New Model: EvaluationDraftModel.js

Location:

    src/models/EvaluationDraftModel.js

Responsibilities:

- define the draft schema;
- validate evaluator and target identity;
- normalize timestamps and status;
- whitelist supported draft fields;
- serialize safe storage data; and
- reject invalid transitions.

This keeps domain validation out of React components and follows the project's OOP/MVC rules.

### New Controller: EvaluationSessionController.js

Location:

    src/controllers/EvaluationSessionController.js

Recommended API:

- startEvaluation(context, initialDraft);
- saveDraft(evaluatorContext, draftId, patch);
- getActiveDraft(evaluatorContext);
- getPausedDrafts(evaluatorContext);
- resumeDraft(evaluatorContext, draftId);
- pauseDraft(evaluatorContext, draftId);
- completeDraft(evaluatorContext, draftId);
- discardDraft(evaluatorContext, draftId);
- subscribe(listener);
- dispose().

Controller responsibilities:

- read and validate versioned storage;
- enforce one ACTIVE draft per evaluator in this client;
- use stable IDs rather than names for matching;
- merge only whitelisted draft fields;
- increment draftVersion on every save;
- update timestamps;
- coordinate same-tab and cross-tab updates;
- report storage quota or parsing errors; and
- never silently overwrite a newer revision.

### New Hook: useEvaluationDraft.js

Location:

    src/hooks/useEvaluationDraft.js

Responsibilities:

- bridge views to EvaluationSessionController;
- expose active and paused draft state;
- debounce saves after editable state changes;
- trigger a periodic heartbeat while the workspace is active;
- cancel timers and subscriptions on unmount;
- expose start, resume, pause, complete, and discard actions; and
- surface save status such as Saving, Saved, or Save failed.

Views should not write directly to localStorage.

## 8. Auto-Save Strategy

Use state-change auto-save as the primary mechanism:

- debounce editable changes by approximately 500 to 1,000 milliseconds;
- save immediately after significant actions such as changing the reviewed criterion;
- maintain a lightweight heartbeat every 15 to 30 seconds while ACTIVE; and
- flush the current in-memory draft on controlled navigation when possible.

Do not depend on beforeunload as the primary save mechanism. Browsers may skip or severely restrict asynchronous shutdown work.

Avoid saving on every keystroke without debouncing. Excessive synchronous local-storage writes can block the UI.

## 9. Browser and Tab Synchronization

The browser storage event fires in other tabs, not in the tab that performed the write.

Use both:

- a named CustomEvent for updates within the current tab; and
- the native storage event for updates from other tabs.

Recommended application event name:

    achievenest:evaluation-drafts-changed

When two tabs edit the same draft:

- compare draftVersion and updatedAt;
- accept only the newer revision;
- warn the older tab before it overwrites anything; and
- offer Reload latest draft rather than silently merging conflicting scoring decisions.

## 10. Shared UI Components

### UnfinishedEvaluationAlertBanner.jsx

Location:

    src/components/common/UnfinishedEvaluationAlertBanner.jsx

Display only when the current evaluator has an ACTIVE draft.

Content:

- Unfinished evaluation heading;
- target label;
- role-appropriate evaluation type;
- Last saved time rather than continuously increasing elapsed time;
- Resume Evaluation;
- Save and Pause; and
- an accessible link or menu action for Discard Draft.

The banner should remain visible near the top of the evaluator workspace but must not cover navigation or evaluation controls.

### UnfinishedEvaluationGuardModal.jsx

Location:

    src/components/common/UnfinishedEvaluationGuardModal.jsx

Display when the evaluator attempts to open a different target while another ACTIVE draft exists.

Actions:

- Resume Current Evaluation;
- Save Current and Open New Evaluation; and
- Cancel.

Discard must not be the default action and should require separate confirmation.

### DiscardEvaluationDraftModal.jsx

Location:

    src/components/common/DiscardEvaluationDraftModal.jsx

Provides explicit destructive-action confirmation and identifies which local draft will be removed.

## 11. Role Integrations

### HR Staff

Primary files:

- src/pages/hr-admin/HRDashboardPage.jsx;
- src/pages/hr-admin/HREvaluationSubmissionsPage.jsx; and
- src/pages/hr-admin/evaluation-submissions/evaluation/PortfolioEvaluationStudio.jsx.

Integration:

- mount the banner once in the HR evaluator portal shell or HRDashboardPage;
- start a draft immediately before the evaluation studio opens;
- map score, criterion, evidence-check, and remark changes to whitelisted draft fields;
- restore the selected submission and evaluation studio state on Resume; and
- call completeDraft only after final verification succeeds.

HRPersonnelDirectoryPage is not an evaluation workspace and should not independently own draft recovery.

### Department Secretary

Primary files:

- src/pages/personnel/department-secretary/DepSecDashboardPage.jsx;
- src/pages/personnel/department-secretary/DepSecEvaluatorWorkbench.jsx; and
- src/hooks/useDepSecVerification.js.

Integration:

- scope eligible submissions by the Secretary's assigned College;
- start or guard the draft when a Personnel portfolio is selected for evaluation;
- auto-save verified points, proof checks, remarks, active area, and selected evidence;
- restore the exact workbench target and active area; and
- clear the draft only after the Secretary's final action succeeds.

The existing code currently uses department-oriented identifiers in places. Draft identity must follow the approved College-based Department Secretary scope and should not deepen that terminology mismatch.

### Program Coordinator

Primary files:

- src/pages/personnel/program-coordinator/CoordinatorDashboardPage.jsx;
- src/pages/personnel/program-coordinator/tabs/CoordinatorQueueTab.jsx; and
- src/hooks/useVerification.js.

Integration:

- scope the Coordinator to their assigned Department;
- resolve eligible students through each student's Degree Program and its parent Department;
- start or guard the draft when opening a Student achievement;
- auto-save the decision, remarks, evidence inspection state, and selected submission;
- restore the correct workspace panel on Resume; and
- clear the draft only after approval, rejection, or changes-requested processing succeeds.

Do not integrate this workflow into OrgModeratorDashboardPage or OSADAccountsTab.

## 12. Resume Routing

Do not store and execute arbitrary redirect URLs from local storage.

Store a validated routeDescriptor containing:

- role workspace key;
- target type;
- target ID;
- optional active panel or section key; and
- optional return queue filter.

On Resume:

1. validate evaluator ownership;
2. confirm the target still exists;
3. confirm the evaluator is still authorized for the target;
4. load the current canonical submission;
5. overlay the whitelisted local draft fields;
6. navigate through the application's approved route map; and
7. show a warning if the underlying submission changed after updatedAt.

If the target was finalized, deleted, reassigned, or is no longer accessible, do not restore it. Explain the reason and offer to discard the stale local draft.

## 13. Security and Shared-Device Handling

- Namespace drafts by evaluator ID and role.
- Never restore a draft for a different authenticated account.
- Never store credentials, access tokens, evidence files, or full protected documents.
- Clear in-memory draft state on logout.
- On account switch, hide unmatched drafts and do not expose their labels.
- Decide with stakeholders whether local drafts persist after logout on shared institutional computers.
- If persistence after logout is required, a backend draft service is preferable to sensitive local storage.

## 14. Failure Handling

### Storage Failure

If local storage is unavailable, full, or corrupt:

- keep the evaluation usable;
- show Save failed locally;
- retry only when data changes or the evaluator requests it;
- do not claim the draft is saved; and
- warn before controlled navigation.

### Finalization Failure

If the domain finalization action fails:

- keep the draft ACTIVE;
- retain all local edits;
- display the original error; and
- allow retry.

### Underlying Submission Change

If the submission changed since the draft started:

- show that newer canonical data exists;
- do not silently overwrite it;
- preserve the local draft;
- require the evaluator to reload or reconcile; and
- reserve field-level merging for a later backend-supported phase.

## 15. Phased Implementation

### Phase 0 — Confirm Decisions and Inventory State

**Goal:** Freeze behavior and identify every field that must survive recovery.

Tasks:

- [ ] Confirm all decisions in User Review Required.
- [ ] Inventory editable HR evaluation state.
- [ ] Inventory editable Department Secretary workbench state.
- [ ] Inventory editable Program Coordinator verification state.
- [ ] Identify the canonical target ID and evaluator ID used by each role.
- [ ] Document which final actions mean completion for each role.
- [ ] Confirm where paused drafts will be listed.
- [ ] Define the shared-device logout policy.

Exit criteria:

- Every persisted field is explicitly whitelisted.
- Each role has a stable evaluator ID, target ID, resume destination, and completion event.
- No uploaded file, credential, token, or full evidence document is included in draft data.

### Phase 1 — Domain Model and Storage Controller

**Goal:** Build and test the recovery engine without role-specific UI.

Tasks:

- [ ] Create EvaluationDraftModel with schema version 1.
- [ ] Implement ownership validation and allowed state transitions.
- [ ] Implement safe serialization and draft-data whitelisting.
- [ ] Create EvaluationSessionController.
- [ ] Implement versioned storage reads and writes.
- [ ] Enforce one ACTIVE draft per evaluator identity.
- [ ] Implement start, save, pause, resume, complete, and discard.
- [ ] Implement monotonic draftVersion handling.
- [ ] Add corrupt-data and storage-quota handling.
- [ ] Add same-tab CustomEvent and cross-tab storage event support.
- [ ] Add controller unit tests.

Exit criteria:

- Controller tests pass for ownership, transitions, version conflicts, invalid storage, and all lifecycle actions.
- The controller never exposes a draft to a different evaluator identity.

### Phase 2 — Shared Hook and UI

**Goal:** Provide a reusable interface for all evaluator roles.

Tasks:

- [ ] Create useEvaluationDraft.
- [ ] Add 500–1,000 ms debounced saving.
- [ ] Add a 15–30 second ACTIVE heartbeat.
- [ ] Expose Saving, Saved, and Save failed states.
- [ ] Clean up timers and subscriptions on unmount.
- [ ] Build UnfinishedEvaluationAlertBanner.
- [ ] Build UnfinishedEvaluationGuardModal.
- [ ] Build DiscardEvaluationDraftModal.
- [ ] Add keyboard focus management and accessible labels.
- [ ] Add component tests for all actions and error states.

Exit criteria:

- Components operate against a mocked controller without role-specific logic.
- Destructive deletion always requires confirmation.
- Save failures are visible and never reported as successful.

### Phase 3 — HR Pilot Integration

**Goal:** Prove the full workflow in one evaluation role before reuse.

Tasks:

- [ ] Mount the banner once in the HR evaluator portal.
- [ ] Start or guard a draft before opening PortfolioEvaluationStudio.
- [ ] Map HR scores, criteria, checks, remarks, and active panel to draftData.
- [ ] Restore the selected submission and exact supported inputs.
- [ ] Add Save and Pause behavior.
- [ ] Add paused-draft access.
- [ ] Complete the draft only after final verification succeeds.
- [ ] Retain the ACTIVE draft when finalization fails.
- [ ] Test refresh, close/reopen, navigation, and two-tab conflicts.

Exit criteria:

- HR passes all applicable acceptance tests.
- No regression occurs in the evaluation queue or finalization flow.

### Phase 4 — Department Secretary Integration

**Goal:** Apply the proven shared workflow to College-based Personnel evaluation.

Tasks:

- [ ] Mount the banner in DepSecDashboardPage.
- [ ] Guard target changes in the evaluation workbench.
- [ ] Persist verified points, proof checks, remarks, active area, and selected evidence reference.
- [ ] Restore the exact Personnel target and workbench area.
- [ ] Enforce current-user ownership and College-based authorization.
- [ ] Complete the draft only after the Secretary action succeeds.
- [ ] Add role-specific integration tests.

Exit criteria:

- Department Secretary recovery passes all applicable acceptance tests.
- Draft identity does not depend on ambiguous department display names.

### Phase 5 — Program Coordinator Integration

**Goal:** Apply recovery to Department-scoped Student verification.

Tasks:

- [ ] Mount the banner in CoordinatorDashboardPage.
- [ ] Guard opening a different Student submission in CoordinatorQueueTab.
- [ ] Persist decision, remarks, evidence-inspection state, and selected submission.
- [ ] Restore the correct Student and verification panel.
- [ ] Verify the Student's Program belongs to the Coordinator's assigned Department.
- [ ] Complete the draft only after approve, reject, or changes-requested succeeds.
- [ ] Add role-specific integration tests.

Exit criteria:

- Program Coordinator recovery passes all applicable acceptance tests.
- No recovery UI appears in Organization Moderator or OSAD pages.

### Phase 6 — Hardening and Release

**Goal:** Verify failures, privacy boundaries, and regressions before release.

Tasks:

- [ ] Test invalid and unsupported storage schemas.
- [ ] Test storage quota and unavailable-storage behavior.
- [ ] Test logout and account switching.
- [ ] Test stale, deleted, finalized, and reassigned targets.
- [ ] Test revision conflicts across two browser tabs.
- [ ] Verify controlled navigation warnings when Save failed.
- [ ] Run the production build.
- [ ] Run lint and isolate pre-existing findings from new findings.
- [ ] Complete the full manual test matrix for all roles.
- [ ] Document the local-only recovery limitation for users and maintainers.

Exit criteria:

- All acceptance criteria are satisfied.
- The production build succeeds.
- No new lint errors are introduced.
- Known limitations are documented.

## 15.1 Dependencies

- Stable evaluator IDs for all three roles.
- Stable target IDs for portfolios, submissions, and achievements.
- A current-user context that exposes evaluator ID and role.
- Role-specific navigation functions capable of restoring a target by ID.
- A confirmed paused-drafts entry point.
- Agreement on logout retention for shared computers.

## 15.2 Delivery and Rollback Strategy

- Deliver the shared controller behind an internal feature flag if the project supports flags.
- Enable HR first and verify it before enabling the other roles.
- Keep existing evaluation state behavior intact until a role integration is validated.
- If a role integration causes recovery or navigation issues, disable that role's draft UI without deleting stored data.
- Do not migrate local drafts destructively during rollback; unsupported schema data may be ignored until the feature is restored.

## 16. Automated Verification

Add unit tests for:

- model validation and serialization;
- state transitions;
- evaluator ownership enforcement;
- one-ACTIVE-draft rule;
- legacy and corrupt storage;
- timestamp and revision conflict handling;
- pause, resume, complete, and discard;
- finalization failure retaining the draft; and
- storage-event and CustomEvent subscriptions.

Add component tests for:

- banner visibility and actions;
- guard behavior when opening a different target;
- discard confirmation;
- restore of exact editable state; and
- inaccessible or stale target handling.

Run from frontend:

    npm run build
    npm run lint

If a test command is added or already available, run it separately. The build command does not guarantee lint or test execution.

## 17. Manual Acceptance Tests

Run every applicable scenario as HR Staff, Department Secretary, and Program Coordinator.

1. Enter partial scores and remarks, refresh, and restore the exact draft.
2. Close and reopen the browser on the same device and resume.
3. Navigate away through the application and confirm the draft remains.
4. Attempt a second evaluation and verify the guard modal.
5. Save and pause, then confirm another evaluation can begin.
6. Resume a paused draft from the paused-drafts entry point.
7. Discard a draft and verify confirmation is required.
8. Fail finalization and verify the draft remains ACTIVE.
9. Finalize successfully and verify the draft is removed.
10. Open two tabs and verify newer revisions are not overwritten silently.
11. Sign in as another account and verify the first evaluator's draft is not disclosed.
12. Corrupt the storage value and verify the portal still loads.
13. Simulate storage quota failure and verify Save failed is shown.
14. Remove or finalize the target externally and verify stale-draft handling.
15. Confirm Organization Moderator and OSAD pages show no evaluation-recovery UI.

## 18. Acceptance Criteria

- Draft recovery works for HR Staff, Department Secretary, and Program Coordinator on the same browser and device.
- Draft ownership is enforced by evaluator ID and role.
- Only one draft may be ACTIVE per evaluator in the current client.
- Editable state is debounced and saved without noticeable typing lag.
- The banner reports the last successful save accurately.
- Starting a different evaluation invokes the guard.
- Pause retains work while releasing the active constraint.
- Discard is explicit and confirmed.
- Successful finalization removes the draft; failed finalization does not.
- Same-tab and cross-tab updates are handled correctly.
- Legacy, corrupt, stale, and unavailable storage conditions do not crash the workspace.
- Role routing matches the approved ownership model.
- The production build succeeds, and new lint errors are not introduced.

## 19. Future Backend Phase

When backend persistence is available, replace the client-only active-draft constraint with a server-side lease:

- evaluator and target ownership;
- acquired-at and expires-at timestamps;
- heartbeat renewal;
- optimistic version or ETag;
- administrative override;
- stale-lock recovery; and
- cross-device draft storage.

The shared model, controller API, hook, and UI states should be designed so the storage adapter can later change without rewriting role views.
