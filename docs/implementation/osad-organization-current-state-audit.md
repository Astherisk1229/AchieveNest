# AchieveNest — OSAD Organization Creation & Management
## Plan 02 Phase 1 Current-State Audit Report
**Authoritative Current-State Baseline & Workflow Discovery Report**

---

### 1. Executive Summary

Phase 1 executed a strict, evidence-backed current-state audit of the **Student Organization Creation and Management** workflow within OSAD.

Key findings:
- **Organization Master Data**: Authoritatively defined in `organizations` table, queried via `OrganizationService` and rendered on `OSADStudentOrganizationsPage.jsx`.
- **Card Clickability & Detail View**: Organization cards are **not clickable**, and an **Organization Detail View is MISSING**.
- **Create Organization Workflow**: `CreateOrganizationModal` collects name, code, category, scope (`university`, `college`, `program`), parent college, program scope checkboxes, and optional logo. However, **moderator selection is absent during creation**.
- **Edit Organization Workflow**: **MISSING in UI and backend API** (no `updateOrganization` endpoint or edit modal exists).
- **Academic Program Scope**: Stored in `organization_program_affiliations`. Supports 1:N (one org -> multiple programs) and N:1 (multiple orgs -> one program). Post-creation program scope editing is currently absent.
- **Organization Moderator Management**: Stored in `organization_moderator_assignments` with database-level single-active-moderator constraint (`uq_active_org_moderator`). In the UI, the `Assign` button opens `PersonnelSelectorModal`, but its callback mutates in-memory mock controllers rather than calling backend APIs.
- **Server Authorization**: `GovernancePolicy::canManageOrganizations` strictly restricts backend routes to `osad_admin`/`osad_staff`.

---

### 2. Repository Baseline

- **Repository Branch**: `audit/project-architecture-linkage`
- **Git HEAD**: `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`
- **Database**: `achievenest_local` (MySQL on local WAMP stack, port 3306)
- **Audit Timestamp**: `2026-09-01T11:43:00+08:00`

---

### 3. Organizations Page

- **Route**: `/osad/dashboard?tab=organizations` (rendered inside `OSADDashboardPage.jsx`).
- **Header**: Contains title, persistent badge, description, and primary action `Create Student Organization`.
- **Filter Toolbar**:
  - Scope buttons: `All Scopes`, `university`, `college`, `program`.
  - Category dropdown: `All Categories`, `academic_college`, `co_curricular`, `special_interest`, `socio_cultural`, `religious`, `sports`, `student_council`.
- **Grid Layout**: 3-column responsive card grid displaying filtered organizations.

---

### 4. Organization Card Behavior

- **Card Content**: Scope badge, category label, logo image / 3-letter acronym avatar, organization name, code (`[CSS]`), parent college code, and moderator section.
- **Clickability Status**: **NOT CLICKABLE**.
  - No card-level hover drilldown or click navigation exists.
  - Only the nested `Assign` button is clickable.

---

### 5. Organization Detail View

- **Status**: **MISSING DETAIL VIEW**.
- There is currently no dedicated organization detail page, modal, or drawer to inspect full program affiliation lists, moderator history, or manage organization parameters.

---

### 6. Create Organization Workflow

- **Modal Trigger**: `Create Student Organization` button in header.
- **Component**: `frontend/src/pages/osad-admin/modals/CreateOrganizationModal.jsx`.
- **Flow**:
  1. User inputs Name, Code/Acronym, Category, and Scope.
  2. If Scope is `college` or `program`, user selects Parent College.
  3. If Scope is `program`, user selects one or more Program checkboxes (filtered by selected college).
  4. User optionally uploads a logo image (JPEG, PNG, WebP <= 5 MB).
  5. User submits form -> `organizationAdminService.createOrganization(formData)`.
  6. Backend creates record in `organizations` and relational rows in `organization_program_affiliations`.
  7. Form resets and closes.

---

### 7. Create Organization Data Contract

