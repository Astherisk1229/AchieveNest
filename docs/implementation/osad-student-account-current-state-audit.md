# AchieveNest — OSAD Student Account Management & Student Data Completeness
## Plan 03 Phase 1: Current-State Audit Report
**Authoritative Discovery, Code Tracing & Defect Reproduction Report**

---

### 1. Executive Summary

Phase 1 conducted a comprehensive audit of the OSAD Student Accounts management interface, the student directory table, the Add Student Account trigger and modal workflow, backend API routes, provisioning pipelines, and database schemas.

Key findings:
1. **Add Student Account Modal Defect (Reproduced & Proven Root Cause)**:
   - In `OSADStudentAccountsPage.jsx` (lines 202–210), the `Add Student Account` button is hardcoded with `onClick={() => showToast && showToast('Add Student Account Modal Opened')}`.
   - No modal component (such as `AddStudentModal` or `CreateStudentModal`) is imported, instantiated, or mounted anywhere in `OSADStudentAccountsPage.jsx` or `OSADDashboardPage.jsx`.
   - The defect is an unmounted component / stub handler defect rather than a portal or z-index rendering failure.
2. **Student Directory Table Completeness Gaps**:
   - Currently rendered columns: `Name`, `Student ID`, `College`, `Academic Program`, `Actions` (5 columns).
   - Missing required columns: `Institutional Email`, `Sex`, `Year Level`, `Enrollment Status`, `Account Status`.
3. **Data Sources & Projections**:
   - `Sex`: Neither present in `OSADStudentAccountsPage` table nor in `profiles` table schema in `achievenest_local`. Awards domain references `gender_restriction`/`gender_requirement`, but `profiles.sex` has not been added to the local MySQL schema.
   - `Year Level`: Present in `student_profiles.year_level` (current cache) and `student_program_enrollments.year_level` (historical authority). Synchronized with 0 cache drift. Present in `OSADController.js` in-memory store but omitted from the UI table headers and row cells.
   - `Academic Program`: Derived from `student_program_enrollments.academic_program_id` referencing `academic_programs`.
4. **Provisioning Endpoint & Backend Architecture**:
   - `POST /api/v1/provisioning/manual-student` is handled by `TargetProvisioningController::manualStudent`.
   - Provisions `profiles`, `student_profiles`, `student_program_enrollments`, `profile_roles`, and `local_auth_credentials` in a transactional block with compensating auth deletion.

---

### 2. Repository Baseline

- **Repository Branch**: `audit/project-architecture-linkage`
- **Git HEAD**: `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`
- **Audit Timestamp**: `2026-09-01T12:25:00+08:00`
- **Database**: `achievenest_local` (MySQL on local WAMP stack)
- **PHP CLI**: `C:\wamp64\bin\php\php8.2.29\php.exe`

---

### 3. Student Accounts Page

- **File**: `frontend/src/pages/osad-admin/OSADStudentAccountsPage.jsx`
- **Parent Container**: `frontend/src/pages/osad-admin/OSADDashboardPage.jsx` (mounted when `activeTab === 'accounts'`)
- **Page Header**:
  - Title: `Student Accounts Directory`
  - Icon: `Users` (emerald `#16834a`)
  - Subtitle: `Manage Student accounts, Academic Program placement, portfolio access, and password-reset requests.`
  - Primary Action Button: `Add Student Account` (`UserPlus` icon)
- **Sub-Tabs**:
  1. `Student Directory` (active by default)
  2. `Password Reset Requests` (with pending count badge)

---

### 4. Current Table Columns

| Column Header | Header Key / Sort | Cell Content | Formatter / Style |
|---|---|---|---|
| `Name` | `name` (sortable) | `formatLastNameFirst(user.full_name)` | Bold `text-slate-900` |
| `Student ID` | `id` (sortable) | `user.student_id \|\| user.email` | Monospace `font-mono font-semibold` |
| `College` | N/A | `user.college` | Bold uppercase emerald badge |
| `Academic Program` | N/A | `user.program` | Regular text `text-slate-800` |
| `Actions` | N/A | `MoreVertical` dropdown menu | `View Portfolio`, `Reset Password` |

