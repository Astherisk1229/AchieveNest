# OSAD Awards & Scoring Criteria — Phase 1 Notre Dame Award Source-Fidelity Remediation Report

> **Executive Scope:** Award-by-Award Source-Fidelity Remediation for **Award 01: Notre Dame Award**. Replaced historical placeholder `MOST_OUTSTANDING_STUDENT` with exact authoritative definition **`Notre Dame Award`** (`NOTRE_DAME_AWARD`), implemented the exact 100-point official rubric and 50-point portfolio-computable model, configured criterion components, verified taxonomy mapping, deterministic scoring rules, graduating eligibility ($\ge 80.00\%$ automated candidate threshold), immutable evaluation summary generation, and proved 100% regression and schema parity.

---

## 1. Executive Summary & Source Fidelity Purpose

The **Notre Dame Award** is the premier graduation honor of Notre Dame of Marbel University.
In Phase 1:
1. **Exact Master Identity**: Corrected database master record (`50000001-0000-0000-0000-000000000001`) from placeholder `MOST_OUTSTANDING_STUDENT` to **`Notre Dame Award`** (`NOTRE_DAME_AWARD`).
2. **Official Evaluation Basis (100.00 pts)**:
   - Scholastic Achievement (30.00 pts) $\rightarrow$ Non-computable institutional requirement.
   - Leadership: On and Off Campus (20.00 pts) $\rightarrow$ Portfolio-computable (`OFFICIAL`).
   - Church Activities (20.00 pts) $\rightarrow$ Portfolio-computable (`SYSTEM_OPERATIONALIZATION`).
   - Citations Received Other than Academics (10.00 pts) $\rightarrow$ Portfolio-computable (`OFFICIAL`).
   - Character (20.00 pts) $\rightarrow$ Non-computable panel evaluation.
   - **Official Total**: Exactly 100.00 points.
   - **Portfolio-Computable Maximum**: Exactly 50.00 points.
3. **Criterion Components & Scoring Rules**:
   - **Component A1 (Leadership Involvement)**: `highest_only` (SSG/Univ=10, College=8, Club=6, Year-Level=4, max 10).
   - **Component A2 (Leadership Awards & Seminars)**: `sum_capped` (International=5, Local=2, Seminar=2, cap 10).
   - **Component B1 (Church Ministries Involvement)**: `matrix_mapping` (1=2, 2=4, 3=6, 4=8, 5+=10, cap 10).
   - **Component B2 (Initiated Church Activities)**: `sum_capped` (Organizer=2, Facilitator=3, Head=4, Initiator=5, cap 10).
   - **Component C (Non-Academic Citations)**: `sum_capped` (2 pts per citation, cap 10).
4. **Eligibility & Thresholds**:
   - `graduating_only = 1`, `gender_restriction = NULL`.
   - Automated candidate-generation threshold = **`80.00% Potential Score`** (Raw 40.00 / 50.00).
   - Institutional 85% requirement and panel interview remain clearly separated.
5. **Master Regression**: All 13 Phase 1 tests pass (`13/13 PASS`), Phase J closure passes (`10/10 PASS`), Master Backend Regression passes (`8/8 suites PASS`), and Frontend Vitest passes (`39/39 files, 239/239 PASS`).

---

## 2. Source-Fidelity Specification Matrix

| Metric / Dimension | Specification Value | Database Status |
|---|---|:---:|
| **Award Master Name** | `Notre Dame Award` | **VERIFIED** |
| **Award Code** | `NOTRE_DAME_AWARD` | **VERIFIED** |
| **Primary Key** | `50000001-0000-0000-0000-000000000001` | **VERIFIED** |
| **Authority Status** | `OFFICIAL` | **VERIFIED** |
| **Graduating Students Only** | `1` (Yes) | **VERIFIED** |
| **Gender Restriction** | `NULL` (All) | **VERIFIED** |
| **Official Rubric Total** | `100.00 Points` | **VERIFIED** |
| **Max Computable Portfolio Score** | `50.00 Points` | **VERIFIED** |
| **Automated Candidate Threshold** | `80.00% Potential Score` | **VERIFIED** |
| **Official Pass Requirement** | `85.00% + Panel Interview` | **SEPARATED** |

---

## 3. Official Criteria & Component Architecture