- **Endpoint**: `POST /api/v1/osad/organizations`
- **Payload Format**: `multipart/form-data` or JSON:
```json
{
  "name": "Computer Science Society",
  "code": "CSS",
  "category": "academic_college",
  "scope": "program",
  "college_id": "20000000-0000-0000-0000-000000000001",
  "program_ids": ["30000000-0000-0000-0000-000000000001"]
}
```
- **Moderator at Creation**: **NO** (Not included in form or accepted by API).
- **Program Scope at Creation**: **YES** (For `scope === 'program'`).
- **Multi-Program Selection**: **YES** (Checkbox list).

---

### 8. Edit Organization Workflow

- **Status**: **MISSING IN CURRENT SYSTEM**.
- Neither UI modal nor backend `PUT /api/v1/osad/organizations/{id}` endpoint currently exists.

---

### 9. Program Scope Management

- **Current State**: Academic programs can only be affiliated during organization creation.
- **Post-Creation Scope Editing**: Not available in UI or API.
- **Source of Truth**: `organization_program_affiliations` table.

---

### 10. Program Scope Cardinality

- **One Organization -> Multiple Programs**: **YES** (Supported by `organization_program_affiliations`).
- **One Program -> Multiple Organizations**: **YES** (No unique constraint on `academic_program_id`).
- **Organization with Zero Program Scope**: **YES** (`university` and `college` scoped organizations have 0 program affiliations).
- **History Preservation**: `organization_program_affiliations` stores active current affiliations (`created_at` timestamp present, no deactivation flags).

---

### 11. Organization Moderator Management

- **Current UI Entry Point**: `Assign` button on organization card.
- **Trigger**: Opens `PersonnelSelectorModal`.
- **Current Defect**: The callback in `OSADDashboardPage.jsx` invokes `assignOrganizationModerator(userId, orgName)`, which mutates in-memory mock controllers instead of calling backend APIs.

---

### 12. PersonnelSelectorModal

- **Component**: `frontend/src/pages/osad-admin/modals/PersonnelSelectorModal.jsx`.
- **Features**: Live search across personnel name, employee ID, and college affiliation; displays currently assigned roles badges; handles Esc key dismiss.
- **Classification**: **CANONICAL MODERATOR SELECTOR COMPONENT** (retained from Plan 01 for Organization Moderator assignments).

---

### 13. Moderator Eligibility

- **Eligible Accounts**: Active profiles with `account_type IN ('personnel', 'hr_admin', 'osad_admin')` and `status = 'active'`.
- **College-Scoped Rules**: For college-scoped organizations, backend requires personnel to have an active affiliation with the organization's parent college (`personnel_college_affiliations`).

---

### 14. Moderator Cardinality

- **One Organization -> At Most One Active Moderator**: **YES** (Enforced by DB virtual guard `active_org_moderator_guard` and unique index `uq_active_org_moderator`).
- **One Moderator -> Multiple Organizations**: **YES** (A faculty member can moderate multiple student organizations).
- **Organization Without Moderator**: **YES** (Starts unassigned).

---

### 15. Moderator History

- `organization_moderator_assignments` preserves tenure records:
  - `effective_from` (start date)
  - `effective_until` (end date on revocation/reassignment)
  - `is_active` (`1` for active, `0` for inactive)
  - `assigned_by` (profile ID of OSAD admin)
- Reassignment and revocation execute soft-deactivation.

---

### 16. Frontend Component Map

| Component | File Path | Current Purpose |
|---|---|---|
| `OSADStudentOrganizationsPage` | `frontend/src/pages/osad-admin/OSADStudentOrganizationsPage.jsx` | Organizations grid and filters |
| `CreateOrganizationModal` | `frontend/src/pages/osad-admin/modals/CreateOrganizationModal.jsx` | Organization creation modal |
| `PersonnelSelectorModal` | `frontend/src/pages/osad-admin/modals/PersonnelSelectorModal.jsx` | Personnel picker modal |
| `organizationAdminService` | `frontend/src/services/organizationAdminService.js` | API service client |
| `OSADDashboardPage` | `frontend/src/pages/osad-admin/OSADDashboardPage.jsx` | Root dashboard routing tab |