**Total Columns Rendered**: 5.

---

### 5. Sex Display & Source

- **Visible in UI Table**: **NO** (column absent).
- **In-Memory Store (`OSADController.#users`)**: No `sex` or `gender` field populated.
- **Backend Table (`profiles`)**: Column `sex` does NOT exist in MySQL table `profiles`.
- **Finding**: Sex is missing across frontend UI, controller in-memory mock data, and MySQL database table.

---

### 6. Year Level Display & Source

- **Visible in UI Table**: **NO** (column absent).
- **In-Memory Store (`OSADController.#users`)**: Populated on mock objects (`year_level: '1st Year'`, `'2nd Year'`, `'3rd Year'`, `'4th Year'`).
- **Database Source of Truth**:
  - `student_program_enrollments.year_level` (historical enrollment authority).
  - `student_profiles.year_level` (current-state cache).
- **Consistency**: 0 discrepancies found between active enrollments and student profile caches.

---

### 7. Program Display & Enrollment Source

- **Visible in UI Table**: **YES** (`user.program` displayed).
- **Database Source of Truth**: `academic_programs.name` referenced through `student_program_enrollments.academic_program_id`.

---

### 8. Add Student Account Trigger

- **Location**: `OSADStudentAccountsPage.jsx` lines 202–210.
- **Code**:
  ```jsx
  <button
    type="button"
    onClick={() => showToast && showToast('Add Student Account Modal Opened')}
    className="px-3.5 py-2 rounded-lg bg-[#1B4D3E] hover:bg-[#143B30] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer self-start sm:self-auto shrink-0"
  >
    <UserPlus className="w-4 h-4" />
    <span>Add Student Account</span>
  </button>
  ```
- **Finding**: Button directly triggers a toast notification rather than setting a boolean modal state.

---

### 9. Modal Defect Reproduction

1. **Reproduction Action**: Navigate to `/osad-dashboard?tab=accounts` and click `Add Student Account`.
2. **Expected Behavior**: A modal dialog opens allowing entry of student account fields (Institutional ID, First/Last Name, Email, Sex, Academic Program, Year Level).
3. **Actual Behavior**: A green toast banner appears stating `"Add Student Account Modal Opened"`. No modal or backdrop appears in the DOM.

---

### 10. Modal Component Audit

- **Search in `frontend/src/pages/osad-admin/modals`**:
  - Found: `AddProgramScopeModal`, `AwardEvaluationSummaryModal`, `CampusJournalismScoringBasisModal`, `CreateCollegeModal`, `CreateOrganizationModal`, `CreateProgramModal`, `EditOrganizationModal`, `EditProgramModal`, `ManagePersonnelProgramsModal`, `PersonnelSelectorModal`.
  - **Student Creation Modal**: `0 files found`.
- **Finding**: No dedicated modal component exists for creating a student account.

---

### 11. Portal / Z-Index / Runtime Audit

- **DOM Inspection**: No modal container is attached or hidden via CSS `z-index` or `display: none`.
- **Console Errors**: 0 console errors (the button triggers valid JavaScript).
- **Root Cause Classification**: **STUB_HANDLER_AND_MISSING_COMPONENT**.

---

### 12. Modal Accessibility

- Modals implemented in the OSAD domain (`CreateCollegeModal`, `CreateOrganizationModal`, etc.) use `useConfirmableClose`, accessible keyboard escape handlers, and visible focus rings.
- The student creation modal will need to adopt these established patterns in Phase 3.

---

### 13. Student List API

- **Endpoint**: `OSADController::getUsers('student', searchTerm, collegeFilter, sortBy)`.
- **Query Filter**: Filters in-memory student objects by role (`student`), college code, search term (name, student ID, email, program), and sorts by last name or ID.

---

### 14. Create Student API