### Official Criteria Breakdown (100 pts)
1. `CRIT_NDA_SCHOLASTIC`: **Scholastic Achievement** — 30.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)
2. `CRIT_NDA_LEADERSHIP`: **Leadership: On and Off Campus** — 20.00 Max Pts (`is_portfolio_computable = 1`, `OFFICIAL`)
3. `CRIT_NDA_CHURCH`: **Church Activities** — 20.00 Max Pts (`is_portfolio_computable = 1`, `SYSTEM_OPERATIONALIZATION`)
4. `CRIT_NDA_CITATIONS`: **Citations Received Other than Academics** — 10.00 Max Pts (`is_portfolio_computable = 1`, `OFFICIAL`)
5. `CRIT_NDA_CHARACTER`: **Character** — 20.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)

### Criterion Components Breakdown (50 pts Computable)
- `COMP_NDA_LEAD_INVOLVE` (10.00 pts, `highest_only`): Sourced from `Leadership Position`.
- `COMP_NDA_LEAD_AWARDS` (10.00 pts, `sum_capped`): Sourced from `Citation / Recognition` and `Seminar / Training` (Leadership Development).
- `COMP_NDA_CHURCH_MINISTRY` (10.00 pts, `matrix_mapping`): Sourced from `Church / Ministry Involvement`.
- `COMP_NDA_CHURCH_INITIATED` (10.00 pts, `sum_capped`): Sourced from `Church / Ministry Involvement` (Role-based).
- `CRIT_NDA_CITATIONS` (10.00 pts, `sum_capped`): Sourced from `Citation / Recognition` (Non-academic only).

---

## 4. Verification Evidence & Test Results

```text
========================================================================
AchieveNest — Phase 1: Notre Dame Award Source-Fidelity Verification
========================================================================
  NDA-001      Exact Award master name is "Notre Dame Award"         [PASS]
  NDA-002      Award code is NOTRE_DAME_AWARD and authority is OFFICIAL [PASS]
  NDA-003      Graduating restriction is active (graduating_only = 1) [PASS]
  NDA-004      Candidate threshold is 80.00%                         [PASS]
  NDA-005      Exact 5 Official Criteria exist for Notre Dame Award  [PASS]
  NDA-006      Official Criteria weights sum to exactly 100.00 points [PASS]
  NDA-007      Computable Criteria max points sum to exactly 50.00 points [PASS]
  NDA-008      Scholastic Achievement (30) & Character (20) are non-computable [PASS]
  NDA-009      4 Criterion Components exist (A1, A2, B1, B2)         [PASS]
  NDA-010      6 Evidence Mapping Rules configured for Notre Dame Award [PASS]
  NDA-011      5 Scoring Rules configured across approved rule types [PASS]
  NDA-012      Evaluation Summary produces deterministic snapshot for Notre Dame Award [PASS]
  NDA-013      Evaluation Summary exposes 50.00 max computable and 100.00 official max [PASS]
========================================================================
Phase 1 Verification Summary: 13 Passed, 0 Failed
========================================================================
```

---

## 5. Master Regression Summary

| Suite Name | Target Area | Result |
|---|---|:---:|
| `spark verify:awards-phase-1` | Notre Dame Award Source Fidelity | **13 / 13 PASS** |
| `spark verify:awards-phase-c` | Version & Model Structure | **13 / 13 PASS** |
| `spark verify:awards-phase-d` | Evidence Mapping & Routing | **9 / 9 PASS** |
| `spark verify:awards-phase-e` | Scoring Rule Engine | **8 / 8 PASS** |
| `spark verify:awards-phase-f` | Eligibility & Candidate Generation | **9 / 9 PASS** |
| `spark verify:awards-phase-g` | Portfolio Evaluation Summaries | **8 / 8 PASS** |
| `spark verify:awards-phase-i` | Authorization & Audit Controls | **7 / 7 PASS** |
| `spark verify:awards-phase-j` | Subsystem Closure Verification | **10 / 10 PASS** |
| `spark verify:phase-g-closure`| Academic Structure Refinement Closure | **24 / 24 PASS** |
| `spark test:phase15-backend`  | Master Backend Regression (8 Suites) | **8 / 8 Suites PASS** |
| `npm test -- --run`           | Frontend Vitest Test Suites | **39 / 39 Files (239 Tests) PASS** |
| `npm run lint`                | Frontend Quality / Static Analysis | **0 Errors** |
| `npm run build`               | Production Bundle Build | **Built in 3.52s** |

---

## 6. Phase 1 Final Gate Declaration

```text
========================================================================
AWARD 01: PASS — NOTRE DAME AWARD SOURCE-FIDELITY VERIFIED
PHASE 1: PASS — NOTRE DAME AWARD VERIFIED AND FROZEN
========================================================================
```
