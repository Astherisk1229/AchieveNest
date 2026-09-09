# AchieveNest — OSAD Organization Creation & Management
## Plan 02 Phase 3: Backend Transaction Design Report
**Authoritative Backend Implementation & Transaction Verification Report**

---

### 1. Executive Summary

Phase 3 implemented and verified the transactional backend architecture for Student Organization Creation and Management in OSAD.

Key accomplishments:
- **Unified Transactional Creation**: `OrganizationService::createOrganization` executes an atomic MySQL transaction encompassing `organizations` master data, `organization_program_affiliations` relational rows, and `organization_moderator_assignments` initial tenure records.
- **Deduplication & Validation**: Submitted program IDs are deduplicated and validated against parent college matching. Inactive or non-existent programs/moderators cause an immediate transaction rollback.
- **Normalization Preserved**: Relationships remain normalized in relational tables. No moderator or program data is redundantly copied as text into `organizations`.
- **Soft Deactivation & History**: `OrganizationService::assignModerator` implements soft deactivation (`is_active = 0`, `effective_until = CURRENT_DATE`), preserving full historical tenure.
- **Automated Verification**: CLI test suite `verify:phase3-org-transaction` verified 9/9 transactional test cases with 0 failures, and all 26 previous regression tests passed 100%.

---

### 2. Repository Baseline

- **Repository Branch**: `audit/project-architecture-linkage`
- **Git HEAD**: `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`
- **Database**: `achievenest_local` (MySQL on local WAMP stack, port 3306)
- **PHP CLI**: `C:\wamp64\bin\php\php8.2.29\php.exe`

---

### 3. Canonical Service

- **Authoritative Service**: `App\Services\OrganizationService` (`backend/app/Services/OrganizationService.php`)
- **Authoritative Controller**: `App\Controllers\Api\OrganizationController` (`backend/app/Controllers/Api/OrganizationController.php`)
- **Independent Creation Services**: 1 (All organization creation paths funnel through `OrganizationService::createOrganization`).

---

### 4. Route Matrix

| Method | Endpoint | Controller Action | Description | Authorization |
|---|---|---|---|---|
| `GET` | `/api/v1/osad/organizations` | `OrganizationController::index` | Lists all organizations with joined program scope and active moderator | OSAD Staff / Admin |
| `GET` | `/api/v1/osad/organizations/{id}` | `OrganizationController::show` | Retrieves single organization with normalized scope and moderator | OSAD Staff / Admin |
| `POST` | `/api/v1/osad/organizations` | `OrganizationController::create` | Atomically creates organization with optional program affiliations and moderator | OSAD Staff / Admin |
| `POST` | `/api/v1/osad/organizations/{id}/moderator` | `OrganizationController::assignModerator` | Assigns or reassigns moderator with soft-deactivation history | OSAD Staff / Admin |
| `GET` | `/api/v1/osad/organizations/{id}/logo` | `OrganizationController::logo` | Streams organization logo binary asset | Public / Authenticated |
| `POST` | `/api/v1/osad/organizations/{id}/logo` | `OrganizationController::updateLogo` | Uploads/replaces logo asset | OSAD Staff / Admin |
| `DELETE` | `/api/v1/osad/organizations/{id}/logo` | `OrganizationController::deleteLogo` | Removes logo asset & metadata | OSAD Staff / Admin |

---

### 5. Creation Request Contract

- **Endpoint**: `POST /api/v1/osad/organizations`
- **Payload Format**: `application/json` or `multipart/form-data`:
```json
{
  "name": "Computer Science Society",
  "code": "CSS",
  "category": "academic_college",
  "scope": "program",
  "college_id": "20000000-0000-0000-0000-000000000001",
  "program_ids": ["30000000-0000-0000-0000-000000000001"],
  "moderator_profile_id": "40000000-0000-0000-0000-000000000001"
}
```

---

### 6. Organization Validation

- Required fields: `name`, `code`, `category`, `scope`.
- Allowed categories: `academic_college`, `co_curricular`, `special_interest`, `socio_cultural`, `religious`, `sports`, `student_council`.
- Allowed scopes: `university`, `college`, `program`.
- Code uniqueness: Verified against `organizations.code`.
- Max lengths: `name` <= 150 chars, `code` <= 30 chars.

---

### 7. Program Scope Validation

- `scope === 'university'`: `college_id = null`, `program_ids = []`.
- `scope === 'college'`: `college_id` required, `program_ids = []`.
- `scope === 'program'`: `college_id` required, `program_ids` required (>= 1).
- All submitted `program_ids` must exist, be active, and belong to the selected `college_id`.
- Duplicate program IDs in request are automatically deduplicated.

---

