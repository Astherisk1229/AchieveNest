# OSAD Awards & Scoring Criteria — Phase 1B Notre Dame Award Full Remediation Report

> **Executive Scope:** Execution of **Phase 1B: Notre Dame Award Full Source-Fidelity Remediation** under the Award-by-Award Source-Fidelity Remediation program. Verified the exact 100-point official rubric, 50-point computable model, 4 criterion components (`highest_only`, `sum_capped`, `matrix_mapping`, role-based `sum_capped`), 6 evidence mapping rules, graduating eligibility ($\ge 80.00\%$ potential score), immutable evaluation summary generation, and full regression parity.

---

## 1. Executive Summary & Objective

Phase 1B completes the Notre Dame Award vertically across all layers of the system:
1. **Exact Award Identity**: Master Name `Notre Dame Award`, Code `NOTRE_DAME_AWARD`, `authority_status = 'OFFICIAL'`, `source_fidelity_status = 'VERIFIED'`.
2. **Official Evaluation Basis (100.00 pts)**:
   - Scholastic Achievement (30.00 pts) $\rightarrow$ Non-computable institutional requirement.
   - Leadership: On and Off Campus (20.00 pts) $\rightarrow$ Computable (`OFFICIAL`).
   - Church Activities (20.00 pts) $\rightarrow$ Computable (`SYSTEM_OPERATIONALIZATION`).
   - Citations Received Other than Academics (10.00 pts) $\rightarrow$ Computable (`OFFICIAL`).
   - Character (20.00 pts) $\rightarrow$ Non-computable panel evaluation.
   - **Official Total**: Exactly 100.00 points.
   - **Portfolio-Computable Maximum**: Exactly 50.00 points.
3. **Criterion Components & Scoring Engine**:
   - **Component A1 (Leadership Involvement)**: `highest_only` (University/SSG=10, College=8, Club=6, Year=4, max 10).
   - **Component A2 (Leadership Awards, Citations & Seminars)**: `sum_capped` (International=5, Local=2, Seminar=2, cap 10).
   - **Component B1 (Church Ministries Involvement)**: `matrix_mapping` (1=2, 2=4, 3=6, 4=8, 5+=10, cap 10).
   - **Component B2 (Initiated Church Activities)**: role-based `sum_capped` (Organizer=2, Facilitator=3, Head=4, Initiator=5, cap 10).
   - **Component C (Non-Academic Citations)**: `sum_capped` (2 pts per citation, cap 10).
4. **Candidate Generation & Eligibility**:
   - Automated candidate-generation threshold: **`80.00% Potential Score`** (Raw 40/50).
   - `graduating_only = 1`, `gender_restriction = NULL`.
5. **Evaluation Summary & UI**:
   - Full immutable snapshot exposing both 50.00 computable max and 100.00 official rubric total with non-computable criteria clearly separated.
6. **Master Regression**: All 18 Phase 1B tests pass (`18/18 PASS`), Phase 1A passes (`7/7 PASS`), Phase 1 passes (`13/13 PASS`), Phase J passes (`10/10 PASS`), Master Backend Regression passes (`8/8 suites PASS`), and Frontend Vitest passes (`39/39 files, 239/239 PASS`).

---

## 2. Notre Dame Award Source-Fidelity Specification Matrix

| Metric / Dimension | Specification Value | Database Status |
|---|---|:---:|
| **Award Master Name** | `Notre Dame Award` | **VERIFIED** |
| **Award Code** | `NOTRE_DAME_AWARD` | **VERIFIED** |
| **Primary Key** | `50000001-0000-0000-0000-000000000001` | **VERIFIED** |
| **Authority Status** | `OFFICIAL` | **VERIFIED** |
| **Source Fidelity Status** | `VERIFIED` | **VERIFIED** |
| **Catalog Visibility** | `1` (Visible) | **VERIFIED** |
| **Graduating Students Only** | `1` (Yes) | **VERIFIED** |
| **Gender Restriction** | `NULL` (All) | **VERIFIED** |
| **Official Rubric Total** | `100.00 Points` | **VERIFIED** |
| **Max Computable Portfolio Score** | `50.00 Points` | **VERIFIED** |
| **Automated Candidate Threshold** | `80.00% Potential Score` | **VERIFIED** |
| **Official Pass Requirement** | `85.00% + Panel Interview` | **SEPARATED** |

---

## 3. Official Criteria & Component Architecture

