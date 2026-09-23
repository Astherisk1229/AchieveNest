# Personnel Evaluation Track — Plan K — Phase K1: Required Test Accounts & Persona Preparation Report

## Executive Summary

Phase K1 of Plan K establishes the minimum required synthetic test personas, credentials, roles, and institutional assignments necessary to execute the frozen K0 acceptance matrix without altering any business logic, routing rules, or rank catalogs.

All 40 requirements of Phase K1 have been implemented, verified, and locked.

---

## 1. Persona & Account Registry

| Persona | Synthetic ID | Display Name | Synthetic Email | Group | Side | Faculty Status | Placement | Expected Route | Ranking Eligible |
|---|---|---|---|---|---|---|---|---|---|
| **P1** | `K1-P1-FAC-001` | Dr. Katherine First | `k1.p1.faculty@ndmu.edu.ph` | `faculty` | `academic` | `full_time_faculty` | College 1 (CBA) | Dean (CBA) | **YES** |
| **P2** | `K1-P2-PT-002` | Prof. Paul Second | `k1.p2.parttime@ndmu.edu.ph` | `faculty` | `academic` | `part_time_faculty` | College 1 (CBA) | Dean (CBA) | **NO (BLOCKED)** |
| **P3** | `K1-P3-NTFA-003` | Arthur Third | `k1.p3.ntf.academic@ndmu.edu.ph` | `non_teaching_faculty` | `academic` | `full_time_faculty` | College 2 (CTE) | Dean (CTE) | **YES** |
| **P4** | `K1-P4-NTFNA-004` | Nora Fourth | `k1.p4.ntf.nonacademic@ndmu.edu.ph` | `non_teaching_faculty` | `non_academic` | `full_time_faculty` | Unit: Registrar | HR | **YES (No Rank Rule)** |
| **P5** | `K1-P5-DEAN-005` | Dean David Fifth | `k1.p5.dean@ndmu.edu.ph` | `faculty` | `academic` | `full_time_faculty` | College 1 (CBA) | HR (Self-eval) | **Reviewer (CBA)** |
| **P6** | `K1-P6-HR-006` | Helen Sixth | `k1.p6.hr@ndmu.edu.ph` | `non_teaching_faculty` | `non_academic` | `full_time_faculty` | Unit: Finance | HR | **Reviewer (Inst.)** |
| **P7** | `K1-P7-VP-007` | Dr. Vincent Seventh | `k1.p7.vp@ndmu.edu.ph` | `faculty` | `academic` | `full_time_faculty` | College 1 (CBA) | HR | **N/A** |
| **P-SEC** | `K1-PSEC-008` | Sara Secretary | `k1.psec.secretary@ndmu.edu.ph` | `non_teaching_faculty` | `academic` | `full_time_faculty` | College 1 (CBA) | Dean | **NOT EVALUATOR** |
| **P-LEG-S** | `K1-PLEG-SUPP-009` | Leo Legacy | `k1.pleg.supported@ndmu.edu.ph` | `non_teaching_personnel` | `non_academic` | `full_time_faculty` | Unit: Registrar | HR | **Supported Mapping** |
| **P-LEG-A** | `K1-PLEG-AMB-010` | Alex Ambiguous | `k1.pleg.ambiguous@ndmu.edu.ph` | `non_teaching_personnel` | Unresolved | `full_time_faculty` | Unassigned | Unresolved | **Ambiguous Mapping** |

---

## 2. Key Persona Architectural Boundaries Verified

1. **Part-Time Faculty (P2) Ranking Exclusion**:
   - P2 holds canonical Part-Time title `PT_LECTURER` (Lecturer).
   - Ranking evaluation is strictly blocked (`ranking_eligible = false`).
2. **Cross-College Dean Authority (P5 vs P3)**:
   - P5 is Dean of College 1 (CBA) and is strictly denied authorization to evaluate P3 of College 2 (CTE).
3. **Non-Academic HR Routing (P4)**:
   - P4 is assigned to Registrar Administrative Unit and routes directly to HR (`P6`).
   - Academic rank rule remains strictly unresolved as frozen in K0.
4. **Department Secretary Negative Authorization (P-SEC)**:
   - P-SEC is authenticated as `department_secretary` with zero evaluator privileges.
   - P-SEC's own evaluation route derives from `non_teaching_faculty` + `academic` -> Dean.
5. **Legacy Migration Fixtures (P-LEG)**:
   - `P_LEG_SUPPORTED` maps to `non_teaching_faculty` + `non_academic` via confirmed unit data.
   - `P_LEG_AMBIGUOUS` remains unresolved when official unit data is missing.

---

## 3. Verification Test Results

### Phase K1 Focused Suite (`PersonnelPlanKPhaseK1Personas.test.jsx`)
- **Tests**: **40 / 40 passed** (0 failures).

### Consolidated Track Suites
- **K0 Audit Suite**: 40 / 40 passed.
- **K1 Personas Suite**: 40 / 40 passed.
- **D2-5 Closure Suite**: 42 / 42 passed.
- **Subtotal**: **122 / 122 passed**.

### Master Full Regression Suite
- **Files**: **160 test files passed (160 total)**
- **Tests**: **1,923 passed (1,923 total)**
- **Failures**: **0**
- **Duration**: **71.43s**
- **Exit Code**: **0**

### Backend PHP Syntax Lint
- **Scanned Files**: 182 files across `backend/app`
- **Syntax Errors**: 0 errors detected

---

## 4. K2 Readiness Decision

> **Phase K1 is formally APPROVED and COMPLETE.**
>
> **All minimum synthetic test personas, institutional assignments, role claims, and negative authorization fixtures are verified and ready.**
>
> **The track is fully ready to proceed to Phase K2 (End-to-End Persona Journey Validation).**

---

*Report certified by: Antigravity Automated Verification Agent*  
*Date: 2026-09-09*
