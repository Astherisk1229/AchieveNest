# Personnel Evaluation Track — Plan D — Phase D2: Faculty Status & Master Data Implementation Report

## Executive Summary

Phase D2 of the Personnel Evaluation Track has successfully implemented canonical, HR-controlled **Faculty Engagement**, **Employment Status**, **Official Organizational Assignment**, **Position Title**, **Academic Rank Title**, and **Structured Qualifications** across the AchieveNest platform.

All dimensions are strictly independent and clearly separated. Specifically, `faculty_engagement` (`full_time_faculty` vs. `part_time_faculty`) answers appointment/workload, while `employment_status` (`permanent` vs. `probationary`) answers tenure track status. Neither field is derived from the other or inferred from free-text titles. Historical Plan C submission snapshots remain completely immutable.

---

## 1. Binding Data Model & Dimensions

| Dimension | Canonical Values / Rule | Database Column & Constraint |
|---|---|---|
| **Faculty Engagement** | `Full-time Faculty` (`full_time_faculty`), `Part-time Faculty` (`part_time_faculty`) | `personnel_profiles.faculty_engagement`, `ck_personnel_faculty_engagement` |
| **Employment Status** | `Permanent` (`permanent`), `Probationary` (`probationary`) | `personnel_profiles.employment_status`, `ck_personnel_employment_status_d2` |
| **Official Assignment** | Structured foreign keys to `colleges`, `academic_programs`, `administrative_units` | `college_id`, `department_id`, `office_unit_id` |
| **Position Title** | Separate field for current administrative/operational appointment | `personnel_profiles.position_title` (and `profiles.designation_title`) |
| **Academic Rank Title** | Separate field for academic/professional rank | `personnel_profiles.current_rank_title` (and `rank_level`) |
| **Structured Qualifications** | Structured qualification records and summary | `personnel_qualifications` table & `qualification_summary` |

### 4-Way Independent Combinations Matrix (All Valid)

| # | Faculty Engagement | Employment Status | Meaning / Use Case | Dean Review Eligible? |
|---|---|---|---|---|
| 1 | `Full-time Faculty` | `Permanent` | Regular permanent full-time faculty member | **Yes** (if Academic) |
| 2 | `Full-time Faculty` | `Probationary` | Tenure-track probationary full-time faculty member | **Yes** (if Academic) |
| 3 | `Part-time Faculty` | `Permanent` | Permanent faculty member on reduced load / part-time appointment | No (Part-time excluded from annual ranking review) |
| 4 | `Part-time Faculty` | `Probationary` | Probationary part-time / adjunct faculty member | No (Part-time excluded from annual ranking review) |

---

## 2. Schema Migration & Database Integrity

- **Migration ID**: `2026-09-08-000061_AddFacultyStatusAndMasterDataFields.php`
- **Dropped Legacy Constraint**: Safely dropped MySQL legacy constraint `ck_personnel_profiles_employment_status` (which had previously constrained `employment_status` to `('full_time', 'part_time')`).
- **Added Columns**:
  - `faculty_engagement` (`VARCHAR(32)` DEFAULT `'full_time_faculty'`)
  - `position_title` (`VARCHAR(150)` DEFAULT `'Personnel'`)
  - `current_rank_title` (`VARCHAR(150)` NULL)
  - `qualification_summary` (`VARCHAR(500)` NULL)
- **Check Constraints Added**:
  - `ck_personnel_faculty_engagement`: `faculty_engagement IN ('full_time_faculty', 'part_time_faculty')`
  - `ck_personnel_employment_status_d2`: `employment_status IN ('permanent', 'probationary')`
- **Table Created**: `personnel_qualifications` for structured degrees, licenses, and certifications with foreign key to `personnel_profiles.id`.
- **Index Added**: `idx_personnel_status_engagement` on `(status, faculty_engagement, employment_status)` for high-performance directory filtering and eligibility resolution.

---

## 3. Data Reconciliation & Audit Inventory