- **Route**: `POST /api/v1/provisioning/manual-student`
- **Controller**: `App\Controllers\Api\TargetProvisioningController::manualStudent`
- **Authorization**: `isOsad = (account_type === 'osad_admin' && in_array('osad_staff', roles))`
- **Accepted Request Fields**:
  - `institutional_id` (required, string)
  - `institutional_email` (required, string, `@ndmu.edu.ph`)
  - `first_name` (required, string)
  - `last_name` (required, string)
  - `middle_name` (optional, string)
  - `suffix` (optional, string)
  - `academic_program_id` / `degree_program_id` (required, valid UUID)
  - `year_level` (optional, default: `'1st Year'`)
  - `academic_year` (optional, default: `'2025-2026'`)

---

### 15. Provisioning Flow

```text
[POST /api/v1/provisioning/manual-student]
  │
  ├── 1. Resolve & Authorize Actor (OSAD Admin)
  ├── 2. Validate Required Fields & @ndmu.edu.ph domain
  ├── 3. Validate Academic Program (Active & Exists in academic_programs)
  ├── 4. Duplicate Check on profiles (institutional_id OR email)
  ├── 5. Generate Temporary Password (ValidationHelper::generateTemporaryPassword)
  ├── 6. Create Auth User (Supabase Auth or Local UUID)
  │
  └── 7. DB Transaction (transStart):
         ├── Insert profiles (id = authUserId)
         ├── Insert student_profiles (profile_id, year_level, enrollment_status='enrolled')
         ├── Insert student_program_enrollments (is_active=1, academic_program_id, year_level)
         ├── Insert profile_roles (role='student')
         ├── Insert local_auth_credentials (password_hash)
         ├── Insert account_lifecycle_events ('provisioned')
         └── Insert account_lifecycle_events ('activated')
```

---

### 16. Transaction & Compensation Behavior

- **DB Rollback**: `db->transRollback()` on any exception.
- **Compensating Auth Deletion**: If Supabase Auth identity was created prior to DB failure, `adminAuthService->deleteUser($authUserId)` executes to prevent orphan auth identities.

---

### 17. Duplicate Institutional ID & Email Validation

- Checked at DB level:
  ```php
  $duplicate = $db->table('profiles')
      ->where('institutional_id', $instId)
      ->orWhere('email', $email)
      ->get()->getRowArray();
  ```
- Returns HTTP `409 Conflict` (`DUPLICATE_ACCOUNT`).

---

### 18. Sex Validation

- Currently unvalidated during student provisioning because `sex` is not an accepted parameter in `TargetProvisioningController::manualStudent`.

---

### 19. Year Level Validation

- Defaults to `'1st Year'` if omitted; accepted values in system: `'1st Year'`, `'2nd Year'`, `'3rd Year'`, `'4th Year'`, `'5th Year'`, `'Graduate'`.

---

### 20. Academic Program Validation

- Enforces valid UUID format and checks `academic_programs` table for active status.

---

### 21. Authorization

- Protected by OSAD Admin role check:
  `$isOsad = (($actor['profile']['account_type'] ?? '') === 'osad_admin' && in_array('osad_staff', $actor['roles'], true));`
- Unauthorized callers receive HTTP 403 Forbidden.

---

### 22. Database Schema

#### `profiles` Table
- `id` (char 36, PK)
- `institutional_id` (varchar 50, NOT NULL)
- `account_type` (varchar 30, NOT NULL)
- `email` (varchar 255, NOT NULL)
- `full_name` (varchar 255, NOT NULL)
- `first_name` (varchar 100, NULL)
- `middle_name` (varchar 100, NULL)
- `last_name` (varchar 100, NULL)
- `designation_title` (varchar 150, NULL)
- `avatar_url` (text, NULL)
- `status` (varchar 20, NOT NULL)
- `must_change_password` (tinyint 1, NOT NULL)
- `password_hash` (varchar 255, NULL)
- `created_at` (datetime)
- `updated_at` (datetime)

#### `student_profiles` Table
- `profile_id` (char 36, PK, FK -> `profiles.id`)
- `year_level` (varchar 20, NULL)
- `enrollment_status` (varchar 30, NOT NULL)
- `created_at` (datetime)
- `updated_at` (datetime)