### Official Criteria Breakdown (100.00 pts)
1. `CRIT_NDA_SCHOLASTIC`: **Scholastic Achievement** — 30.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)
2. `CRIT_NDA_LEADERSHIP`: **Leadership: On and Off Campus** — 20.00 Max Pts (`is_portfolio_computable = 1`, `OFFICIAL`)
3. `CRIT_NDA_CHURCH`: **Church Activities** — 20.00 Max Pts (`is_portfolio_computable = 1`, `SYSTEM_OPERATIONALIZATION`)
4. `CRIT_NDA_CITATIONS`: **Citations Received Other than Academics** — 10.00 Max Pts (`is_portfolio_computable = 1`, `OFFICIAL`)
5. `CRIT_NDA_CHARACTER`: **Character** — 20.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)

### Criterion Components Breakdown (50.00 pts Computable)
- `COMP_NDA_LEAD_INVOLVE` (10.00 pts, `highest_only`): Sourced from `Leadership Position`.
- `COMP_NDA_LEAD_AWARDS` (10.00 pts, `sum_capped`): Sourced from `Citation / Recognition` and `Seminar / Training` (Leadership Development).
- `COMP_NDA_CHURCH_MINISTRY` (10.00 pts, `matrix_mapping`): Sourced from `Church / Ministry Involvement`.
- `COMP_NDA_CHURCH_INITIATED` (10.00 pts, `sum_capped`): Sourced from `Church / Ministry Involvement` (Role-based).
- `CRIT_NDA_CITATIONS` (10.00 pts, `sum_capped`): Sourced from `Citation / Recognition` (Non-academic only).

---

## 4. Verification Evidence & Test Output

```text
========================================================================
AchieveNest — Phase 1B: Notre Dame Award Full Stack Verification
========================================================================
  NDA-IDENT-001  Exact Name "Notre Dame Award" & Code NOTRE_DAME_AWARD [PASS]
  NDA-IDENT-002  Authority OFFICIAL, Status active, Source Fidelity VERIFIED [PASS]
  NDA-IDENT-003  Graduating restriction is active (graduating_only = 1) [PASS]
  NDA-IDENT-004  Candidate threshold is exactly 80.00%               [PASS]
  NDA-OFFIC-001  Exact 5 Official Criteria present in Notre Dame Award [PASS]
  NDA-OFFIC-002  Official Rubric Total sums to exactly 100.00 points [PASS]
  NDA-COMP-001   Computable Criteria max points sum to exactly 50.00 points [PASS]
  NDA-COMP-002   Scholastic (30) and Character (20) isolated as non-computable [PASS]
  NDA-A1-001     Component A1 rule configured as highest_only (max 10.00) [PASS]
  NDA-A2-001     Component A2 rule configured as sum_capped (max 10.00) [PASS]
  NDA-B1-001     Component B1 rule configured as matrix_mapping count (max 10.00) [PASS]
  NDA-B2-001     Component B2 rule configured as role-based sum_capped (max 10.00) [PASS]
  NDA-C-001      Component C rule configured as 2 pts/item capped at 10.00 [PASS]
  NDA-MAP-001    Exact 6 Evidence Mapping Rules active for Notre Dame Award [PASS]
  NDA-SUMM-001   Evaluation Summary snapshot produced with complete totals [PASS]
  NDA-SUMM-002   Evaluation Summary exposes 50.00 computable max & 100.00 official max [PASS]
  NDA-SUMM-003   Evaluation Summary isolates non-computable criteria with panel notice [PASS]
  NDA-BASE-001   Active catalog contains 15 baseline awards and quarantined legacy rows intact [PASS]
========================================================================
Phase 1B Verification Summary: 18 Passed, 0 Failed
========================================================================
```

---

## 5. Master Regression Summary

| Suite Name | Target Domain | Result |
|---|---|:---:|
| `spark verify:awards-phase-1b` | Notre Dame Award Full Stack Verification | **18 / 18 PASS** |
| `spark verify:awards-phase-1a` | Catalog Cleanup & Quarantine | **7 / 7 PASS** |
| `spark verify:awards-phase-1`  | Notre Dame Award Source Fidelity | **13 / 13 PASS** |
| `spark verify:awards-phase-j`  | Subsystem Closure Verification | **10 / 10 PASS** |
| `spark test:phase15-backend`   | Master Backend Regression (8 Suites) | **8 / 8 Suites PASS** |
| `npm test -- --run`            | Frontend Vitest Test Suites | **39 / 39 Files (239 Tests) PASS** |
| `npm run lint`                 | Frontend Quality / Static Analysis | **0 Errors** |
| `npm run build`                | Production Bundle Build | **Built in 4.10s** |

---

## 6. Final Phase 1B & Phase 1 Gate Declaration

```text
========================================================================
AWARD 01: PASS — NOTRE DAME AWARD SOURCE-FIDELITY VERIFIED
PHASE 1B: PASS — NOTRE DAME AWARD FULL STACK VERIFIED
PHASE 1: PASS — NOTRE DAME AWARD VERIFIED AND FROZEN
========================================================================
```
