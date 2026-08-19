# Personnel Onboarding Stepper Completion and Draft Recovery — Implementation Plan

## Status

**Status:** Proposed  
**Module:** HR Personnel Directory  
**Primary workflow:** Onboard Personnel  
**Persistence:** Browser local storage, same browser and device only

## 1. Objective

Refine the four-step Personnel onboarding workflow so HR must review all required information before either creating an account or saving a pending-placement record.

Protect non-sensitive form input from refreshes, accidental modal closure, navigation, and browser interruption by storing a recoverable local draft.

## 2. Current-State Findings

The existing OnboardPersonnelModal already includes:

- four step panels;
- validation functions for Steps 1, 2, and 3;
- Continue actions inside the first three step panels;
- a Review and Confirmation panel at Step 4; and
- full revalidation inside the final account-creation handler.

The primary gating defect is:

- Save as Pending Placement is rendered in the global footer on every step.

The current submission flow also calls onSubmit inside a timer, then closes the modal without waiting for the parent operation to succeed. Draft deletion must not use that behavior because a failed creation could lose recoverable input.

## 3. User Review Required

> [!IMPORTANT]
> Confirm these product decisions before implementation:
>
> 1. **Submission location:** Both final actions appear only on Step 4.
> 2. **Pending-placement requirements:** This plan assumes all three input steps must validate before Save as Pending Placement. If pending placement is intentionally identity-only, that action conflicts with mandatory four-step completion and must be specified separately.
> 3. **Normal cancellation:** Closing through Cancel, the X button, backdrop click, Escape, navigation, or refresh retains the draft.
> 4. **Permanent deletion:** Start Fresh and Discard Draft require confirmation when meaningful input exists.
> 5. **Temporary passkey:** Temporary passkeys and delivery acknowledgements are never written to local storage. They must be re-entered after recovery.
> 6. **Shared-device retention:** Decide whether drafts are cleared on logout or retained for the same HR account.

## 4. Approved Stepper Flow

    Step 1: Identity
      → Validate Step 1
      → Continue

    Step 2: Employment Placement
      → Validate Step 2
      → Continue

    Step 3: Base Account Access
      → Validate Step 3
      → Continue

    Step 4: Review and Confirmation
      → Save as Pending Placement
      OR
      → Create Account and Send Invitation

Steps 1–3 must never display a submission action. Their only primary forward action is Continue.

The Back or editable step headers may return to an earlier completed step. Returning to an earlier step invalidates completion for that step and every later step until validation succeeds again.

## 5. Change Manifest

| Change | File | Purpose |
| :--- | :--- | :--- |
| NEW | src/models/PersonnelOnboardingDraftModel.js | Define safe draft schema, validation, sanitization, and serialization. |
| NEW | src/controllers/PersonnelOnboardingDraftController.js | Read, save, clear, validate, and scope drafts by HR identity. |
| NEW | src/hooks/usePersonnelOnboardingDraft.js | Bridge the modal to debounced persistence and recovery state. |
| NEW | src/pages/hr-admin/personnel-directory/OnboardingDraftRecoveryBanner.jsx | Present Resume Draft and Start Fresh actions. |
| NEW | src/pages/hr-admin/personnel-directory/DiscardOnboardingDraftModal.jsx | Confirm destructive draft removal. |
| MODIFY | src/pages/hr-admin/personnel-directory/OnboardPersonnelModal.jsx | Gate actions, serialize form state, restore drafts, and await submission. |
| MODIFY | src/pages/hr-admin/HRPersonnelDirectoryPage.jsx | Pass stable HR identity and return a successful creation result. |
| VERIFY | src/hooks/useHR.js and src/controllers/HRController.js | Ensure account creation returns the created record or throws on failure. |

If the team prefers a smaller first release, the model, controller, and hook may be implemented in the same module temporarily, but React views must not own raw local-storage parsing and validation.

## 6. Draft Storage Design

### Storage Key

Use:

    achievenest_personnel_onboarding_drafts_v1

Use one canonical spelling everywhere. Do not mix onboarding_modal and onboard_modal keys.

### Ownership

Namespace each draft using:

- HR evaluator account ID;
- role;
- institution ID if available; and
- schema version.

The modal currently receives no current-user identity. Add an evaluatorContext or draftOwnerKey prop from HRPersonnelDirectoryPage.

Never display a stored draft or its personnel name to a different signed-in account.

### Draft Schema

Store:

| Field | Purpose |
| :--- | :--- |
| schemaVersion | Enables future migrations. |
| ownerKey | Scopes the draft to the HR account. |
| draftId | Stable local draft identifier. |
| createdAt | First meaningful edit time. |
| updatedAt | Last successful local save. |
| activeStep | Last open step, clamped to 1–4. |
| completedSteps | Informational progress only; revalidate after restore. |
| identity | Safe Step 1 fields. |
| employment | Safe Step 2 fields. |
| account | Safe Step 3 activation option only. |

Do not store:

- tempPassword;
- tempPasswordAck;
- credentials or tokens;
- invitation secrets;
- server-generated activation links; or
- validation errors.

