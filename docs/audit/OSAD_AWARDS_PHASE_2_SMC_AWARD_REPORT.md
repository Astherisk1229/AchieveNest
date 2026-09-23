# OSAD Awards & Scoring Criteria — Phase 2 Saint Marcellin Champagnat (SMC) Award Report

> **Executive Scope:** Execution of **Phase 2: Saint Marcellin Champagnat (SMC) Award Full Source-Fidelity Remediation** under the Award-by-Award Source-Fidelity Remediation program. Verified the exact 100-point official rubric, 60-point computable model, 4 criterion components (`highest_only`, `sum_capped`, `matrix_mapping`, role-based `sum_capped`), 8 evidence mapping rules, graduating eligibility ($\ge 80.00\%$ potential score), immutable evaluation summary generation, Notre Dame Award regression invariance, and full regression parity.

---

## 1. Executive Summary & Objective

Phase 2 completes the Saint Marcellin Champagnat (SMC) Award vertically across all layers of the system while maintaining the frozen Phase 1 Notre Dame Award baseline:
1. **Exact Award Identity**: Master Name `Saint Marcellin Champagnat (SMC) Award`, Code `SMC_AWARD`, `authority_status = 'OFFICIAL'`, `source_fidelity_status = 'VERIFIED'`.
2. **Official Evaluation Basis (100.00 pts)**:
   - Scholastic Achievement (20.00 pts) $\rightarrow$ Non-computable institutional requirement (`OFFICIAL`).
   - Leadership: On and Off Campus (20.00 pts) $\rightarrow$ Computable (`OFFICIAL`).
   - Community Involvement (30.00 pts) $\rightarrow$ Computable (`OFFICIAL`).
   - Citations Received Other than Academics (10.00 pts) $\rightarrow$ Computable (`OFFICIAL`).
   - Character (20.00 pts) $\rightarrow$ Non-computable panel evaluation (`OFFICIAL`).
   - **Official Total**: Exactly 100.00 points.
   - **Portfolio-Computable Maximum**: Exactly 60.00 points.
3. **Criterion Components & Scoring Engine (60.00 pts Computable)**:
   - **Component A1 (Leadership Involvement)**: `highest_only` (University/SSG=10, College=8, Club=6, Year=4, max 10).
   - **Component A2 (Leadership Awards, Citations & Seminars)**: `sum_capped` (International=5, Local=2, Seminar=2, cap 10).
   - **Component B1 (Community & Ministry Involvement)**: `matrix_mapping` count matrix (1=3, 2=6, 3=9, 4=12, 5=15, max 15).
   - **Component B2 (Initiated Community / Church Activities)**: role-based `sum_capped` (Organizer=3, Facilitator=4, Head=6, Initiator=8, cap 15).
   - **Component C (Non-Academic Citations)**: `sum_capped` (2 pts per citation, cap 10).
4. **Candidate Generation & Eligibility**:
   - Automated candidate-generation threshold: **`80.00% Potential Score`** (Raw 48/60).
   - `graduating_only = 1`, `gender_restriction = NULL`.
5. **Cumulative Progress**:
   - Active catalog exposes **`2 Verified / 15 Authoritative Baseline`** (`Notre Dame Award` + `Saint Marcellin Champagnat (SMC) Award` both `VERIFIED`).
   - Notre Dame Award passes all invariants without any scoring/mapping drift.

---

## 2. SMC Award Source-Fidelity Specification Matrix

| Metric / Dimension | Specification Value | Database Status |
|---|---|:---:|
| **Award Master Name** | `Saint Marcellin Champagnat (SMC) Award` | **VERIFIED** |
| **Award Code** | `SMC_AWARD` | **VERIFIED** |
| **Primary Key** | `50000001-0000-0000-0000-000000000021` | **VERIFIED** |
| **Authority Status** | `OFFICIAL` | **VERIFIED** |
| **Source Fidelity Status** | `VERIFIED` | **VERIFIED** |
| **Catalog Visibility** | `1` (Visible) | **VERIFIED** |
| **Graduating Students Only** | `1` (Yes) | **VERIFIED** |
| **Gender Restriction** | `NULL` (All) | **VERIFIED** |
| **Official Rubric Total** | `100.00 Points` | **VERIFIED** |
| **Max Computable Portfolio Score** | `60.00 Points` | **VERIFIED** |
| **Automated Candidate Threshold** | `80.00% Potential Score` (48/60) | **VERIFIED** |
| **Official Pass Requirement** | `85.00% + Panel Interview` | **SEPARATED** |

---

## 3. Official Criteria & Component Architecture

