# Plan 02 Phase 1 Evidence: UI State & Workflow Analysis Matrix

## Execution Timestamp
2026-09-01T11:43:30+08:00
Database: `achievenest_local`

---

## 1. UI State Matrix

| State Type | Component / Flow | Current Behavior | Gap / Issue |
|---|---|---|---|
| Initial Loading | `OSADStudentOrganizationsPage` | None (renders whatever is in memory state immediately) | No skeleton/spinner during backend fetch |
| Empty List | `OSADStudentOrganizationsPage` | Shows simple message: *"No Student Organizations match the selected filters."* | Clear, but lacks visual icon/guidance |
| Error Banner | `OSADStudentOrganizationsPage` | None | API fetch errors are logged to console without visual retry |
| Create Submit Loading | `CreateOrganizationModal` | Spinner inside `Save` button (`Saving...`) | Good; button disabled |
| Discard Confirmation | `CreateOrganizationModal` | `useConfirmableClose` prompts confirmation on dirty form | Excellent safety mechanism |
| Detail View State | Organization Detail | MISSING | No detail view exists |
| Edit Form State | Edit Organization | MISSING | No edit modal exists |
| Moderator Assign State | `PersonnelSelectorModal` | Opens modal, but onSelect executes mock memory state mutation | Needs wiring to canonical API |

---

## 2. Duplicate & Conflicting Workflow Inventory

1. **Moderator Assignment Disconnect**:
   - UI on `OSADStudentOrganizationsPage` calls `assignOrganizationModerator(userId, clubName)` inside `OSADDashboardPage`, which mutates in-memory mock controllers instead of calling `/api/v1/personnel/{id}/roles` or backend endpoints.
2. **Missing Post-Creation Program Affiliation Entry Point**:
   - Programs can be selected during creation (for `scope === 'program'`), but cannot be viewed in detail or modified afterward.
3. **Card Interactivity Gap**:
   - Organization cards are static and non-clickable, preventing users from opening an organization's profile, history, or management workspace.
