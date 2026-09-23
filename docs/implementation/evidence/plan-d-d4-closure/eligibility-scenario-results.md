# Plan D Phase D4 — Canonical Eligibility Scenario Verification

The 8 canonical eligibility scenarios have been verified against `PersonnelEligibilityService` and the automated test suite [`PersonnelEvaluationEligibilityD3.test.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/PersonnelEvaluationEligibilityD3.test.js):

| # | Personnel Profile State | Dean Annual Review State | Plan C Root State | Portfolio Validation Gate | Ranking Readiness Gate | Reason Codes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **1** | Faculty + Academic<br>Full-Time<br>Permanent | `cleared` | No root for cycle | **Eligible** (`true`) | **Eligible** (`true`) | `[]` | **PASSED** |
| **2** | Faculty + Academic<br>Full-Time<br>Probationary | `cleared` | No root for cycle | **Eligible** (`true`) | **Eligible** (`true`) | `[]` | **PASSED** |
| **3** | Faculty + Academic<br>Part-Time<br>Permanent / Probationary | `cleared` | No root for cycle | **Eligible** (`true`) | **Ineligible** (`false`) | `["PART_TIME_FACULTY"]` | **PASSED** |
| **4** | Non-Teaching Faculty + Academic | `cleared` | No root for cycle | **Eligible** (`true`) | **Ineligible** (`false`) | `["UNSUPPORTED_PERSONNEL_GROUP_FOR_RANKING"]` | **PASSED** |
| **5** | Faculty + Academic<br>Full-Time | None (`pending`) | No root for cycle | **Ineligible** (`false`) | **Ineligible** (`false`) | `["ANNUAL_REVIEW_PENDING"]` | **PASSED** |
| **6** | Faculty + Academic<br>Full-Time | `not_cleared`<br>(with mandatory reason) | No root for cycle | **Ineligible** (`false`) | **Ineligible** (`false`) | `["ANNUAL_REVIEW_NOT_CLEARED"]` | **PASSED** |
| **7** | Faculty + Academic<br>Full-Time<br>Permanent | `cleared` | Existing root for cycle | **Eligible** (`true`) | **Ineligible** (`false`) | `["EVALUATION_ALREADY_EXISTS_FOR_CYCLE"]` | **PASSED** |
| **8** | Non-Academic Personnel | N/A (Outside Dean Scope) | N/A | **Ineligible** (`false`) | **Ineligible** (`false`) | `["NOT_ACADEMIC_PERSONNEL"]` | **PASSED** |

---

## Zero-Mutation Verification
- Running any eligibility query against `/api/v1/personnel/eligibility/current` or `/api/v1/hr/personnel/{id}/eligibility` performs strictly read-only calculations.
- Zero rows are created or modified in `personnel_evaluation_roots`, `personnel_evaluations`, `personnel_evaluation_items`, or `personnel_portfolio_history`.