### Official Criteria Breakdown (100.00 pts)
1. `CRIT_SMC_SCHOLASTIC`: **Scholastic Achievement** — 20.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)
2. `CRIT_SMC_LEADERSHIP`: **Leadership: On and Off Campus** — 20.00 Max Pts (`is_portfolio_computable = 1`, `OFFICIAL`)
3. `CRIT_SMC_COMMUNITY`: **Community Involvement** — 30.00 Max Pts (`is_portfolio_computable = 1`, `OFFICIAL`)
4. `CRIT_SMC_CITATIONS`: **Citations Received Other than Academics** — 10.00 Max Pts (`is_portfolio_computable = 1`, `OFFICIAL`)
5. `CRIT_SMC_CHARACTER`: **Character** — 20.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)

### Criterion Components Breakdown (60.00 pts Computable)
- `COMP_SMC_LEAD_INVOLVE` (10.00 pts, `highest_only`): Sourced from `Leadership Position`.
- `COMP_SMC_LEAD_AWARDS` (10.00 pts, `sum_capped`): Sourced from `Citation / Recognition` and `Seminar / Training` (Leadership Development).
- `COMP_SMC_COMM_INVOLVE` (15.00 pts, `matrix_mapping`): Sourced from `Community Service / Volunteerism` and `Church / Ministry Involvement`.
- `COMP_SMC_COMM_INITIATED` (15.00 pts, `sum_capped`): Sourced from `Community Service / Volunteerism` and `Church / Ministry Involvement` (Role-based).
- `CRIT_SMC_CITATIONS` (10.00 pts, `sum_capped`): Sourced from `Citation / Recognition` (Non-academic only).

---

## 4. Verification Evidence & Test Output

```text
========================================================================
AchieveNest — Phase 2: SMC Award Full Source-Fidelity Verification
========================================================================
  SMC-IDENT-001  Exact Name "Saint Marcellin Champagnat (SMC) Award" [PASS]
  SMC-IDENT-002  Authority OFFICIAL, Status active, Source Fidelity VERIFIED [PASS]
  SMC-IDENT-003  Graduating restriction is active (graduating_only = 1) [PASS]
  SMC-IDENT-004  Candidate threshold is exactly 80.00%               [PASS]
  SMC-OFFIC-001  Exact 5 Official Criteria present in SMC Award      [PASS]
  SMC-OFFIC-002  Official Rubric Total sums to exactly 100.00 points [PASS]
  SMC-COMP-001   Computable Criteria max points sum to exactly 60.00 points [PASS]
  SMC-COMP-002   Scholastic (20) and Character (20) isolated as non-computable [PASS]
  SMC-A1-001     Component A1 rule configured as highest_only (max 10.00) [PASS]
  SMC-A2-001     Component A2 rule configured as sum_capped (max 10.00) [PASS]
  SMC-B1-001     Component B1 rule configured as matrix_mapping count (max 15.00) [PASS]
  SMC-B2-001     Component B2 rule configured as role-based sum_capped (max 15.00) [PASS]
  SMC-C-001      Component C rule configured as 2 pts/item capped at 10.00 [PASS]
  SMC-MAP-001    Exact 8 Evidence Mapping Rules active for SMC Award [PASS]
  SMC-SUMM-001   Evaluation Summary snapshot produced with complete totals [PASS]
  SMC-SUMM-002   Evaluation Summary exposes 60.00 computable max & 100.00 official max [PASS]
  SMC-SUMM-003   Evaluation Summary isolates non-computable criteria with panel notice [PASS]
  CUMUL-001      Active catalog exposes exactly 2 Verified / 15 Authoritative Baseline [PASS]
  NDA-REGR-001   Notre Dame Award preserved: 100 official / 50 computable / VERIFIED [PASS]
========================================================================
Phase 2 Verification Summary: 19 Passed, 0 Failed
========================================================================
```

---

## 5. Cumulative Master Regression Summary

| Suite Name | Target Domain | Result |
|---|---|:---:|
| `spark verify:awards-phase-2`  | SMC Award Full Source-Fidelity Verification | **19 / 19 PASS** |
| `spark verify:awards-phase-1b` | Notre Dame Award Full Stack Verification | **18 / 18 PASS** |
| `spark verify:awards-phase-1a` | Catalog Cleanup & Quarantine | **7 / 7 PASS** |
| `spark verify:awards-phase-1`  | Notre Dame Award Source Fidelity | **13 / 13 PASS** |
| `spark verify:awards-phase-j`  | Subsystem Closure Verification | **10 / 10 PASS** |
| `spark test:phase15-backend`   | Master Backend Regression (8 Suites) | **8 / 8 Suites PASS** |
| `npm test -- --run`            | Frontend Vitest Test Suites | **39 / 39 Files (239 Tests) PASS** |
| `npm run lint`                 | Frontend Quality / Static Analysis | **0 Errors** |
| `npm run build`                | Production Bundle Build | **Built in 2.49s** |

---

## 6. Final Phase 2 Gate Declaration

```text
========================================================================
AWARD 02: PASS — SAINT MARCELLIN CHAMPAGNAT (SMC) AWARD SOURCE-FIDELITY VERIFIED
PHASE 2: PASS — SMC AWARD VERIFIED AND FROZEN
========================================================================
```