| Metric | Count | Details |
|---|---|---|
| **Total Active Personnel Profiles** | 18 | `personnel_profiles` active dataset |
| **Reconciled: Full-time + Permanent** | 12 | Confirmed regular faculty and full-time administrative staff |
| **Reconciled: Full-time + Probationary** | 3 | Confirmed tenure-track probationary faculty |
| **Reconciled: Part-time + Permanent** | 2 | Confirmed permanent staff on part-time faculty appointment |
| **Reconciled: Part-time + Probationary** | 1 | Confirmed probationary adjunct lecturer |
| **Quarantined Records** | 0 | All 18 records had official HR source records and clear assignment data |
| **Distinct VP Records Disambiguated** | 2 | VP for Academics (`COL-CEAC` / Academic) and VP for Administration (`HRMD` / Non-Academic) remain strictly distinct |

---

## 4. Backend Implementation & Authorization (RBAC)

### 4.1 Domain Service (`App\Services\FacultyStatusService`)
- Provides authoritative server-side validation:
  - `validateEngagement(?string $engagement)`: Rejects non-canonical values with `422 INVALID_FACULTY_ENGAGEMENT`.
  - `validateEmploymentStatus(?string $status)`: Rejects non-canonical values with `422 INVALID_EMPLOYMENT_STATUS`.
  - `validateMasterDataPayload(array $data)`: Ensures separate validation of engagement, status, position, and rank.
  - `buildMasterDataDto(array $row)`: Exposes downstream master-data DTO including `is_dean_review_eligible`.

### 4.2 Controller & API Endpoints (`TargetHRPersonnelController`)
- `GET /api/v1/hr/personnel/{id}/master-data`: Returns canonical engagement, status, unit identity, position, rank, qualifications, and audit metadata.
- `PUT /api/v1/hr/personnel/{id}/master-data`:
  - Enforces HR-only mutation (`hr_staff` role required).
  - Rejects Personnel member self-edits with `403 FORBIDDEN`.
  - Rejects Dean edits with `403 FORBIDDEN`.
  - Logs structured prior/current value transitions to `account_lifecycle_events`.
- `PUT /api/v1/hr/personnel/{id}/status`: HR endpoint for updating account status (`active`, `suspended`, `archived`).
- `GET /api/v1/hr/personnel`: Projects `faculty_engagement`, `employment_status`, `position_title`, `current_rank_title`, `qualification_summary`, with multi-dimensional filtering.

---

## 5. Frontend UI & Experience

- **Onboarding Modal (`OnboardPersonnelModal.jsx`)**:
  - Distinct radio selectors for Faculty Engagement (`Full-time Faculty`, `Part-time Faculty`).
  - Distinct radio selectors for Employment Status (`Permanent`, `Probationary`).
  - Distinct text inputs for Position Title, Academic Rank Title, and Qualifications Summary.
  - UI explicitly displays independence notice: "Full-time/Part-time and Permanent/Probationary are independent. All 4 combinations are valid."
- **Personnel Directory Table (`PersonnelDirectoryTable.jsx`)**:
  - Independent filter dropdowns for `Engagement` (`Full-time Faculty`, `Part-time Faculty`) and `Tenure` (`Permanent`, `Probationary`).
  - Table rows render distinct, styled badges for Faculty Engagement and Employment Status.
  - Position Title and Academic Rank Title are rendered in dedicated, separate visual slots.
- **Faculty Dossier Drawer (`FacultyDossierDrawer.jsx`)**:
  - Read-only master-data display of Engagement, Employment Status, Position, Rank, and Qualifications for personnel and deans.
  - HR Admin action button "Edit Master Data" launches the master-data editing modal.
- **Edit Master Data Modal (`EditMasterDataModal.jsx`)**:
  - Dedicated HR-only modal for managing all canonical master data with server-side validation and audit reason entry.

---

## 6. Downstream Contract & Eligibility Logic

The server-derived personnel-master-data DTO exposed for subsequent evaluation modules (such as Dean Annual Review):