### 8. Moderator Validation

- Optional globally (`moderator_profile_id = null` permitted).
- If provided: profile must exist, have `status = 'active'`, and `account_type IN ('personnel', 'hr_admin', 'osad_admin')`.
- For college/program scopes: personnel must have an active affiliation with the parent college.

---

### 9. Transaction Sequence

1. Authorize actor via `GovernancePolicy::canManageOrganizations`.
2. Validate master data, program scope, and moderator eligibility.
3. If logo provided, validate MIME type (JPEG, PNG, WebP) and stage file in storage.
4. `START TRANSACTION`
5. `INSERT INTO organizations`
6. `INSERT INTO organization_program_affiliations` (for each deduplicated program ID)
7. `INSERT INTO organization_moderator_assignments` (if moderator selected)
8. `COMMIT`
9. On any failure: `ROLLBACK` and cleanup staged logo file.

---

### 10. Audit & Event Behavior

- `assigned_by` tracks the authenticated OSAD administrator's profile ID on assignment creation and reassignment.
- Timestamps recorded with microsecond precision (`CURRENT_TIMESTAMP(6)`).

---

### 11. Error Contracts

- Validation failures return HTTP 422 with structured code `VALIDATION_FAILED`.
- Unauthorized requests return HTTP 403 `FORBIDDEN`.
- Duplicate code or unique constraint violations return descriptive 422 validation messages.

---

### 12. Response Contract

HTTP 201 response includes:
- `organization`: Master row with joined college info.
- `program_scope`: Normalized array of affiliated program objects (`id`, `code`, `name`, `college_id`, `college_code`, `college_name`).
- `current_moderator`: Normalized moderator profile object (`profile_id`, `full_name`, `email`, `employee_id`, `designation`) or `null`.
- `configuration_status`: `'COMPLETE'` or `'PARTIALLY_CONFIGURED'`.

---

### 13. Rollback Tests

- **Invalid Program Rollback**: Verified that an invalid program ID fails the entire request and persists 0 rows in `organizations`.
- **Invalid Moderator Rollback**: Verified that an invalid moderator ID fails the request and persists 0 rows in `organizations`.
- **Duplicate Code Conflict**: Verified that attempting to insert a duplicate code is safely rejected before transaction commit.

---

### 14. Authorization

- Server-side authorization strictly enforced via `GovernancePolicy::canManageOrganizations($actor)`.
- Rejects non-OSAD sessions with HTTP 403 Forbidden.

---

### 15. DB Constraint Preservation

- `organizations.code` unique key preserved.
- `uq_org_program` composite unique key in `organization_program_affiliations` preserved.
- `uq_active_org_moderator` virtual guard constraint in `organization_moderator_assignments` preserved.
- All foreign keys (`colleges`, `academic_programs`, `profiles`) preserved.

---

### 16. In-Memory Path Replacement

- `OrganizationService::assignModerator` now provides the canonical, persistent backend endpoint (`POST /api/v1/osad/organizations/{id}/moderator`).
- In Phase 4, the frontend `PersonnelSelectorModal` callback will be wired directly to this endpoint.

---

### 17. Backend Tests

Test command: `php spark verify:phase3-org-transaction`
Results:
- Test 1: Organization-only creation (University Scope) — **PASS**
- Test 2: Organization + Multiple Program Scope creation — **PASS**
- Test 3: Organization + Initial Moderator creation — **PASS**
- Test 4: Full Configuration (Program Scope + Programs + Moderator) — **PASS**
- Test 5: Duplicate Program IDs in creation payload (Deduplication) — **PASS**
- Test 6: Rollback on Invalid Program ID — **PASS**
- Test 7: Rollback on Invalid Moderator ID — **PASS**
- Test 8: Post-creation Moderator Reassignment & History Preservation — **PASS**
- Test 9: Uniqueness Constraint & Conflict Rejection — **PASS**

Total: **9 / 9 PASSED (100%)**

---

### 18. Phase 4 Handoff

Phase 4 (Frontend Implementation) will now:
1. Update `CreateOrganizationModal.jsx` to support the 4-step progressive workflow (Info, Scope, Moderator, Review) submitting to `POST /osad/organizations`.
2. Implement clickable Organization Cards and the **Organization Details View** (`OSADOrganizationDetailsView.jsx`).
3. Connect `PersonnelSelectorModal` directly to `POST /osad/organizations/{id}/moderator` to permanently replace the old mock memory callback.

---

### 19. Exit Decision

All backend transaction requirements, API contracts, authorization guards, and regression tests have been fulfilled.

**PLAN 02 PHASE 3 STATUS: GO FOR PHASE 4 — FRONTEND IMPLEMENTATION**
