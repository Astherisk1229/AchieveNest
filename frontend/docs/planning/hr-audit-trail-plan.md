# HR Audit Trail and Governance Log — Refined Implementation Plan

## Status

**Status:** Proposed  
**Module:** HR Audit Trail  
**Current persistence:** Browser local storage  
**Design system:** Premium Utilitarian Minimalism

## 1. Objective

Transform the existing static HR activity list into a searchable, filterable, paginated governance log that allows authorized HR users to:

- search by actor, target, employee ID, event label, event code, and details;
- filter by canonical event category and date range;
- inspect actor, target, timestamp, event, and reference metadata;
- export the current filtered result set safely to CSV; and
- navigate larger result sets without losing the active query.

This phase improves visibility and traceability in the frontend prototype. Because records remain in browser local storage, it must not be described as tamper-evident, immutable, institution-wide, or enterprise-grade.

## 2. Current-State Findings

The existing implementation has several issues that must be addressed before UI refinement:

1. HRAuditTrailPage displays log.timestamp but its CSV export reads log.created_at.
2. The audit model currently defines timestamp, not created_at.
3. Proposed event codes do not match the codes currently emitted by HRController.
4. Actor identity is hard-coded as Director Evelyn Tan in HRController.logAudit.
5. target_personnel is a display string rather than a stable target ID and label pair.
6. Filtering and CSV transformation are currently page concerns, contrary to the project MVC guidance.
7. Existing CSV generation does not escape commas, quotes, or line breaks.
8. CSV values beginning with =, +, -, or @ can be interpreted as spreadsheet formulas.
9. Current local-storage records can be edited or removed through browser tools.
10. The existing page uses rounded-3xl and shadows that conflict with the referenced minimalist design system.

## 3. User Review Required

> [!IMPORTANT]
> Confirm these decisions before implementation:
>
> 1. **Local-only limitation:** The current log is a prototype governance history, not a compliant immutable audit ledger.
> 2. **Default order:** Newest event first, with event ID as deterministic tie-breaker.
> 3. **Export scope:** Export the entire filtered result set, not only the visible page.
> 4. **Actor source:** Capture the authenticated HR user's stable ID, display name, and role at event creation.
> 5. **Retention:** Decide whether local logs have a maximum count or retention period.
> 6. **Timezone display:** Show the user's local time plus a timezone indicator; export canonical ISO UTC timestamps.
> 7. **Details exposure:** Confirm which sensitive event details are permitted in UI and export.

## 4. Canonical Audit Schema

### Model Changes

Extend HRAuditLogEntity to use a stable schema:

| Field | Purpose |
| :--- | :--- |
| schema_version | Supports migration. |
| id | Stable unique event ID. |
| timestamp | Canonical ISO UTC event time. |
| event_code | Stable machine-readable action code. |
| category | Canonical category key. |
| actor_id | Stable authenticated user ID. |
| actor_name | Snapshot display name. |
| actor_role | Snapshot role at event time. |
| target_type | Personnel, evaluation, credential request, or assignment. |
| target_id | Stable referenced record ID. |
| target_label | Human-readable target snapshot. |
| details | Safe, human-readable summary. |
| reference_id | Related transaction or submission ID, when available. |
| metadata | Optional whitelisted structured values. |

Backward compatibility:

- accept admin_name as legacy actor_name;
- accept action_type as legacy event_code;
- accept target_personnel as legacy target_label;
- use timestamp as the only canonical time field;
- do not generate a new current timestamp when reconstructing a legacy log that already has one; and
- mark incomplete legacy fields as unavailable rather than inventing IDs.

## 5. Event Registry

Create one centralized event registry instead of duplicating switch statements across the page, filter, card, and export logic.

Recommended location:

    src/models/HRAuditEventRegistry.js

Each event definition should provide:

- canonical event code;
- display label;
- category;
- visual tone;
- optional description; and
- legacy aliases.

### Canonical Categories

