# CHU-02 Phase 2A — HR Directory Architecture Audit

## Document Purpose
This document audits the HR Personnel Directory architecture, endpoints, data providers, and authorization boundaries under **CHU-02 Phase 2**.

---

## 1. Information Architecture & Navigation
- **Frontend Route**: `/hr/personnel-directory`
- **Frontend Page Component**: `HRPersonnelDirectoryPage.jsx`
- **Subcomponents**:
  - `PersonnelDirectoryHeader.jsx` — Header with summary counts and action triggers ("Register Personnel", "Batch Import (XLSX)").
  - `GovernanceTabs.jsx` — Tab selector switching between Personnel Directory and Password Resets Queue.
  - `PersonnelDirectoryTable.jsx` — Core data table rendering personnel profiles with search, multi-dimensional filters, sorting, and row action menus.
  - `FacultyDossierDrawer.jsx` — Slide-over detailed personnel drawer showing credentials, career milestones, achievements, and evaluation status.
  - `EditMasterDataModal.jsx` & `EditAssignmentModal.jsx` — Governance modals for rank title, status, and organizational affiliations.
  - `BatchImportPersonnelModal.jsx` — XLSX batch import modal.
- **Backend API Endpoint**: `GET /api/v1/hr/personnel`
- **Backend Controller**: `TargetHRPersonnelController::directory`

---

## 2. Supported Hierarchical Filters & Query Parameters
The backend endpoint supports server-side filtering without leaking unauthorized data:
1. `search` — Matches `p.full_name`, `p.institutional_id`, or `p.email`.
2. `college_id` — Filters by affiliated Academic College (e.g., CBA, CET).
3. `administrative_unit_id` — Filters by affiliated Administrative Unit (e.g., HR, OSAD).
4. `personnel_group` — `faculty` \| `non_teaching_faculty`.
5. `organizational_side` — `academic` \| `non_academic`.
6. `employment_status` — `permanent` \| `probationary`.
7. `faculty_engagement` — `full_time_faculty` \| `part_time_faculty`.
8. `status` — `active` \| `suspended` \| `archived`.

---

## 3. Server-Side Scope Enforcement
- **Authentication**: Requires valid Bearer JWT.
- **Authorization**: Restricts access exclusively to accounts with `account_type = 'hr_admin'` and active role `hr_staff`.
- **RBAC Policy**: Unauthorized roles (such as `student`, `dean`, or `personnel`) receive `403 FORBIDDEN` when accessing `/api/v1/hr/personnel`.