---

### 17. Route Map

| Method | Route | Controller | Action | Purpose |
|---|---|---|---|---|
| `GET` | `/api/v1/osad/organizations` | `OrganizationController` | `index` | Lists organizations with joined moderator/programs |
| `GET` | `/api/v1/osad/organizations/{id}` | `OrganizationController` | `show` | Shows single organization details |
| `POST` | `/api/v1/osad/organizations` | `OrganizationController` | `create` | Creates organization & program affiliations |
| `GET` | `/api/v1/osad/organizations/{id}/logo` | `OrganizationController` | `logo` | Streams organization logo image |
| `POST` | `/api/v1/osad/organizations/{id}/logo` | `OrganizationController` | `updateLogo` | Uploads/updates logo |
| `DELETE` | `/api/v1/osad/organizations/{id}/logo` | `OrganizationController` | `deleteLogo` | Removes logo |
| `POST` | `/api/v1/personnel/{id}/roles` | `PersonnelRoleController` | `assign` | Assigns specialized role (Moderator) |
| `DELETE` | `/api/v1/personnel/{id}/roles/{assignmentId}` | `PersonnelRoleController` | `revoke` | Revokes specialized role (Moderator) |

---

### 18. Controller Map

- `OrganizationController`: Handles listing, fetching, creating organizations and logo asset lifecycle.
- `PersonnelRoleController`: Handles assigning and revoking `organization_moderator` role records in `organization_moderator_assignments`.

---

### 19. Service Map

- `OrganizationService`: Authoritative service for organizations and logo storage management.
- `AuthorizationService` / `GovernancePolicy`: Authoritative service for role authorization and governance rules.

---

### 20. Database Schema

#### `organizations`
- `id` (char 36 PK), `college_id` (char 36 FK), `code` (varchar 30 UNIQUE), `name` (varchar 150), `scope` (varchar 30), `category` (varchar 50), `status` (varchar 20), `logo_storage_key`, `logo_original_name`, `logo_mime_type`, `logo_updated_at`, `created_at`, `updated_at`.

#### `organization_program_affiliations`
- `id` (char 36 PK), `organization_id` (char 36 FK), `academic_program_id` (char 36 FK), `created_at` (datetime 6).
- `UNIQUE KEY uq_org_program (organization_id, academic_program_id)`.

#### `organization_moderator_assignments`
- `id` (char 36 PK), `organization_id` (char 36 FK), `personnel_profile_id` (char 36 FK), `effective_from` (date), `effective_until` (date NULL), `is_active` (tinyint 1), `assigned_by` (char 36 FK), `assigned_at` (datetime 6), `created_at`, `updated_at`.
- `active_org_moderator_guard` (char 36 VIRTUAL).
- `UNIQUE KEY uq_active_org_moderator (active_org_moderator_guard)`.

---

### 21. Foreign Keys

- `organizations.college_id` -> `colleges.id`
- `organization_program_affiliations.organization_id` -> `organizations.id` (CASCADE)
- `organization_program_affiliations.academic_program_id` -> `academic_programs.id` (RESTRICT)
- `organization_moderator_assignments.organization_id` -> `organizations.id` (CASCADE)
- `organization_moderator_assignments.personnel_profile_id` -> `profiles.id` (CASCADE)
- `organization_moderator_assignments.assigned_by` -> `profiles.id` (SET NULL)

---

### 22. Unique Constraints

1. `organizations.code`: Unique organization code/acronym.
2. `uq_org_program`: Composite unique `(organization_id, academic_program_id)`.
3. `uq_active_org_moderator`: Virtual guard ensuring max 1 active moderator per organization.

---

### 23. Name Formatting & Acronym Behavior

