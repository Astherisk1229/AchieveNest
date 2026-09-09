# Plan 02 Phase 1 Evidence: OSAD Organization UI Audit

## Execution Timestamp
2026-09-01T11:43:30+08:00
Database: `achievenest_local`

---

## 1. Page & Layout Overview
- **Component**: `frontend/src/pages/osad-admin/OSADStudentOrganizationsPage.jsx`
- **Route**: `/osad/dashboard?tab=organizations` (rendered via `OSADDashboardPage.jsx`)
- **Layout**: Top header banner with `Create Student Organization` button, filter toolbar (Scope buttons: `all`, `university`, `college`, `program`; Category dropdown), followed by a 3-column responsive card grid.

---

## 2. Card Content & Interactivity
- **Card Fields Rendered**:
  - Scope badge (e.g. `UNIVERSITY`, `COLLEGE`, `PROGRAM`)
  - Category label (e.g. `Academic / College-Based`, `Co-Curricular`, etc.)
  - Organization Logo (fetched via `/api/v1/osad/organizations/{id}/logo`) or 3-letter acronym avatar fallback
  - Organization Name
  - Organization Acronym / Code (`[CSS]`)
  - Parent College acronym (e.g. `CET`) if college/program scoped
  - Organization Moderator section with current moderator name and `Assign` action button
- **Card Clickability**:
  - **Status: NOT CLICKABLE**.
  - Clicking on the card body does not trigger navigation or open details.
  - Only the `Assign` moderator button has an interactive `onClick` handler.
- **Organization Detail View**:
  - **Status: MISSING DETAIL VIEW**.
  - No detail view, drawer, or modal exists in the frontend for viewing full organization scope, historical moderators, or managing affiliations.

---

## 3. Create Organization Modal (`CreateOrganizationModal.jsx`)
- **Fields**:
  - `name`: Organization Name (text, required)
  - `code`: Acronym / Code (text, uppercase, max 30 chars, required)
  - `category`: Classification dropdown (`academic_college`, `co_curricular`, etc.)
  - `scope`: Academic Scope dropdown (`university`, `college`, `program`)
  - `college_id`: Parent College select (conditionally shown if scope is `college` or `program`)
  - `program_ids`: Program affiliation checkboxes (conditionally shown if scope is `program`, filtered by selected college)
  - `logo`: Optional image file upload (JPEG, PNG, WebP up to 5 MB)
- **Moderator at Creation**:
  - **Status: NO**.
  - Form displays an informational note: *"Moderator assignment is managed as a separate post-creation workflow from the Student Organizations directory."*
- **Safety**: Includes `useConfirmableClose` discard confirmation dialog on cancel/escape.

---

## 4. Edit Organization Modal
- **Status: MISSING IN UI**.
- No `Edit Organization` button or modal exists anywhere in the frontend.