After restoring temporary-passkey mode, show a message that the passkey must be re-entered and reset its acknowledgement to false.

### Expiry

Set a defined retention period, recommended at seven days. Expired drafts should be removed without being offered for recovery.

## 7. Draft Model and Controller

### PersonnelOnboardingDraftModel

Responsibilities:

- validate schema version and owner identity;
- whitelist known form fields;
- clamp activeStep to 1–4;
- normalize completedSteps into an array;
- remove sensitive values;
- validate timestamps;
- determine whether the draft contains meaningful user input; and
- serialize safe data.

### PersonnelOnboardingDraftController

Recommended API:

- getDraft(ownerContext);
- saveDraft(ownerContext, formSnapshot);
- clearDraft(ownerContext);
- hasRecoverableDraft(ownerContext);
- isExpired(draft);
- subscribe(listener);
- dispose().

Responsibilities:

- parse storage defensively;
- isolate drafts by HR owner identity;
- debounce-friendly synchronous saves;
- handle unavailable, corrupt, or full storage;
- dispatch a same-tab CustomEvent;
- listen for cross-tab storage events; and
- never report Saved if storage failed.

## 8. Recovery Hook

Create usePersonnelOnboardingDraft with:

- recoverableDraft;
- recoveryDecisionPending;
- draftSaveStatus;
- resumeDraft();
- startFresh();
- saveSnapshot();
- clearDraft(); and
- storageError.

Auto-save strategy:

- wait until the modal is open;
- save only after a meaningful field differs from defaults;
- debounce field changes by approximately 500–1,000 ms;
- save immediately on controlled close when possible;
- avoid saving validation errors and generated display-only data; and
- clean up timers and subscriptions on unmount.

Do not depend on beforeunload for the main save path. Browser shutdown hooks are best effort only.

## 9. Recovery User Experience

### On Modal Open

If no valid draft exists:

- initialize a fresh form;
- begin at Step 1; and
- do not show the recovery banner.

If a valid draft exists:

- do not silently overwrite the fresh form;
- show a recovery banner or decision panel;
- display the last saved time;
- disable editing until HR chooses Resume Draft or Start Fresh.

### Resume Draft

On Resume:

1. verify owner identity;
2. restore whitelisted fields;
3. reset all sensitive Step 3 values;
4. restore activeStep only up to the last valid step;
5. re-run step validation silently;
6. reconstruct completedSteps from validation results;
7. clear stale errors; and
8. focus the first relevant field.

Do not trust stored completedSteps as proof that a step remains valid.

### Start Fresh

If meaningful draft data exists:

- show DiscardOnboardingDraftModal;
- identify the last saved time;
- require explicit confirmation;
- clear the stored draft;
- reset all modal fields and progress; and
- generate a new employee ID once.

Do not regenerate the employee ID on every render.

## 10. Stepper Gating

### Steps 1–3

Keep the existing inline Continue actions and current validation functions.

On Continue:

1. validate the current step;
2. focus the first invalid field when validation fails;
3. mark the step complete only when valid;
4. advance exactly one step; and
5. save the updated progress snapshot.

### Editing a Completed Step

When HR opens an earlier step for editing:

- remove that step and all later steps from completedSteps;
- prevent Step 4 access until affected steps validate again; and
- continue auto-saving field data.

### Step 4

Render both submission actions only when:

- activeStep equals 4;
- Steps 1, 2, and 3 are currently complete; and
- isSubmitting is false.

Before either action runs, revalidate all required steps in order. If a step fails, return to the first invalid step.

## 11. Submission Semantics

### Build Payloads

Extract payload construction into pure helper functions or the appropriate controller:

- buildPendingPlacementPayload(formState);
- buildCreateAndInvitePayload(formState).

This removes duplicated normalization logic from the two handlers.

### Await the Parent

Both handlers must await the result:

    const result = await Promise.resolve(onSubmit(payload))

On success:

- clear the stored draft;
- reset modal state;
- set isSubmitting to false;
- close the modal; and
- allow the parent to show its existing success toast.

On failure:

- retain the draft;
- keep the modal open;
- set isSubmitting to false;
- show or propagate the error;
- keep HR on the relevant step; and
- permit retry.

Remove artificial setTimeout wrappers from submission control. Visual loading feedback should follow the actual promise lifecycle.

### Success Contract

HRPersonnelDirectoryPage, useHR, and HRController should return the created record or an explicit successful result. Undefined return values must not be interpreted as confirmed success unless that contract is intentionally documented.

## 12. Close Behavior

Route backdrop click, X, Cancel, Escape, and controlled navigation through one requestClose function.

If the form is pristine:

- close immediately.

If the form contains meaningful input:

- flush the debounced snapshot;
- close while retaining the draft; and
- show the recovery choice next time.

Optional enhancement:

- show Saved as draft before closing on deliberate Cancel.

Do not use a generic browser confirmation dialog unless a local save has failed. If saving failed, warn HR that closing may lose entered data.

## 13. Accessibility and UI Requirements

