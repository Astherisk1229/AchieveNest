# Personnel Evaluation Track — Plan D — Phase D1: Final Personnel Classification Model Implementation Report

## Executive Summary

Phase D1 of the Personnel Evaluation Track has successfully established the canonical HR-controlled personnel classification model. Every active personnel record in AchieveNest now resolves to exactly one valid **Personnel Group + Organizational Side** pair.

---

## 1. Authoritative Binding Classification Model

The canonical classification model is defined by two distinct, constrained fields on `personnel_profiles`:

| Field | Canonical Values | Storage / Representation |
|---|---|---|
| `personnel_group` | `faculty`, `non_teaching_faculty` | Constrained `VARCHAR(32)` |
| `organizational_side` | `academic`, `non_academic` | Constrained `VARCHAR(32)` |

### Approved Valid Combinations (3 Only)

| # | Personnel Group | Organizational Side | Canonical Code | Label |
|---|---|---|---|---|
| 1 | `faculty` | `academic` | `FACULTY_ACADEMIC` | Faculty • Academic |
| 2 | `non_teaching_faculty` | `academic` | `NON_TEACHING_FACULTY_ACADEMIC` | Non-Teaching Faculty • Academic |
| 3 | `non_teaching_faculty` | `non_academic` | `NON_TEACHING_FACULTY_NON_ACADEMIC` | Non-Teaching Faculty • Non-Academic |

### Rejected Combinations & Legacy Values

- **`faculty + non_academic`**: Strictly rejected at the database check constraint, domain service layer, API validation layer, and UI placement form.
- **Legacy 3rd Group (`non_teaching_personnel`, `staff`, etc.)**: Retired from active selection, rejected on API writes with `422 INVALID_PERSONNEL_CLASSIFICATION`.
- **Blank / Unrecognized / Client-Invented Values**: Rejected with `422 INVALID_PERSONNEL_CLASSIFICATION`.

---

## 2. Schema Migration & Rollback Safety

- **Migration File**: `backend/app/Database/Migrations/2026-09-08-000060_AddPersonnelGroupAndOrganizationalSide.php`
- **Additive Design**: Columns `personnel_group` and `organizational_side` were added additively without destructive drops.
- **Constraint**: `ck_personnel_valid_classification_pair` enforces the 3 valid pairs.
- **Index**: `idx_personnel_group_side` on `(personnel_group, organizational_side)` for directory and filter query performance.
- **Rollback Safety**: Reversible, non-destructive migration structure.

---

## 3. Backfill & Legacy Reconciliation Results

| Metric | Count | Details |
|---|---|---|
| **Total Active Records Examined** | 18 | `personnel_profiles` active dataset |
| **Backfilled: Faculty + Academic** | 12 | Teaching Faculty confirmed with College affiliations |
| **Backfilled: Non-Teaching Faculty + Non-Academic** | 6 | Administrative personnel confirmed with Unit affiliations |
| **Ambiguous / Quarantined Records** | 0 | All 18 records had authoritative unit/college assignments |
| **Legacy 3rd Group Active Records Remaining** | 0 | Zero active `non_teaching_personnel` |

---

## 4. Backend Implementation & Authorization (RBAC)

### 4.1 Domain Service (`App\Services\PersonnelClassificationService`)
- Central validator and resolver for classification rules.
- Method `validatePair(?string $group, ?string $side)` enforces canonical pairings and returns machine-readable `classification_code` and formatted `classification_label`.
- Method `resolveFromRecord(array $row)` provides canonical resolution with legacy fallback.

### 4.2 Controller & API Endpoints
- `GET /api/v1/hr/personnel`: Projects `personnel_group`, `organizational_side`, `classification_code`, `classification_label`. Supports query filters for `personnel_group` and `organizational_side`.
- `PUT /api/v1/hr/personnel/{id}/classification`:
  - Enforces HR-only access (`hr_staff` role required).
  - Personnel user mutation attempt returns `403 FORBIDDEN`.
  - Dean user mutation attempt returns `403 FORBIDDEN`.
  - Records structured audit events in `account_lifecycle_events` with prior and new classification state.
- `POST /api/v1/hr/provisioning/personnel`: Validates `personnel_group` and `organizational_side` on onboarding.

---

## 5. Frontend UI & Placement Form Integration

- **Onboarding Form (`OnboardPersonnelModal.jsx`)**:
  - Distinct radio selectors for Personnel Group (`Faculty`, `Non-Teaching Faculty`) and Organizational Side (`Academic`, `Non-Academic`).
  - Dynamic constraint: Selecting `Faculty` automatically disables `Non-Academic` with explanatory guidance.
- **Directory Table (`PersonnelDirectoryTable.jsx`)**:
  - Filter bar supports independent filtering by `Personnel Group` and `Organizational Side`.
  - Table rows render separate badges for Personnel Group and Organizational Side.
- **Dossier Drawer (`FacultyDossierDrawer.jsx`)**:
  - Displays canonical Personnel Classification (`Faculty • Academic`, etc.) and College / Unit affiliations.

---

## 6. Audit Trail Sample

Upon classification update by HR:
```json
{
  "event_type": "classification_updated",
  "performed_by": "10000000-0000-0000-0000-000000000001",
  "occurred_at": "2026-09-08 21:40:00",
  "reason": {
    "prior_group": "faculty",
    "prior_side": "academic",
    "new_group": "non_teaching_faculty",
    "new_side": "academic",
    "classification_code": "NON_TEACHING_FACULTY_ACADEMIC",
    "justification": "HR Admin updated personnel classification."
  }
}
```

---

## 7. Automated Test Suite & Regression Verification

### 7.1 Phase D1 Dedicated Test Suite
**File**: `frontend/src/controllers/__tests__/PersonnelClassificationD1.test.js` (12/12 passing)
- Valid pair: `Faculty + Academic` persists and derives `FACULTY_ACADEMIC`
- Valid pair: `Non-Teaching Faculty + Academic` persists and derives `NON_TEACHING_FACULTY_ACADEMIC`
- Valid pair: `Non-Teaching Faculty + Non-Academic` persists and derives `NON_TEACHING_FACULTY_NON_ACADEMIC`
- Rejection of invalid pair `Faculty + Non-Academic` with `422 INVALID_PERSONNEL_CLASSIFICATION`
- Rejection of legacy third-group values with `422 INVALID_PERSONNEL_CLASSIFICATION`
- HR-only mutation enforcement (`403 FORBIDDEN` for Personnel / Dean update attempts)
- Frontend `validatePersonnelPlacement` client-side pair constraint enforcement
- Canonical label formatting helper tests
- Plan C historical snapshot immutability verification

### 7.2 Master Regression Run
```text
Test Files  113 passed (113)
Tests       711 passed (711)
Duration    56.29s
```
- **Plan A**: Achievement upload, OCR scanning, and category classification tests passed 100%.
- **Plan B**: Portfolio working workspace and item reflection tests passed 100%.
- **Plan C**: Submission immutability, return feedback preservation, and root lineage tests passed 100%.

---

## 8. Exit Gate & Next Steps

Phase D1 is **complete**. Every active personnel record resolves to one valid Personnel Group + Organizational Side pair, legacy third-group values are retired, and HR is established as the sole classification editor.

**Next Dependency**: Proceed to **Plan D — Phase D2: Faculty Status & Master Data** (Faculty Engagement: Full-time/Part-time; Employment Status: Permanent/Probationary).
