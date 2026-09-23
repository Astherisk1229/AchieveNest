# Personnel Evaluation Track — Plan F1
## Dynamic Portfolio Format, Categories, Subcategories & Criteria Configuration Implementation Report

**Document type:** Final Phase Implementation & Verification Report  
**Date:** 2026-09-08  
**Status:** Completed & Verified  
**Relationship:** Companion to Plan F — Evaluation Scale, Criteria & Scoring Rules Engine  
**Prerequisites:** Plan C closed; Plan D D0/D1/D2 and Plan D1 Companion verified.  

---

## 1. Executive Summary

This report confirms the implementation, database migration, domain service architecture, frontend workspace integration, and automated verification for **Personnel Evaluation Track — Plan F1: Dynamic Portfolio Format, Categories, Subcategories & Criteria Configuration**.

Plan F1 enables the Personnel Portfolio workspace to dynamically adapt to the official ranking scale assigned to each personnel member based on their HR-controlled Plan D classification pair.

Key accomplishments include:
1. **Binding Personnel-to-Scale Assignment**:
   - `Faculty + Academic` ➔ `ADMINISTRATORS_RANKING_SCALE` (Max 160 pts, Passing 120 pts).
   - `Non-Teaching Faculty + Academic` ➔ `ADMINISTRATORS_RANKING_SCALE` (Max 160 pts, Passing 120 pts).
   - `Non-Teaching Faculty + Non-Academic` ➔ `NON_TEACHING_PERSONNEL_RANKING_SCALE` (Max 150 pts, Passing 75 pts).
   - Rejected invalid combinations (e.g. `Faculty + Non-Academic`) before scale resolution.
2. **Versioned Rubric Catalogue**:
   - Database tables `evaluation_scales`, `evaluation_scale_versions`, `evaluation_scale_areas`, `evaluation_scale_categories`, `evaluation_scale_subcategories`, `evaluation_scale_criteria`, and `evaluation_scale_change_events`.
   - Seeded canonical v1.0.0 for cycle `2025-2026` with complete source traceability to official NDMU ranking manuals.
3. **Area Entry Policy & Non-Teaching Protection**:
   - Every area specifies an explicit `entry_policy`: `personnel_entry_allowed` or `personnel_entry_disallowed_read_only`.
   - `NON_TEACHING_PERSONNEL_RANKING_SCALE` Area A (Performance and Personal Indicators) is strictly designated as `personnel_entry_disallowed_read_only`. The UI renders it with clear institutional evaluator indicators and hides accomplishment submission triggers; backend validation rejects direct mutations with `409 PORTFOLIO_AREA_READ_ONLY`.
4. **Dynamic Shared Workspace & Modal**:
   - Shared portfolio workbench renders tabs, descriptions, maximum caps, and category filters dynamically from server configuration without duplicating UI code.
   - Reusable modal renders schema-driven categories, subcategories, and documentary proof requirements with formula points and caps.
5. **Plan C Protection & Immutability**:
   - Zero modifications, unlocks, or deletions to `personnel_evaluation_roots`, `personnel_evaluations`, `personnel_evaluation_items`, or feedback records.

---

## 2. Database Schema & Migration Evidence

### 2.1 Migration 63 Details
- **File:** `backend/app/Database/Migrations/2026-09-08-000063_CreateEvaluationScaleCatalogue.php`
- **Migration ID:** `63`
- **Tables Created:**
  - `evaluation_scales`
  - `evaluation_scale_versions`
  - `evaluation_scale_areas`
  - `evaluation_scale_categories`
  - `evaluation_scale_subcategories`
  - `evaluation_scale_criteria`
  - `evaluation_scale_change_events`

### 2.2 Canonical Scales Seeded (v1.0.0 / Cycle 2025-2026)

| Scale Code | Title | Total Max | Passing Score | Areas |
|---|---|:---:|:---:|---|
| `ADMINISTRATORS_RANKING_SCALE` | NDMU Administrators & Academic Faculty Ranking Scale | 160.00 | 120.00 | Area A (70 pts, allowed)<br>Area B (50 pts, allowed)<br>Area C (40 pts, allowed) |
| `NON_TEACHING_PERSONNEL_RANKING_SCALE` | NDMU Non-Teaching Personnel Ranking Scale | 150.00 | 75.00 | Area A (70 pts, read-only)<br>Area B (50 pts, allowed)<br>Area C (30 pts, allowed) |

---

## 3. Backend Implementation & REST API Contracts