#### `student_program_enrollments` Table
- `id` (char 36, PK)
- `student_profile_id` (char 36, NOT NULL, FK -> `student_profiles.profile_id`)
- `academic_program_id` (char 36, NOT NULL, FK -> `academic_programs.id`)
- `year_level` (varchar 20, NOT NULL)
- `academic_year` (varchar 20, NOT NULL)
- `effective_from` (date, NOT NULL)
- `effective_until` (date, NULL)
- `is_active` (tinyint 1, NOT NULL)
- `created_at` (datetime)
- `updated_at` (datetime)

---

### 23. Cache Consistency

- Checked `student_profiles.year_level` vs active `student_program_enrollments.year_level`.
- **Result**: `0 inconsistent rows` in database.

---

### 24. Search & Filters

- **Search**: Case-insensitive substring matching across `full_name`, `student_id`, `email`, `college`, and `program`.
- **Filters**:
  - College Dropdown: `All`, `CEAC`, `CBA`, `CAS`, `CED`.
  - Password Reset Request Status: `All`, `Pending`, `Approved`.

---

### 25. Row Actions

1. `View Portfolio` (`Eye` icon): Opens `OSAD Student Portfolio Inspector Modal` displaying verified points and accomplishments.
2. `Reset Password` (`KeyRound` icon): Opens `Reset Student Password Modal` with temporary password generator.

---

### 26. Loading / Empty / Error / Retry

- **Empty Directory**: Renders `"No student accounts found matching the filter criteria."`
- **Empty Requests**: Renders `"No password reset requests found matching your filter criteria."`
- **Error States**: Handled gracefully without breaking UI rendering.

---

### 27. Validation

- Frontend validates search inputs and password reset dialog forms.
- Server validates institutional ID format, `@ndmu.edu.ph` email domain, program UUID, and account existence.

---

### 28. Frontend Component Map

```text
OSADDashboardPage.jsx
└── OSADStudentAccountsPage.jsx (activeTab === 'accounts')
    ├── Page Header (Title + Add Student Account Button [Stub])
    ├── Toolbar (Sub-Tabs + Search Input + College Filter Dropdown)
    ├── Student Directory Table
    │   ├── Name Column
    │   ├── Student ID Column
    │   ├── College Column
    │   ├── Academic Program Column
    │   └── Actions Column (MoreVertical -> View Portfolio / Reset Password)
    ├── Pending Reset Requests Inbox View (when tab === 'requests')
    ├── Portfolio Inspector Modal (when viewingStudent is set)
    └── Reset Student Password Modal (when resetPasswordStudent is set)
```

---

### 29. Backend Route Map

| Method | Route | Controller | Method | Purpose |
|---|---|---|---|---|
| `POST` | `/api/v1/provisioning/manual-student` | `TargetProvisioningController` | `manualStudent` | Provision new student account |
| `POST` | `/api/v1/password-reset-requests` | `PasswordResetRequestController` | `submit` | Student submits reset request |
| `GET` | `/api/v1/password-reset-requests` | `PasswordResetRequestController` | `list` | OSAD lists reset requests |
| `POST` | `/api/v1/password-reset-requests/{id}/reset` | `PasswordResetRequestController` | `reset` | Issue temp password |

---

### 30. Service Map

- `TargetProvisioningController`: Canonical student provisioning controller.
- `OSADController.js`: Frontend state store and controller.
- `ValidationHelper.php`: Server-side temporary password generator and UUID validator.
- `SupabaseAdminAuthService.php`: Auth identity management service.

---

### 31. Source-of-Truth Matrix

| Business Fact | Authoritative Source of Truth | Current Status in DB/UI |
|---|---|---|
| Student Identity & Auth | `profiles` & `auth.users` | Authoritative |
| Institutional ID & Email | `profiles.institutional_id`, `profiles.email` | Authoritative |
| Sex | `profiles.sex` | Missing in MySQL table schema & UI |
| Current Year Level | `student_profiles.year_level` (Cache) / Active Enrollment | Consistent in DB; Missing in UI table |
| Historical Year Level | `student_program_enrollments.year_level` | Authoritative |
| Academic Program Scope | `student_program_enrollments.academic_program_id` | Authoritative |
| Account Status | `profiles.status` | Authoritative; Missing in UI table |
| Enrollment Status | `student_profiles.enrollment_status` | Authoritative; Missing in UI table |