| Category key | Label | Examples |
| :--- | :--- | :--- |
| ACCOUNT | Account Management | Personnel account created or updated. |
| SECURITY | Credentials and Security | Password reset approved. |
| EVALUATION | Faculty Evaluations | Review started, returned, ready, or sealed. |
| RANK_ASSIGNMENT | Rank and Assignments | Rank change, Dean/Secretary role assignment, College assignment. |
| SYSTEM | System and Other | Unknown or uncategorized legacy events. |

### Existing Codes Requiring Mapping

The registry must cover actual emitted codes, including:

- PERSONNEL_ACCOUNT_CREATED;
- PERSONNEL_REGISTERED;
- PERSONNEL_UPDATE;
- PERSONNEL_PASSWORD_RESET_APPROVED;
- CREDENTIAL_RESET_ISSUED;
- ROLE_ASSIGNMENT;
- ASSIGNMENT_UPDATED;
- RANK_PROMOTION;
- RANK_PROMOTION_UPDATE;
- HR_REVIEW_STARTED;
- HR_REVIEW_READY_FOR_FINALIZATION;
- ACCOMPLISHMENT_SEALED;
- HR_SCORE_SEAL_APPLIED;
- ACCOMPLISHMENT_RETURNED; and
- EVALUATION_RETURNED.

Unknown codes must render with a neutral SYSTEM style and a humanized fallback label. They must never disappear from the log because they lack registry metadata.

## 6. Actor and Target Integrity

Update HRController.logAudit to accept an event object or explicit context rather than embedding one hard-coded actor:

    logAudit({
      eventCode,
      actor,
      target,
      details,
      referenceId,
      metadata
    })

Requirements:

- obtain actor ID, name, and role from authenticated user context;
- capture actor values at event time;
- use stable target IDs whenever available;
- preserve target label as a historical snapshot;
- never store passwords, temporary credentials, tokens, or full sensitive remarks;
- avoid embedding identifiers only inside prose details; and
- write the domain change and audit event through one controller operation where possible.

The local-storage prototype cannot guarantee atomic commits. Document that limitation for future backend work.

## 7. Architecture and Change Manifest

| Change | File | Purpose |
| :--- | :--- | :--- |
| MODIFY | src/models/HRModel.js | Extend HRAuditLogEntity and support legacy normalization. |
| NEW | src/models/HRAuditEventRegistry.js | Own event labels, categories, aliases, and visual tones. |
| MODIFY | src/controllers/HRController.js | Capture real actor and target context and expose audit queries. |
| NEW | src/controllers/HRAuditTrailController.js | Own searching, filtering, ordering, pagination, and CSV row preparation. |
| NEW | src/hooks/useHRAuditTrail.js | Bridge the page to audit controller state. |
| MODIFY | src/pages/hr-admin/HRAuditTrailPage.jsx | Compose the governance-log page and remove business logic. |
| NEW | src/pages/hr-admin/audit/AuditTrailFilterBar.jsx | Render controlled search and filters. |
| NEW | src/pages/hr-admin/audit/AuditLogTimelineItem.jsx | Render one accessible audit entry. |
| NEW | src/pages/hr-admin/audit/AuditTrailPagination.jsx | Render pagination and page-size controls. |
| NEW | src/utils/safeCsvExport.js | Escape CSV fields and mitigate spreadsheet-formula injection. |

## 8. Query and Filtering Behavior

### Search

Normalize the query using trim and locale-aware lowercase matching.

Search:

- actor name;
- actor role;
- target label;
- target ID;
- event label;
- event code;
- details; and
- reference ID.

Do not search serialized raw metadata by default because it may expose unrelated or sensitive values.

### Category

Filter by canonical category keys from the registry, not by display labels or fragile string matching.

### Date Range

Supported presets:

- All Time;
- Today;
- Last 7 Days; and
- Last 30 Days.

Rules:

- parse timestamps defensively;
- define Today in the user's displayed timezone;
- use inclusive start and end boundaries;
- place invalid timestamps in an Unknown Date state rather than silently excluding them from All Time; and
- document exact preset semantics.