### 3.1 Domain Services
1. `EvaluationScaleResolver` (`backend/app/Services/EvaluationScaleResolver.php`): Resolves scale from Plan D pair and retrieves approved active version for the cycle.
2. `PortfolioConfigurationService` (`backend/app/Services/PortfolioConfigurationService.php`): Builds dynamic workspace configuration DTO with areas, entry policies, categories, subcategories, and documentary proof hints.
3. `PortfolioCriterionValidationService` (`backend/app/Services/PortfolioCriterionValidationService.php`): Server-side validation of accomplishment entries, area entry policy enforcement, formula calculation, and cap evaluation with point traces.
4. `RubricAdministrationService` (`backend/app/Services/RubricAdministrationService.php`): Catalogue inspection, draft version approval, version retirement, and change audit events.

### 3.2 REST API Routes
| Method | Route | Description | Authorization |
|---|---|---|---|
| `GET` | `/api/v1/personnel/portfolio/configuration` | Caller's resolved scale, active version, areas, and categories | Personnel owner |
| `GET` | `/api/v1/personnel/portfolio/configuration/areas/{areaCode}` | Area-specific schema and subcategories | Personnel owner |
| `POST` | `/api/v1/personnel/portfolio/validate-entry` | Pre-submission entry validation and point trace | Personnel owner |
| `GET` | `/api/v1/admin/evaluation-scales` | List full catalogue with versions and metadata | HR Admin |
| `POST` | `/api/v1/admin/evaluation-scales/{versionId}/approve` | Approve draft scale version with audit reason | HR Admin |
| `POST` | `/api/v1/admin/evaluation-scales/{versionId}/retire` | Retire active scale version with audit reason | HR Admin |

---

## 4. Frontend Integration

1. **Services:**
   - [`portfolioConfigurationService.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/services/portfolioConfigurationService.js): API bindings for configuration fetch, entry validation, and catalogue administration.
2. **Components & Views:**
   - [`PersonnelPortfolioEditPage.jsx`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/personnel/PersonnelPortfolioEditPage.jsx):
     - Dynamically renders official rubric banner with active scale, version number, cycle ID, total points, and passing score.
     - Maps dynamic area tabs from `workspaceConfig.areas`.
     - Enforces `entry_policy`: Displays locked evaluator notice and hides submission actions when `personnel_entry_disallowed_read_only` is active.
     - Passes server-resolved scale code, version ID, area code, and categories to modal.

---

## 5. Verification & Test Evidence

### 5.1 Plan F1 Dedicated Test Suite
- **File:** `frontend/src/controllers/__tests__/PersonnelDynamicPortfolioF1.test.js`
- **Tests Executed:** 12/12 passing

```text
✓ F1.1 & F1.2 Binding Personnel-to-Scale Assignment & Catalogue Resolution
  ✓ resolves ADMINISTRATORS_RANKING_SCALE for Faculty + Academic (Max 160, Passing 120)
  ✓ resolves ADMINISTRATORS_RANKING_SCALE for Non-Teaching Faculty + Academic
  ✓ resolves NON_TEACHING_PERSONNEL_RANKING_SCALE for Non-Teaching Faculty + Non-Academic (Max 150, Passing 75)
  ✓ rejects invalid classification pairs with 422 INVALID_PERSONNEL_CLASSIFICATION
✓ F1.3 Non-Teaching Area A Read-Only & Mutation Prevention Policy
  ✓ blocks personnel accomplishment creation in Area A for Non-Teaching scale with 409 PORTFOLIO_AREA_READ_ONLY
✓ F1.4 Point Schedule Validation & Formula Tracing
  ✓ calculates Ph.D. degree points as 40 raw points without cap violation
  ✓ calculates Ph.D. units correctly at 2 pts per 3 units and caps at 10 pts
  ✓ calculates Seminar Attendance points based on official geographic scope levels
  ✓ calculates Service Credit accurately at 1 pt per 2 full years capped at 10 pts
✓ F1.5 Rubric Administration Catalogue & Approval Lifecycle
  ✓ allows authorized HR Admin to list all catalogue scales and versions
  ✓ approves a draft scale version and records auditable transition
  ✓ retires an existing active scale version with reason
```

### 5.2 Master Regression Suite
- **Test Files:** 116 passed (116)
- **Total Tests:** 750 passed (750)
- **Failures:** 0

---

## 6. Sign-off & Conclusion

Plan F1 is fully implemented, verified, and closed. The Personnel Portfolio workspace now operates dynamically on server-managed, versioned evaluation scales with complete separation of concerns and robust protection of historical Plan C records.
