# AchieveNest — OSAD Student Account Management & Student Data Completeness
## Plan 03 Phase 2: Student Table Data Contract
**Authoritative Projection Specification & Source-of-Truth Reconciliation**

---

### 1. Executive Summary

Phase 2 establishes the authoritative data contract for the OSAD Student Accounts Directory table.

Key determinations:
- **Table Columns Defined**: The complete table structure will feature `Name`, `Student ID`, `Email`, `Sex` *(conditioned on remediation)*, `College`, `Academic Program`, `Year Level`, `Enrollment Status`, `Account Status`, and `Actions`.
- **Authoritative Data Ownership**:
  - `Institutional ID`, `Student Name`, `Email`, `Account Status`: Owned by `profiles`.
  - `Academic Program`: Derived from active `student_program_enrollments.academic_program_id` joined to `academic_programs.name`.
  - `Year Level`: Historical authority is `student_program_enrollments.year_level`; high-frequency display cache is `student_profiles.year_level` (verified 100% consistent with 0 drift).
  - `Enrollment Status`: Owned by `student_profiles.enrollment_status`.
- **Critical Sex Reconciliation**:
  - Classified as an **`IMPLEMENTATION GAP`**.
  - While architectural specifications designate `profiles.sex` as the sole authority, the column is absent from local MySQL `profiles` table.
  - No dummy or duplicate `student_profiles.sex` will be introduced. Phase 2 formally records `profiles.sex` schema remediation as an explicit prerequisite dependency for Phase 5.

---

### 2. Phase 1 Verified Baseline

- **Directory Table**: 5 rendered columns (`Name`, `Student ID`, `College`, `Academic Program`, `Actions`).
- **Modal Defect**: Stub `onClick` handler (`showToast`) and missing modal component in `modals/`.
- **Year Level Cache Consistency**: 0 inconsistent rows between `student_profiles.year_level` and active `student_program_enrollments.year_level`.
- **Duplicate Authorities**: 0 duplicate Sex authorities, 0 duplicate Year Level authorities.
- **Provisioning**: Backend endpoint `POST /api/v1/provisioning/manual-student` is transactional.

---

### 3. Current Table

Currently rendered in `frontend/src/pages/osad-admin/OSADStudentAccountsPage.jsx`:
- `Name`: `formatLastNameFirst(user.full_name)`
- `Student ID`: Monospace `user.student_id`
- `College`: Emerald badge `user.college`
- `Academic Program`: `user.program`
- `Actions`: `MoreVertical` action menu (`View Portfolio`, `Reset Password`)

---

### 4. Final Table Column Contract

| Order | Column Header | Display Content | Source of Truth |
|---|---|---|---|
| 1 | `Name` | Last Name First (`formatLastNameFirst(user.full_name)`) | `profiles.full_name` |
| 2 | `Student ID` | Official Institutional ID (e.g. `202310492`) | `profiles.institutional_id` |
| 3 | `Email` | Institutional Email (e.g. `user@ndmu.edu.ph`) | `profiles.email` |
| 4 | `Sex` | Sex label (`Male` / `Female` / `—`) | `profiles.sex` *(Phase 5 Remediation)* |
| 5 | `College` | Academic College code badge (`CEAC`, `CBA`, `CAS`, `CED`) | `colleges.code` via `academic_programs` |
| 6 | `Academic Program` | Degree Program title (e.g. `BS Computer Science`) | `academic_programs.name` |
| 7 | `Year Level` | Academic Standing (e.g. `1st Year`, `2nd Year`, etc.) | `student_profiles.year_level` |
| 8 | `Enrollment Status` | Enrollment badge (`Enrolled`, `Leave of Absence`, etc.) | `student_profiles.enrollment_status` |
| 9 | `Account Status` | System access state badge (`Active`, `Suspended`, etc.) | `profiles.status` |
| 10 | `Actions` | Contextual menu (`View Portfolio`, `Reset Password`) | UI Action Handlers |

---

### 5. Institutional ID

- **Display Label**: `Student ID`
- **Canonical Key**: `institutional_id` (also aliased to `student_id` for backward compatibility)
- **Authority**: `profiles.institutional_id`
- **Constraint**: Unique, non-empty, institution-supplied.

---

### 6. Student Name

- **Display Label**: `Name`
- **Canonical Key**: `full_name`
- **Authority**: `profiles.full_name` (or `first_name` + `middle_name` + `last_name` + `suffix`)
- **Formatting**: `formatLastNameFirst` helper in `nameFormatter.js`.

---

### 7. Email

- **Display Label**: `Email`
- **Canonical Key**: `email` (aliased from `institutional_email`)
- **Authority**: `profiles.email`
- **Privacy Scope**: Restricted to institutional `@ndmu.edu.ph` email; no private personal emails or auth credentials exposed.

---