### Ordering

Always sort before pagination:

1. timestamp descending;
2. ID descending as a deterministic tie-breaker.

### Pagination

- page sizes: 10, 25, and 50;
- reset to Page 1 when search, category, date range, or page size changes;
- clamp the current page when the filtered count decreases;
- retain filters while navigating pages; and
- show filtered and total counts separately.

Use memoized derived results. Do not duplicate filtered collections in state.

## 9. CSV Export Safety

Export the full filtered and sorted result set.

Filename:

    NDMU_HR_Audit_Trail_YYYY-MM-DD.csv

Columns:

- Event Code;
- Event Label;
- Category;
- Actor ID;
- Actor Name;
- Actor Role;
- Target Type;
- Target ID;
- Target Label;
- Details;
- Timestamp UTC;
- Reference ID.

CSV requirements:

- stringify null and undefined safely;
- double embedded quotes;
- wrap every field in quotes;
- preserve commas and line breaks;
- prefix values beginning with =, +, -, or @ so spreadsheet software does not execute them as formulas;
- create a Blob rather than a data URI;
- use UTF-8 with a BOM if spreadsheet compatibility requires it;
- revoke the generated object URL; and
- disable export when no filtered results exist.

Show the exported record count in the button or confirmation message.

Exporting the audit trail should itself become an audit event in the future backend implementation. Avoid adding it to the current filtered collection during the same export operation because that changes the result set being exported.

## 10. UI Refinement

### Page Header

- title: Audit Trail;
- concise governance description;
- filtered result count;
- Export Filtered CSV action.

### Filter Bar

- search input;
- category filter;
- date-range filter;
- active-filter summary;
- Clear filters;
- export action may remain in the page header to reduce toolbar crowding.

### Timeline

Use a timeline only when it improves chronological scanning:

- one light vertical rule;
- small semantic node;
- flat event row or 12px-radius card;
- event label and exact timestamp;
- details;
- target identity;
- actor name and role.

Avoid an avatar unless a reliable actor image exists. Initials or text are sufficient.

### Design Constraints

- use a 12px maximum radius;
- replace rounded-3xl;
- use one-pixel light borders;
- remove heavy shadows;
- do not use emojis in labels or buttons;
- do not add new Lucide icons as part of this refinement;
- use pastel colors only for semantic category cues;
- preserve dark-mode contrast;
- do not use color as the only category indicator.

The original proposal lists rounded-2xl despite a 12px maximum; use rounded-xl or rounded-lg instead.

## 11. Accessibility

- use a heading hierarchy and list semantics for audit events;
- provide accessible names for filter and pagination controls;
- use aria-current for the current page when numbered pagination exists;
- announce filtered result counts politely;
- preserve visible keyboard focus;
- render exact timestamps in a time element with dateTime set to the ISO value;
- expose both category text and color;
- avoid continuously changing relative-time text as the only timestamp; and
- ensure screen readers receive actor, event, target, and time in a sensible order.

## 12. Empty, Error, and Legacy States

### No Logs

Show that no audit events have been recorded.

### No Matches

Show that no events match the current filters and provide Clear filters.

### Invalid Storage

If local audit storage is corrupt:

- keep the page usable;
- do not silently reseed over corrupted user data;
- show an honest recovery message; and
- provide a controlled reset only with confirmation.

### Unknown Event

Render neutral styling, raw code, and available metadata.

### Invalid Timestamp

Show Unknown date and keep the event available under All Time.

## 13. Implementation Phases

### Phase 0 — Schema and Governance Decisions

- [ ] Confirm the seven user-review decisions.
- [ ] Inventory all emitted HR audit codes.
- [ ] Define canonical codes, aliases, and categories.
- [ ] Confirm sensitive-detail redaction rules.
- [ ] Confirm retention and timezone policies.

### Phase 1 — Model and Registry

