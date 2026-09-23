# OSAD Awards & Scoring Criteria — Phase 3 Leadership Award Report

> **Executive Scope:** Execution of **Phase 3: Leadership Award Full Source-Fidelity Remediation** under the Award-by-Award Source-Fidelity Remediation program. Verified the exact 100-point official rubric, 50-point computable model, 5 criterion components (`highest_only`, `sum_capped` with **3 points** for local awards, `highest_only` civic matrix, bucket presence rule, initiated context rule), 6 evidence mapping rules, graduating eligibility ($\ge 80.00\%$ potential score), immutable evaluation summary generation, cumulative regression across Notre Dame and SMC Awards, and full regression parity.

---

## 1. Executive Summary & Objective

Phase 3 completes the Leadership Award vertically across all layers of the system while maintaining the frozen Phase 1 (Notre Dame Award) and Phase 2 (SMC Award) baselines:
1. **Exact Award Identity**: Master Name `Leadership Award`, Code `LEADERSHIP_AWARD`, `authority_status = 'OFFICIAL'`, `source_fidelity_status = 'VERIFIED'`. (Strictly separated from the annual `Outstanding Student Leader of the Year`).
2. **Official Evaluation Basis (100.00 pts)**:
   - Scholastic Achievement (20.00 pts) $\rightarrow$ Non-computable institutional requirement (`OFFICIAL`).
   - Leadership: On and Off Campus (30.00 pts) $\rightarrow$ Computable (`OFFICIAL`).
   - Community Involvement (20.00 pts) $\rightarrow$ Computable (`OFFICIAL`).
   - Character (20.00 pts) $\rightarrow$ Non-computable panel evaluation (`OFFICIAL`).
   - Interview (10.00 pts) $\rightarrow$ Non-computable panel evaluation (`OFFICIAL`).
   - **Official Total**: Exactly 100.00 points.
   - **Portfolio-Computable Maximum**: Exactly 50.00 points ($30 + 20$).
   - **Non-Computable**: Exactly 50.00 points ($20 + 20 + 10$).
3. **Criterion Components & Scoring Engine (50.00 pts Computable)**:
   - **Component A1 (Leadership Involvement)**: `highest_only` (University/SSG=10, College=8, Club=6, Year=4, max 10).
   - **Component A2 (Leadership Awards, Citations & Seminars)**: `sum_capped` (International=5, **Local=3** [Specific to Leadership Award], Seminar=2, cap 10).
   - **Component A3 (Civic Involvement)**: `highest_only` (Barangay=10, Municipal=8, Provincial=8, National=8, max 10).
   - **Component B1 (Church Ministries / Organizations)**: Bucket presence accumulation (School-based=4, Community-based=3, Church Org=3, cap 10).
   - **Component B2 (Initiated Church-Related Activities)**: Context-based initiation (School-based=6, Community-based=4, cap 10; participation-only receives 0).
4. **Candidate Generation & Eligibility**:
   - Automated candidate-generation threshold: **`80.00% Potential Score`** (Raw 40/50).
   - `graduating_only = 1`, `gender_restriction = NULL`.
5. **Cumulative Progress**:
   - Active catalog exposes **`3 Verified / 15 Authoritative Baseline`** (`Notre Dame Award` + `Saint Marcellin Champagnat (SMC) Award` + `Leadership Award` all `VERIFIED`).
   - Phase 1 & 2 Baselines retain 100% regression invariance without any scoring or mapping drift.

---

## 2. Leadership Award Source-Fidelity Specification Matrix

| Metric / Dimension | Specification Value | Database Status |
|---|---|:---:|
| **Award Master Name** | `Leadership Award` | **VERIFIED** |
| **Award Code** | `LEADERSHIP_AWARD` | **VERIFIED** |
| **Primary Key** | `50000001-0000-0000-0000-000000000022` | **VERIFIED** |
| **Authority Status** | `OFFICIAL` | **VERIFIED** |
| **Source Fidelity Status** | `VERIFIED` | **VERIFIED** |
| **Catalog Visibility** | `1` (Visible) | **VERIFIED** |
| **Graduating Students Only** | `1` (Yes) | **VERIFIED** |
| **Gender Restriction** | `NULL` (All) | **VERIFIED** |
| **Official Rubric Total** | `100.00 Points` | **VERIFIED** |
| **Max Computable Portfolio Score** | `50.00 Points` | **VERIFIED** |
| **Automated Candidate Threshold** | `80.00% Potential Score` (40/50) | **VERIFIED** |
| **Annual Counterpart Separation** | Distinct from `STUDENT_LEADER_OF_THE_YEAR` | **PRESERVED** |

---

## 3. Official Criteria & Component Architecture

### Official Criteria Breakdown (100.00 pts)
1. `CRIT_LEAD_SCHOLASTIC`: **Scholastic Achievement** — 20.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)
2. `CRIT_LEAD_CAMPUS_LEAD`: **Leadership: On and Off Campus** — 30.00 Max Pts (`is_portfolio_computable = 1`, `OFFICIAL`)
3. `CRIT_LEAD_COMMUNITY`: **Community Involvement** — 20.00 Max Pts (`is_portfolio_computable = 1`, `OFFICIAL`)
4. `CRIT_LEAD_CHARACTER`: **Character** — 20.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)
5. `CRIT_LEAD_INTERVIEW`: **Interview** — 10.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)

