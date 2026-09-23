# AchieveNest — Phase F PK Reconciliation & 2NF Revalidation Report

> **Database:** `achievenest_local`  
> **MySQL Version:** `8.4.7`  
> **Git Revision:** `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`  
> **Audit Timestamp:** `2026-08-31 19:32:40 UTC`  

---

## 1. Issue & Discrepancy Investigation
- **Issue**: Phase C documentation initially reported 56 single-column PKs and 8 composite natural PKs, whereas Phase F reported 64 single-column PKs.
- **Investigation Findings**:
  1. Direct schema interrogation of `information_schema.KEY_COLUMN_USAGE` where `CONSTRAINT_NAME = 'PRIMARY'` confirms that **all 64 base tables possess single-column primary keys** (61 tables use `id`, and 3 subtype/extension tables use `profile_id`).
  2. The initial Phase C text reference to '8 composite natural primary keys' was a terminology conflation that referred to 8 junction/assignment tables having composite **`UNIQUE` candidate constraints** (e.g. `profile_roles(profile_id, role_id)`, `portfolio_subcategories(category_id, code)`), even though physically their primary keys are single-column `id` surrogates.
  3. Zero schema migrations occurred between Phase C and Phase F. The actual physical database has consistently had 64 single-column primary keys.

## 2. Reconciliation Matrix

| Metric / Item | Initial Phase C Report | Initial Phase F Report | Actual Schema (`information_schema`) | Final Correct Reconciled Value | Status |
|---|---:|---:|---:|---:|:---:|
| **Total PK Tables** | 64 | 64 | 64 | **64 / 64** | **RECONCILED** |
| **Single-Column PK Tables** | 56 | 64 | 64 | **64** (61 `id` + 3 `profile_id`) | **RECONCILED** |
| **Composite-PK Tables** | 8 | 0 | 0 | **0** (Surrogate PK with UNIQUE keys) | **RECONCILED** |
| **Tables Tested for 2NF** | Implied | 64 | 64 | **64 / 64** | **RECONCILED** |
| **2NF PASS Tables** | 64 | 64 | 64 | **64 / 64 (100% PASS)** | **PASS** |
| **Strict 3NF PASS** | - | 62 | 62 | **62 Tables** | **PASS** |
| **3NF Justified Denormalizations** | - | 2 | 2 | **2 Tables** (`profiles`, `student_profiles`) | **PASS** |

## 3. 2NF Revalidation & 3NF Impact Analysis
- **2NF Status**: **PASS (64/64 Tables)**. Because all 64 tables use single-column primary keys, partial-key dependencies are structurally precluded. Candidate composite unique keys were also evaluated and verified to have zero partial dependencies.
- **3NF Status**: **PASS (64/64 Tables)**. 62 tables satisfy strict 3NF with zero transitive dependencies. 2 tables (`profiles`, `student_profiles`) satisfy the normalized logical model with documented, justified physical denormalization caches (`profiles.full_name`, `student_profiles.year_level`).
- **Schema Mutations**: **NONE** (Audit-only reconciliation).

## 4. Documentation Files Reconciled & Synchronized
- [`phase-f-pk-reconciliation-table.md`](file:///c:/Users/Admin/Documents/AchieveNest/docs/database-audit/phase-f-pk-reconciliation-table.md)
- [`phase-c-primary-key-audit.md`](file:///c:/Users/Admin/Documents/AchieveNest/docs/database-audit/phase-c-primary-key-audit.md)
- [`phase-c-completion-report.md`](file:///c:/Users/Admin/Documents/AchieveNest/docs/database-audit/phase-c-completion-report.md)
- [`phase-f-2nf-assessment.md`](file:///c:/Users/Admin/Documents/AchieveNest/docs/database-audit/phase-f-2nf-assessment.md)
- [`phase-f-completion-report.md`](file:///c:/Users/Admin/Documents/AchieveNest/docs/database-audit/phase-f-completion-report.md)
- [`phase-f-pk-and-2nf-reconciliation-report.md`](file:///c:/Users/Admin/Documents/AchieveNest/docs/database-audit/phase-f-pk-and-2nf-reconciliation-report.md)

## 5. Final Reconciliation Conclusion
```text
========================================================================
AchieveNest — Phase F PK Reconciliation & 2NF Revalidation
========================================================================

Database:                                      achievenest_local
Schema revision:                               Git HEAD ea987bf32c208cc99ebe1a60b989c0c09ca83e98

Tables with primary keys:                      64 / 64
Single-column PK tables:                       64 (61 `id` + 3 `profile_id`)
Composite-PK tables:                           0

Phase C PK count accuracy:                     CORRECTED & RECONCILED
Phase F PK count accuracy:                     RECONCILED & CONFIRMED

Composite-PK tables explicitly tested:         0 / 0 (N/A — Single-Column PKs)
Partial dependencies found:                    0

2NF PASS tables:                               64 / 64 (100% PASS)
2NF REVIEW/FAIL tables:                        0

3NF strict PASS tables:                        62
PASS — justified denormalization:              2 (profiles.full_name, student_profiles.year_level)
3NF REVIEW/FAIL tables:                        0

profiles.full_name:                            JUSTIFIED CACHE
student_profiles.year_level:                   JUSTIFIED CACHE

Blocking normalization defects:                0
Unresolved source-of-truth issues:             0

Schema mutations:                              NONE
Data deletions:                                NONE
Portfolio-category changes:                    NONE
Award-rule changes:                            NONE

Final Decision:
GO / APPROVED FOR CATEGORY FINALIZATION & AUDIT CLOSURE
========================================================================
```