- Code/acronym input is automatically uppercased (`.toUpperCase()`).
- Name input is trimmed without aggressive title-casing, preserving user casing and conjunctions.

---

### 24. Loading, Empty, Error & Retry States

- **Loading**: Modal submit has spinner; main organizations page lacks skeleton loader.
- **Empty**: Basic empty state text displayed when no organizations match filters.
- **Error/Retry**: Modal displays error banner; main page logs fetch errors to console without retry UI.

---

### 25. Validation

- Frontend: Required fields (`name`, `code`, `category`, `scope`, `college_id` if college/program scope, `program_ids` if program scope).
- Backend: String length validations (name <= 150, code <= 30), allowed enum lists, uniqueness check on `code`.
- Database: CHECK constraints on `category`, `scope`, `status`.

---

### 26. Authorization

- Server-side enforcement in `OrganizationController` via `$this->checkOSADAuthorization($actor)` calling `GovernancePolicy::canManageOrganizations`.
- Non-admin access returns HTTP 403 Forbidden.

---

### 27. Entry-Point Inventory

| Action | UI Location | Trigger | Current Target |
|---|---|---|---|
| Create Organization | `OSADStudentOrganizationsPage` | Header Button | Opens `CreateOrganizationModal` -> `apiCreateOrganization` |
| View Organization Details | None | Missing | N/A (Cards non-clickable) |
| Edit Organization | None | Missing | N/A |
| Manage Program Scope | None | Missing post-creation | N/A |
| Assign Moderator | `OSADStudentOrganizationsPage` | Card `Assign` Button | Opens `PersonnelSelectorModal` -> Mock Memory Controller |

---

### 28. Duplicate Workflow Analysis

- **Duplicate Entry Points**: 0 (only 1 create button and 1 assign button exist).
- **Gaps**: Detail view and post-creation edit/scope views are completely missing.

---

### 29. Conflicting Workflow Analysis

- **Confirmed Conflict**: `OSADDashboardPage.jsx` routes moderator selection to `assignOrganizationModerator(userId, orgName)` which updates in-memory React state rather than the persistent `organization_moderator_assignments` database table.

---

### 30. Current Source-of-Truth Matrix

| Business Fact | Current Source of Truth | Authoritative Endpoint / Service |
|---|---|---|
| Organization Master Data | `organizations` table | `OrganizationService` / `OrganizationController` |
| Program Affiliations | `organization_program_affiliations` table | `OrganizationService` / `OrganizationController` |
| Moderator Assignments | `organization_moderator_assignments` table | `PersonnelRoleController` (Disconnected in UI) |
| Organization Logos | `uploads/organization-logos/` | `OrganizationService::getLogoPath` |

---

### 31. Cardinality Matrix

| Relationship | Supported? | Evidence |
|---|---|---|
| Organization -> Multiple Programs | YES | `organization_program_affiliations` table |
| Program -> Multiple Organizations | YES | No unique constraint on `academic_program_id` |
| Organization -> Zero Programs | YES | Supported for university/college scopes |
| Organization -> One Active Moderator | YES | Enforced by `uq_active_org_moderator` |
| Organization -> Multiple Active Moderators | NO | Prohibited by `uq_active_org_moderator` |
| Moderator -> Multiple Organizations | YES | Supported by schema |
| Organization -> Zero Moderators | YES | Supported (starts unassigned) |

---

### 32. Findings Summary

1. **Card Interactivity & Details View**: Organization cards are static; no detail view exists.
2. **Creation Workflow**: Moderator assignment cannot be performed during organization creation.
3. **Edit & Program Scope**: No post-creation organization edit or program scope management exists.
4. **Moderator Assignment Disconnect**: Card `Assign` button is wired to mock memory state rather than persistent backend API.

---

### 33. Phase 1 Exit Decision

All 33 required audit dimensions have been thoroughly investigated, proven against database schema and source code, and cataloged.

**PLAN 02 PHASE 1 STATUS: GO FOR PHASE 2 — CREATION WORKFLOW REDESIGN**