### Criterion Components Breakdown (50.00 pts Computable)
- `COMP_LEAD_INVOLVE` (10.00 pts, `highest_only`): Sourced from `Leadership Position`.
- `COMP_LEAD_AWARDS` (10.00 pts, `sum_capped`): Sourced from `Citation / Recognition` (5 intl, 3 local) and `Seminar / Training` (2 pts).
- `COMP_LEAD_CIVIC` (10.00 pts, `highest_only`): Sourced from `Community Service / Volunteerism` (Barangay=10, Municipal/Provincial/National=8).
- `COMP_LEAD_CHURCH_MINISTRY` (10.00 pts, bucket presence): Sourced from `Church / Ministry Involvement` (School=4, Community=3, Org=3).
- `COMP_LEAD_CHURCH_INITIATED` (10.00 pts, context-based initiation): Sourced from `Church / Ministry Involvement` (School=6, Community=4).

---

## 4. Verification Evidence & Test Output

```text
========================================================================
AchieveNest — Phase 3: Leadership Award Full Stack Verification
========================================================================
  LEAD-IDENT-001 Exact Name "Leadership Award" & Code LEADERSHIP_AWARD [PASS]
  LEAD-IDENT-002 Authority OFFICIAL, Status active, Source Fidelity VERIFIED [PASS]
  LEAD-IDENT-003 Graduating restriction is active (graduating_only = 1) [PASS]
  LEAD-IDENT-004 Candidate threshold is exactly 80.00%               [PASS]
  LEAD-OFFIC-001 Exact 5 Official Criteria present in Leadership Award [PASS]
  LEAD-OFFIC-002 Official Rubric Total sums to exactly 100.00 points [PASS]
  LEAD-COMP-001  Computable Criteria max points sum to exactly 50.00 points [PASS]
  LEAD-COMP-002  Scholastic (20), Character (20), and Interview (10) isolated [PASS]
  LEAD-A1-001    Component A1 rule configured as highest_only (max 10.00) [PASS]
  LEAD-A2-001    Component A2 rule configured with 3 pts for local award (max 10.00) [PASS]
  LEAD-A3-001    Component A3 rule configured as highest_only (max 10.00) [PASS]
  LEAD-B1-001    Component B1 rule configured as bucket presence rule (max 10.00) [PASS]
  LEAD-B2-001    Component B2 rule configured as initiated context rule (max 10.00) [PASS]
  LEAD-MAP-001   Exact 6 Evidence Mapping Rules active for Leadership Award [PASS]
  LEAD-SUMM-001  Evaluation Summary snapshot produced with complete totals [PASS]
  LEAD-SUMM-002  Evaluation Summary exposes 50.00 computable max & 100.00 official max [PASS]
  LEAD-SUMM-003  Evaluation Summary isolates 3 non-computable criteria with panel notice [PASS]
  CUMUL-001      Active catalog exposes exactly 3 Verified / 15 Authoritative Baseline [PASS]
  NDA-REGR-001   Notre Dame Award preserved: 100 official / 50 computable / VERIFIED [PASS]
  SMC-REGR-001   SMC Award preserved: 100 official / 60 computable / VERIFIED [PASS]
========================================================================
Phase 3 Verification Summary: 20 Passed, 0 Failed
========================================================================
```

---

## 5. Cumulative Master Regression Summary

| Suite Name | Target Domain | Result |
|---|---|:---:|
| `spark verify:awards-phase-3`  | Leadership Award Full Stack Verification | **20 / 20 PASS** |
| `spark verify:awards-phase-2`  | SMC Award Full Source-Fidelity Verification | **19 / 19 PASS** |
| `spark verify:awards-phase-1b` | Notre Dame Award Full Stack Verification | **18 / 18 PASS** |
| `spark verify:awards-phase-1a` | Catalog Cleanup & Quarantine | **7 / 7 PASS** |
| `spark verify:awards-phase-1`  | Notre Dame Award Source Fidelity | **13 / 13 PASS** |
| `spark verify:awards-phase-j`  | Subsystem Closure Verification | **10 / 10 PASS** |
| `spark test:phase15-backend`   | Master Backend Regression (8 Suites) | **8 / 8 Suites PASS** |
| `npm test -- --run`            | Frontend Vitest Test Suites | **39 / 39 Files (239 Tests) PASS** |
| `npm run lint`                 | Frontend Quality / Static Analysis | **0 Errors** |
| `npm run build`                | Production Bundle Build | **Built in 3.14s** |

---

## 6. Final Phase 3 Gate Declaration

```text
========================================================================
AWARD 03: PASS — LEADERSHIP AWARD SOURCE-FIDELITY VERIFIED
PHASE 3: PASS — LEADERSHIP AWARD VERIFIED AND FROZEN
========================================================================
```