- [ ] Extend HRAuditLogEntity.
- [ ] Add legacy normalization.
- [ ] Create HRAuditEventRegistry.
- [ ] Add unknown-event fallback.
- [ ] Add model and registry tests.

### Phase 2 — Controller and Hook

- [ ] Refactor HRController.logAudit to accept actor and target context.
- [ ] Update event call sites incrementally.
- [ ] Create HRAuditTrailController.
- [ ] Create useHRAuditTrail.
- [ ] Implement normalized query, category filter, date filter, ordering, and pagination.
- [ ] Add controller and hook tests.

### Phase 3 — Safe Export

- [ ] Create safeCsvExport.
- [ ] Export full filtered results.
- [ ] Add formula-injection mitigation.
- [ ] Add CSV unit tests for quotes, commas, line breaks, Unicode, and formula prefixes.

### Phase 4 — Page and Components

- [ ] Refactor HRAuditTrailPage.
- [ ] Build AuditTrailFilterBar.
- [ ] Build AuditLogTimelineItem.
- [ ] Build AuditTrailPagination.
- [ ] Add no-log, no-match, invalid-date, and unknown-event states.
- [ ] Apply minimalist styles and accessibility semantics.

### Phase 5 — Verification

- [ ] Run production build.
- [ ] Run targeted lint on modified files.
- [ ] Test all actual and legacy event codes.
- [ ] Test export safety and filtered-result parity.
- [ ] Test responsive layouts, dark mode, and keyboard navigation.

## 14. Automated Verification

Add unit tests for:

- event alias and category mapping;
- unknown event fallback;
- legacy schema normalization;
- canonical timestamp handling;
- search normalization;
- date-boundary behavior;
- newest-first ordering;
- deterministic tie-breaking;
- page reset and clamping;
- CSV escaping;
- spreadsheet-formula injection mitigation; and
- export matching the full filtered collection.

Add component tests for:

- filters and Clear filters;
- empty and no-match states;
- pagination;
- exact timestamp markup;
- unknown event rendering;
- export disabled with zero results; and
- keyboard focus.

Run separately:

    npm run build
    npm run lint

The Vite build command does not perform linting.

## 15. Manual Acceptance Tests

1. Search Ana Reyes and verify matching actor, target, and detail records.
2. Filter every canonical category.
3. Test Today, Last 7 Days, Last 30 Days, and All Time at date boundaries.
4. Confirm newest-first ordering and stable order for equal timestamps.
5. Change filters on a later page and verify reset to Page 1.
6. Export a filtered set and confirm it matches all filtered records, not only the current page.
7. Export details containing commas, quotes, line breaks, Unicode, and formula-like prefixes safely.
8. Render every current event code and representative legacy aliases.
9. Verify unknown codes remain visible.
10. Verify an invalid timestamp does not crash the page.
11. Verify dark mode, narrow widths, keyboard navigation, and focus visibility.
12. Confirm current HR actions continue producing audit records.
13. Sign in as a different HR user and confirm new events record the actual actor.

## 16. Acceptance Criteria

- UI and export use timestamp consistently.
- Every current event code has a registry mapping or neutral fallback.
- Actor identity comes from authenticated context rather than a hard-coded name.
- Stable target and reference IDs are captured when available.
- Search, category, and date filtering are deterministic.
- Pagination operates on sorted filtered results.
- CSV export includes the full filtered result set and is safely encoded.
- Unknown and legacy records remain visible.
- Corrupt or incomplete records do not crash the page.
- The layout follows the 12px radius, flat-border, low-shadow design constraints.
- The page does not claim tamper evidence or enterprise compliance while using local storage.
- The production build succeeds and modified files introduce no new lint errors.

## 17. Future Backend Phase

For a production governance ledger, move audit creation and querying to an append-only backend service with:

- server-generated timestamps and IDs;
- authenticated actor identity;
- authorization-controlled reads;
- immutable or append-only storage;
- retention and legal-hold policies;
- integrity verification;
- server-side pagination and filtering;
- export authorization and export-event logging; and
- monitoring for deletion or tampering attempts.