---

### 32. Table Completeness Matrix

| Column | UI Present? | In-Memory Model Present? | DB Source Present? | Gap Classification |
|---|---|---|---|---|
| Institutional ID | YES | YES (`student_id`) | YES (`profiles.institutional_id`) | PASS |
| Student Name | YES | YES (`full_name`) | YES (`profiles.full_name`) | PASS |
| Email | NO | YES (`email`) | YES (`profiles.email`) | UI MISSING |
| Sex | NO | NO | NO | SCHEMA & UI GAP |
| Academic Program | YES | YES (`program`) | YES (`academic_programs.name`) | PASS |
| Year Level | NO | YES (`year_level`) | YES (`student_profiles.year_level`) | UI MISSING |
| Enrollment Status | NO | NO | YES (`student_profiles.enrollment_status`) | UI MISSING |
| Account Status | NO | YES (`status`) | YES (`profiles.status`) | UI MISSING |
| Actions | YES | N/A | N/A | PASS |

---

### 33. Provisioning Integrity Matrix

| Step | Component Owner | Transactional? | Rollback / Compensation | Evidence |
|---|---|---|---|---|
| Auth Identity | `SupabaseAdminAuthService` | No (External Auth) | Deletes user on DB fail | Verified in `TargetProvisioningController` |
| Profile Master Data | `profiles` | YES (transStart) | DB rollback | Verified in `TargetProvisioningController` |
| Student Subtype | `student_profiles` | YES (transStart) | DB rollback | Verified in `TargetProvisioningController` |
| Initial Enrollment | `student_program_enrollments` | YES (transStart) | DB rollback | Verified in `TargetProvisioningController` |
| Student Role | `profile_roles` | YES (transStart) | DB rollback | Verified in `TargetProvisioningController` |
| Local Credentials | `local_auth_credentials` | YES (transStart) | DB rollback | Verified in `TargetProvisioningController` |
| Lifecycle Audit | `account_lifecycle_events` | YES (transStart) | DB rollback | Verified in `TargetProvisioningController` |

---

### 34. Key Findings

1. **UI Finding 1 (Stub Trigger)**: The Add Student Account button in `OSADStudentAccountsPage.jsx` does not open a modal, but only displays a toast message.
2. **UI Finding 2 (Missing Columns)**: The student table lacks `Sex`, `Year Level`, `Email`, and `Status` columns.
3. **Backend Finding 1 (Sex Field Status)**: In `achievenest_local`, the `profiles` table has no `sex` column.
4. **Backend Finding 2 (Year Level Cache)**: `student_profiles.year_level` and `student_program_enrollments.year_level` are 100% consistent with zero cache drift.
5. **Backend Finding 3 (Provisioning Pipeline)**: `TargetProvisioningController::manualStudent` is fully transactional and ready for integration.

---

### 35. Root-Cause Summary of Modal Defect

- **Observed Symptom**: Clicking `Add Student Account` shows a toast banner but no modal appears.
- **Reproduction Path**: OSAD Dashboard -> Student Accounts tab -> Click `Add Student Account`.
- **Root Cause**: `OSADStudentAccountsPage.jsx` has a stub `onClick` handler (`showToast('Add Student Account Modal Opened')`) and lacks an imported/mounted modal component.
- **Remediation Target (Phase 3 & Phase 4)**: Implement `CreateStudentModal.jsx` in `frontend/src/pages/osad-admin/modals/`, mount it in `OSADStudentAccountsPage.jsx`, and wire it to persistent API provisioning.

---

### 36. Phase 1 Exit Decision

All 36 required audit items, schema inspections, code tracings, and defect reproductions have been completed with exact source evidence. Zero code changes or schema mutations were performed.

**PLAN 03 PHASE 1 STATUS: GO FOR PHASE 2 — STUDENT TABLE DATA CONTRACT**