- Use text and an existing icon rather than an emoji in the recovery banner.
- Announce draft restoration and save failure through an aria-live region.
- Move focus into the recovery decision panel when it appears.
- Return focus to the onboarding trigger after close.
- Ensure Continue labels identify the next step where space allows.
- Disable submission controls while the real operation is pending.
- Preserve keyboard access to step headers and modal actions.
- Do not allow backdrop clicks to close through the modal content.

## 14. Implementation Phases

### Phase 0 — Confirm Behavior

- [ ] Decide whether pending placement requires all three input steps.
- [ ] Confirm logout retention policy.
- [ ] Define success and failure return contracts.
- [ ] Confirm draft expiry.
- [ ] Identify the stable HR owner ID.

### Phase 1 — Draft Foundation

- [ ] Create PersonnelOnboardingDraftModel.
- [ ] Create PersonnelOnboardingDraftController.
- [ ] Add schema validation and sensitive-field stripping.
- [ ] Add owner scoping and expiry.
- [ ] Add corrupt and unavailable-storage handling.
- [ ] Add focused unit tests.

### Phase 2 — Recovery Hook and UI

- [ ] Create usePersonnelOnboardingDraft.
- [ ] Implement debounced saving and cleanup.
- [ ] Create the recovery banner.
- [ ] Create discard confirmation.
- [ ] Add save-status and storage-error messaging.
- [ ] Add component tests.

### Phase 3 — Stepper Gating

- [ ] Hide both submission actions outside Step 4.
- [ ] Keep Continue as the only forward action on Steps 1–3.
- [ ] Invalidate later completion when an earlier step is edited.
- [ ] Revalidate all steps before Step 4 submission.
- [ ] Add step-navigation tests.

### Phase 4 — Submission Reliability

- [ ] Extract payload builders.
- [ ] Remove artificial submission timers.
- [ ] Await onSubmit.
- [ ] Clear drafts only after confirmed success.
- [ ] Retain drafts and modal state after failure.
- [ ] Reset state after successful completion.

### Phase 5 — Integration and Hardening

- [ ] Pass stable HR ownership context from the page.
- [ ] Verify controller and hook return the created record.
- [ ] Test account switching and logout.
- [ ] Test corrupt, expired, and quota-failed storage.
- [ ] Verify keyboard and screen-reader behavior.
- [ ] Run build, targeted lint, and manual regression tests.

## 15. Automated Verification

Add unit tests for:

- draft sanitization;
- temporary-passkey exclusion;
- owner isolation;
- expiry;
- corrupt storage;
- meaningful-input detection;
- restore normalization;
- completed-step reconstruction;
- submission success clearing the draft; and
- submission failure retaining the draft.

Add component tests for:

- Step 1–3 action gating;
- Step 4 action visibility;
- Continue validation;
- editing a completed step;
- Resume Draft;
- Start Fresh confirmation;
- storage failure messaging; and
- focus behavior.

Run separately:

    npm run build
    npm run lint

The current build script invokes Vite only; it does not guarantee lint execution.

## 16. Manual Acceptance Tests

1. Open the modal and verify Step 1 shows Continue but no submission action.
2. Repeat for Steps 2 and 3.
3. Reach Step 4 and verify both final actions appear.
4. Edit an earlier step and verify Step 4 becomes inaccessible until revalidated.
5. Enter identity and placement data, close the modal, reopen, and choose Resume Draft.
6. Refresh during Step 3 and restore all non-sensitive fields.
7. Select Temporary Passkey, close, and restore; verify the passkey and acknowledgement are blank.
8. Choose Start Fresh and confirm the draft is permanently cleared.
9. Cancel with meaningful data and verify the draft remains recoverable.
10. Complete account creation successfully and confirm the draft is cleared.
11. Save pending placement successfully and confirm the draft is cleared.
12. Simulate submission failure and verify the modal and draft remain.
13. Sign in as another HR account and verify no draft details are disclosed.
14. Corrupt or fill local storage and verify the modal remains usable with an honest save-status warning.
15. Test keyboard navigation, Escape behavior, focus restoration, dark mode, and responsive layout.

## 17. Acceptance Criteria

- Steps 1–3 expose only Continue as their forward action.
- Both submission actions appear exclusively on valid Step 4.
- Editing an earlier step invalidates later completion.
- Non-sensitive meaningful input is saved with debounce.
- Valid owner-matched drafts can be resumed after closure or refresh.
- Temporary passkeys and acknowledgements are never persisted.
- Start Fresh requires confirmation when data exists.
- Successful submission clears and resets the draft.
- Failed submission retains the draft and keeps the modal open.
- Drafts are isolated by HR account identity.
- Corrupt or unavailable local storage does not crash onboarding.
- Existing onboarding payloads and Personnel Directory updates remain functional.
- The production build succeeds and no new lint errors are introduced.

## 18. Rollout and Rollback

- Implement behind an internal feature flag if available.
- Release stepper gating independently from draft recovery if risk needs to be reduced.
- Preserve existing payload shapes during the first release.
- If recovery causes issues, disable draft detection and saving without deleting stored drafts.
- Do not interpret unsupported draft schemas; leave them untouched or remove them only through an explicit migration.