### 8. Sex Source Reconciliation

- **Parent Plan Expectation**: `profiles.sex` is authoritative.
- **Phase 1 Audit Evidence**: `profiles.sex` does not exist in local MySQL schema `achievenest_local`.
- **Classification**: **`IMPLEMENTATION GAP`**.
- **Resolution Strategy**:
  - `profiles.sex` remains the target authoritative field.
  - Zero mock, hardcoded, or duplicate subtype columns (`student_profiles.sex`) will be created.
  - In frontend table rendering, `sex` displays `—` if null/missing until Phase 5 backend migration applies `profiles.sex`.

---

### 9. Academic Program

- **Display Label**: `Academic Program`
- **Canonical Key**: `program` (and `academic_program_id`)
- **Authority**: `academic_programs.name` referenced by active `student_program_enrollments`.
- **Fallback**: If unassigned, displays `No active enrollment`.

---

### 10. Current Enrollment Resolution

- Backend resolves the current active degree program via:
  ```sql
  SELECT spe.*, ap.name AS program_name, ap.code AS program_code, ap.college_id, c.code AS college_code
  FROM student_program_enrollments spe
  JOIN academic_programs ap ON ap.id = spe.academic_program_id
  LEFT JOIN colleges c ON c.id = ap.college_id
  WHERE spe.student_profile_id = ? AND spe.is_active = 1
  LIMIT 1;
  ```

---

### 11. Year Level

- **Display Label**: `Year Level`
- **Canonical Key**: `year_level`
- **Historical Authority**: `student_program_enrollments.year_level`
- **Current Display Cache**: `student_profiles.year_level`
- **Allowed Controlled Domain**: `'1st Year'`, `'2nd Year'`, `'3rd Year'`, `'4th Year'`, `'5th Year'`, `'Graduate'`.

---

### 12. Enrollment Status

- **Display Label**: `Enrollment Status`
- **Canonical Key**: `enrollment_status`
- **Authority**: `student_profiles.enrollment_status`
- **Domain Values**: `'enrolled'`, `'leave_of_absence'`, `'graduated'`, `'withdrawn'`.
- **Badge Styling**: Emerald for `enrolled`, Amber for `leave_of_absence`, Slate for others.

---

### 13. Account Status

- **Display Label**: `Account Status`
- **Canonical Key**: `status` / `account_status`
- **Authority**: `profiles.status`
- **Domain Values**: `'active'`, `'suspended'`, `'archived'`, `'provisioned'`.
- **Isolation**: Strictly separated from academic `enrollment_status`.

---

### 14. Actions

- **Trigger**: `MoreVertical` icon button in table row cell.
- **Actions**:
  1. `View Portfolio`: Opens portfolio inspector modal.
  2. `Reset Password`: Opens password reset modal with temporary credential generator.

---

### 15. API Projection

- All student account listing queries return a normalized array of student objects matching the contract schema:
  ```typescript
  interface StudentAccountRow {
    id: string;
    institutional_id: string;
    full_name: string;
    email: string;
    sex: string | null;
    college: string;
    college_id: string | null;
    program: string;
    academic_program_id: string | null;
    year_level: string;
    enrollment_status: string;
    status: string;
  }
  ```

---

### 16. Field Naming

- Canonical names are strictly enforced to eliminate ambiguity:
  - `institutional_id` for Student ID
  - `full_name` for Name
  - `email` for Institutional Email
  - `sex` for Sex
  - `program` for Degree Program Name
  - `year_level` for Year Level
  - `enrollment_status` for Academic Enrollment Status
  - `status` for User Account Status

---

### 17. Null Handling

| Field | Null / Empty Fallback Display |
|---|---|
| Student ID | `—` |
| Student Name | `Unnamed Student` |
| Email | `—` |
| Sex | `—` |
| College | `—` |
| Academic Program | `No active enrollment` |
| Year Level | `—` |
| Enrollment Status | `Unassigned` |
| Account Status | `Active` |

---

### 18. Search Contract

- Case-insensitive substring matching against:
  1. `full_name` (and formatted `Last, First Middle`)
  2. `institutional_id` / `student_id`
  3. `email`
  4. `program`

---

### 19. Filter Contract

1. **College Filter**: Dropdown filtering by `All`, `CEAC`, `CBA`, `CAS`, `CED`.
2. **Year Level Filter**: Future filter by `All`, `1st Year`, `2nd Year`, `3rd Year`, `4th Year`, `5th Year`.
3. **Reset Request Status**: Dropdown filtering by `All`, `Pending`, `Approved`.

---

### 20. Responsive Column Priority

