# Phase 7 — OSAD Organization Test Matrix
**Plan 02 Full Regression Verification Matrix**

| ID | Scenario | Layer | Expected | Actual | Status | Evidence |
|---|---|---|---|---|---|---|
| SC-01 | Create Organization Only (University Scope) | API / DB | 1 org, 0 program affiliations, 0 active moderators | As expected | PASS | verify:phase7-org-regression |
| SC-02 | Create with One Program Scope | API / DB | 1 org, 1 program affiliation, 0 moderators | As expected | PASS | verify:phase7-org-regression |
| SC-03 | Create with Multiple Programs | API / DB | 1 org, N program affiliations, 0 moderators | As expected | PASS | verify:phase7-org-regression |
| SC-04 | Create with Moderator Only | API / DB | 1 org, 0 program affiliations, 1 active moderator | As expected | PASS | verify:phase7-org-regression |
| SC-05 | Full Configuration Creation | API / DB | 1 org, N programs, 1 active moderator | As expected | PASS | verify:phase7-org-regression |
| SC-06 | Duplicate Program Selection Deduplication | Service / DB | Idempotent insertion; 1 DB row per program | As expected | PASS | verify:phase7-org-regression |
| SC-07 | Invalid Program Rollback | DB Transaction | Request fails; 0 partial persistence in DB | As expected | PASS | verify:phase7-org-regression |
| SC-08 | Inactive Program Handling | Service / Validation | Inactive programs rejected; transaction rolls back | As expected | PASS | verify:phase7-org-regression |
| SC-09 | Invalid Moderator Rollback | DB Transaction | Request fails; org and affiliations rolled back | As expected | PASS | verify:phase7-org-regression |
| SC-10 | Inactive/Ineligible Moderator Handling | Service / Validation | Ineligible moderator rejected; 0 DB persistence | As expected | PASS | verify:phase7-org-regression |
| SC-11 | Unauthorized Creation | Auth Policy | Non-OSAD rejected with 403 Forbidden | As expected | PASS | verify:phase7-org-regression |
| SC-12 | Rollback on Affiliation Failure | DB Transaction | Entire creation rolls back; partial persistence = 0 | As expected | PASS | verify:phase7-org-regression |
| SC-13 | Rollback on Moderator Failure | DB Transaction | Entire creation rolls back; partial persistence = 0 | As expected | PASS | verify:phase7-org-regression |
| SC-14 | Click Organization Card | UI / Navigation | Card click navigates to organization details view | As expected | PASS | Browser verification |
| SC-15 | Nested Card Action Isolation | UI / Event | e.stopPropagation isolates inner assign buttons | As expected | PASS | OSADOrganizationPhase4.test.jsx |
| SC-16 | Keyboard Card Activation | UI / A11y | Enter/Space triggers card selection; focus ring | As expected | PASS | OSADOrganizationPhase4.test.jsx |
| SC-17 | Direct Detail Deep Link | UI / URL Sync | `?tab=organizations&orgId=:id` deep links directly | As expected | PASS | Browser verification |
| SC-18 | Detail Refresh | API / Service | Full browser refresh fetches authoritative details | As expected | PASS | Browser verification |
| SC-19 | Invalid Organization ID | UI / Error | Not found state shown; no React crash | As expected | PASS | OSADOrganizationDetailsView |
| SC-20 | Unauthorized Detail Access | Server / Auth | 403 response; no protected details rendered | As expected | PASS | GovernancePolicy check |
| SC-21 | Edit Organization Name | API / Service | Master data updated; affiliations/moderator untouched | As expected | PASS | verify:phase7-org-regression |
| SC-22 | Edit Organization Acronym | API / Service | Code uppercase enforced; master data updated | As expected | PASS | verify:phase7-org-regression |
| SC-23 | Classification Change Validation | Service / Validation | Validates scope constraints against college/programs | As expected | PASS | verify:phase7-org-regression |
| SC-24 | Duplicate Name/Code Conflict | DB / Service | Unique code constraint rejects duplicate | As expected | PASS | verify:phase7-org-regression |
| SC-25 | Add One Program Scope | API / Service | 1 affiliation added atomically; UI refreshes | As expected | PASS | verify:phase7-org-regression |
| SC-26 | Add Multiple Programs Scope | API / DB | Batch affiliations inserted atomically | As expected | PASS | verify:phase7-org-regression |
| SC-27 | Duplicate Existing Program Addition | Service / DB | Ignored / deduplicated safely | As expected | PASS | verify:phase7-org-regression |
| SC-28 | Remove Program Scope | API / DB | Affiliation deleted; other affiliations intact | As expected | PASS | verify:phase7-org-regression |
| SC-29 | Remove Last Required Program | Service / Validation | Blocked for program-scoped orgs (min 1 program) | As expected | PASS | verify:phase7-org-regression |
| SC-30 | Program Scope API Failure | UI / State | Action error alert rendered; state stays clean | As expected | PASS | Browser verification |
| SC-31 | Assign Moderator to Unassigned Org | API / DB | Active assignment created; effective_from set | As expected | PASS | verify:phase7-org-regression |
| SC-32 | Replace Moderator | API / DB | Prior soft-deactivated; new active tenure started | As expected | PASS | verify:phase7-org-regression |
| SC-33 | Remove Moderator | API / DB | Prior soft-deactivated; org becomes Unassigned | As expected | PASS | verify:phase7-org-regression |
| SC-34 | Select Same Moderator | Service / Idempotency | No duplicate active assignments created | As expected | PASS | verify:phase7-org-regression |
| SC-35 | One Moderator Across Multiple Orgs | DB / Business Rule | Multi-org moderation supported | As expected | PASS | DB constraint design |
| SC-36 | Max 1 Active Moderator / Org | Virtual Guard / DB | uq_active_org_moderator prevents 2 active rows | As expected | PASS | verify:phase7-org-regression |
| SC-37 | Moderator Replacement Failure Rollback | DB Transaction | Rollback restores original active assignment | As expected | PASS | verify:phase7-org-regression |
| SC-38 | Unauthorized Moderator Mutation | Server / Auth | 403 Forbidden; zero DB changes | As expected | PASS | GovernancePolicy check |
| SC-39 | Multi-Reassignment History | DB History | Chronological sequence A->B->C all preserved | As expected | PASS | verify:phase7-org-regression |
| SC-40 | History After Removal | DB History | 0 active moderators; all past tenures retained | As expected | PASS | verify:phase7-org-regression |
| SC-41 | Allowed Lifecycle Transition | Service / DB | Status updated (active/inactive/archived) | As expected | PASS | verify:phase7-org-regression |
| SC-42 | Invalid Lifecycle Transition | Validation | Blocked on unrecognized status values | As expected | PASS | OrganizationService validation |
| SC-43 | Standard Name Formatting Suggestion | Utility / UI | Suggests Title Case for meaningful words | As expected | PASS | OSADOrganizationPhase6.test.jsx |
| SC-44 | Connector Words Handling | Utility / UI | Keeps mid-name connectors lowercase | As expected | PASS | OSADOrganizationPhase6.test.jsx |
| SC-45 | Acronym Preservation | Utility / UI | Preserves all-caps acronyms (PSITS, NDMU) | As expected | PASS | OSADOrganizationPhase6.test.jsx |
| SC-46 | User Rejects Suggestion | UI / Form | Submits raw user value without blocking | As expected | PASS | CreateOrganizationModal |
| SC-47 | User Modifies Suggestion | UI / Form | Submits exact user-edited value | As expected | PASS | EditOrganizationModal |
| SC-48 | Existing Name on Edit Mount | UI / Form | Stored name loads unchanged; no auto-rewrite | As expected | PASS | EditOrganizationModal |
| SC-49 | Whitespace/Punctuation/Hyphenation | Utility / UI | Trims spaces; preserves apostrophes & hyphens | As expected | PASS | OSADOrganizationPhase6.test.jsx |
| SC-50 | Empty Organizations List State | UI / State | Clear empty-state placeholder rendered | As expected | PASS | OSADStudentOrganizationsPage |
| SC-51 | No Program Scope State | UI / State | Scope-appropriate empty message rendered | As expected | PASS | OSADOrganizationDetailsView |
| SC-52 | No Moderator State | UI / State | Displays "Unassigned" and "Assign" button | As expected | PASS | OSADOrganizationDetailsView |
| SC-53 | No Moderator History State | UI / State | Displays "No history recorded yet" placeholder | As expected | PASS | OSADOrganizationDetailsView |
| SC-54 | API Error + Retry State | UI / State | Error banner with Retry button reloads details | As expected | PASS | OSADOrganizationDetailsView |
| SC-55 | Validation Failure Display | UI / State | Field-specific errors rendered without loss of draft | As expected | PASS | Create/Edit Modals |
| SC-56 | Stale-State Conflict Handling | Service / UI | Descriptive error returned; refresh enabled | As expected | PASS | OrganizationController |
| SC-57 | Direct API Unauthorized Mutation | Server / Auth | 401/403 enforced on all mutation routes | As expected | PASS | GovernancePolicy check |