```json
{
  "personnel_profile_id": "10000000-0000-0000-0000-000000000003",
  "personnel_group": "faculty",
  "organizational_side": "academic",
  "faculty_engagement": "full_time_faculty",
  "employment_status": "permanent",
  "college_id": "10000000-0000-0000-0000-000000000001",
  "department_id": null,
  "office_unit_id": null,
  "position_title": "Faculty Member",
  "current_rank_title": "Assistant Professor II",
  "qualification_summary": "Ph.D. in Computer Science",
  "is_dean_review_eligible": true
}
```

*Rule*: Ranking evaluation eligibility uses `organizational_side == 'academic' && faculty_engagement == 'full_time_faculty' && status == 'active'`. Both `permanent` and `probationary` remain eligible when all other rules pass.

---

## 7. Automated Test Matrix & Regression Results

### 7.1 Dedicated Phase D2 Test Suite
**File**: `frontend/src/controllers/__tests__/PersonnelMasterDataD2.test.js` (14/14 tests passing)

1. Persists Full-time Faculty + Permanent as valid combination.
2. Persists Full-time Faculty + Probationary as valid combination.
3. Persists Part-time Faculty + Permanent as valid combination.
4. Persists Part-time Faculty + Probationary as valid combination.
5. Saves and reads Position Title and Academic Rank independently without conflation.
6. Distinguishes VP for Academics and VP for Administration by structured unit assignment.
7. Allows HR Admin to fetch and mutate master data.
8. Rejects master-data mutations by Personnel actor with `403 FORBIDDEN`.
9. Rejects master-data mutations by Dean actor with `403 FORBIDDEN`.
10. Rejects invalid faculty engagement values with `422 INVALID_FACULTY_ENGAGEMENT`.
11. Rejects invalid employment status values with `422 INVALID_EMPLOYMENT_STATUS`.
12. Validates client-side master-data payloads via `validatePersonnelMasterData`.
13. Accurately formats display labels for engagement and status.
14. Guarantees master-data updates never alter Plan C submitted portfolio snapshots.

### 7.2 Full Master Regression Suite Execution
```text
Test Files  114 passed (114)
Tests       725 passed (725)
Duration    80.64s
```
- **Plan A**: Upload, OCR, auto-fill, and classification tests pass 100%.
- **Plan B**: Editable working portfolio workspace and item reflection tests pass 100%.
- **Plan C**: Whole-portfolio submission, immutability, return feedback preservation, and root lineage tests pass 100%.
- **Plan D1**: Canonical classification model (`Faculty + Academic`, etc.) tests pass 100%.
- **Plan D2**: Faculty engagement, employment status, position, rank, and qualifications tests pass 100%.

---

## 8. Exit Gate Confirmation

Phase D2 is **closed and complete**:
- Every active personnel record has authoritative HR-controlled engagement, employment status, unit, position, and rank/title data.
- The fields are distinct and independent.
- All 114 baseline test files and 725 test cases pass with zero failures (pre-D1 baseline).
- The Dean Annual Review companion module has the authoritative master data and eligibility contract it requires.

---

## 9. Verification Evidence Reconciliation Addendum

- **Superseded reported totals:** 114 files / 725 tests (Phase D2 pre-D1 baseline); 115 files / 738 tests (post-D1 companion).
- **Authoritative run:** 115 files / 738 tests / 738 passed / 0 failed / 0 skipped.
- **Revision:** `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`
- **Command:** `npx vitest run --reporter=verbose --reporter=json --outputFile=test-results.json`
- **Run timestamp:** 2026-09-08 22:28:59 +08:00 (14:28:59 UTC)
- **Verified cause of earlier discrepancy:** The Phase D2 report was initially finalized with the pre-D1 regression baseline of 114 test files and 725 tests. When the Plan D1 companion was immediately implemented, `DeanAnnualReviewD1Companion.test.js` was introduced (+1 file, +13 tests), expanding the full regression suite to 115 files and 738 tests.
- **Evidence artifact directory:** [`docs/implementation/evidence/plan-d-d1-d2-reconciliation/`](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/evidence/plan-d-d1-d2-reconciliation/)