- **Desktop (>= 1280px)**: All 10 columns visible (`Name`, `Student ID`, `Email`, `Sex`, `College`, `Program`, `Year Level`, `Enrollment`, `Status`, `Actions`).
- **Laptop / Tablet (768px - 1024px)**: `Name`, `Student ID`, `Program`, `Year Level`, `Status`, `Actions` (with horizontal scroll enabled for full table).
- **Mobile (< 768px)**: Card stack representation with Name, ID, Program, Year Level, and Actions button.

---

### 21. Loading / Empty / Error States

- **Loading**: Shimmer table skeleton.
- **Empty Directory**: `"No student accounts found matching the filter criteria."`
- **Empty Search**: `"No student accounts found matching \"<term>\"."`
- **Error**: Error card with error description and `Retry Loading Accounts` button.

---

### 22. Security & Sensitive Data Exclusions

- Table projections MUST NEVER include:
  - `password_hash`
  - Temporary passwords
  - Supabase Auth tokens / JWTs
  - Recovery tokens
  - Internal salt / security metadata

---

### 23. N+1 Prevention

- Backend list queries MUST use a single joined query:
  `profiles` LEFT JOIN `student_profiles` LEFT JOIN active `student_program_enrollments` LEFT JOIN `academic_programs` LEFT JOIN `colleges`.

---

### 24. Source-of-Truth Matrix

| Business Fact | Authoritative Source | Projection Source | Status |
|---|---|---|---|
| Student Identity | `profiles.id` | `id` | VERIFIED |
| Student ID | `profiles.institutional_id` | `institutional_id` | VERIFIED |
| Student Name | `profiles.full_name` | `full_name` | VERIFIED |
| Institutional Email | `profiles.email` | `email` | VERIFIED |
| Sex | `profiles.sex` | `sex` | GAP IDENTIFIED (Phase 5 Remediation) |
| Academic Program | `academic_programs.name` | `program` | VERIFIED |
| Year Level | `student_program_enrollments.year_level` | `year_level` (via cache) | VERIFIED |
| Enrollment Status | `student_profiles.enrollment_status` | `enrollment_status` | VERIFIED |
| Account Status | `profiles.status` | `status` | VERIFIED |

---

### 25. Database / Documentation Drift Finding

- **Investigation**: Audited `backend/app/Database/Migrations/2026-08-21-000001_CreateIdentityAndAcademicFoundation.php`, audit reports in `docs/database-audit/`, and MySQL schema.
- **Result**: `profiles.sex` is documented as the single source of truth across architectural audits, but was omitted from the database migration.
- **Impact**: Classified as `IMPLEMENTATION GAP`. Cleanly resolved by scheduling `ALTER TABLE profiles ADD COLUMN sex VARCHAR(20) NULL` in Phase 5 without polluting intermediate phases.

---

### 26. Phase 3 Handoff

- Phase 3 will implement and fix the `Add Student Account` modal trigger and modal component in `frontend/src/pages/osad-admin/modals/CreateStudentModal.jsx`.
- Modal form inputs will align with the field contract established in this document.

---

### 27. Phase 4 & Phase 5 Dependencies

- **Phase 4 (Creation Form)**: Form fields collect `institutional_id`, `first_name`, `last_name`, `email`, `academic_program_id`, `year_level`, and `sex`.
- **Phase 5 (Backend Integration & Remediation)**: Adds `profiles.sex` column to MySQL schema and updates `TargetProvisioningController::manualStudent` to persist sex transactionally.

---

### 28. Decision Register

| Decision Item | Final Resolution |
|---|---|
| Institutional ID Column | INCLUDE |
| Student Name Column | INCLUDE |
| Email Column | INCLUDE |
| Sex Column | INCLUDE (with neutral fallback `—` until Phase 5 remediation) |
| Academic Program Column | INCLUDE |
| Year Level Column | INCLUDE |
| Enrollment Status Column | INCLUDE |
| Account Status Column | INCLUDE |
| College Column | RETAIN (as badge for college filter continuity) |
| Duplicate Sex Authorities | 0 (Strictly prohibited) |
| Duplicate Year Level Authorities | 0 (Strictly prohibited) |

---

### 29. Acceptance Criteria

- [x] Final table columns and labels defined.
- [x] Authoritative database source for every column documented.
- [x] Critical Sex source-of-truth gap reconciled as `IMPLEMENTATION GAP`.
- [x] Zero duplicate authorities introduced.
- [x] API row projection schema normalized.
- [x] Null and fallback rules defined.
- [x] Search, filter, and responsive behaviors specified.
- [x] Sensitive fields excluded.
- [x] Phase 3, 4, and 5 handoffs and dependencies established.

---

### 30. Exit Decision

All table columns, API projection shapes, source-of-truth mappings, and Sex discrepancy reconciliation rules are fully defined.

**PLAN 03 PHASE 2 STATUS: GO WITH SEX REMEDIATION DEPENDENCY FOR PHASE 3 — FIX ADD STUDENT ACCOUNT MODAL**
