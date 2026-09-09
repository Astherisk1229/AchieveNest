# OSAD Awards & Scoring Criteria — Phase 4 Campus Journalism Award Report

> **Executive Scope:** Execution of **Phase 4: Campus Journalism Award Full Source-Fidelity Remediation** under the Award-by-Award Source-Fidelity Remediation program. Verified the exact 100-point official rubric, 70-point computable model, 6 criterion components (News Item, Literary Work, Column, Editorial, Leadership Role, Journalism Awards/Citations), 8 evidence mapping rules, graduating eligibility ($\ge 80.00\%$ potential score), immutable evaluation summary generation, cumulative regression across Awards 01–03, and full regression parity.

---

## 1. Executive Summary & Objective

Phase 4 completes the Campus Journalism Award vertically across all layers of the system while maintaining the frozen Phase 1–3 baselines:
1. **Exact Award Identity**: Master Name `Campus Journalism Award`, Code `CAMPUS_JOURNALISM_AWARD`, `authority_status = 'OFFICIAL'`, `source_fidelity_status = 'VERIFIED'`.
2. **Official Evaluation Basis (100.00 pts)**:
   - Character (20.00 pts) $\rightarrow$ Non-computable institutional requirement (`OFFICIAL`).
   - Quality of Publication (60.00 pts) $\rightarrow$ Computable operationalization (`SYSTEM_OPERATIONALIZATION`).
   - Leadership (10.00 pts) $\rightarrow$ Computable (`OFFICIAL`).
   - Interview (10.00 pts) $\rightarrow$ Non-computable panel evaluation (`OFFICIAL`).
   - **Official Total**: Exactly 100.00 points.
   - **Portfolio-Computable Maximum**: Exactly 70.00 points ($60 + 10$).
   - **Non-Computable**: Exactly 30.00 points ($20 + 10$).
3. **Criterion Components & Scoring Engine (70.00 pts Computable)**:
   - **Component A1 (News Item Evidence)**: 2.0 pts per verified published News Item, cap 10.
   - **Component A2 (Literary Evidence)**: 2.0 pts per verified published Literary Work, cap 10.
   - **Component A3 (Column Evidence)**: 4.0 pts per verified published Column, cap 20.
   - **Component A4 (Editorial Evidence)**: 4.0 pts per verified published Editorial, cap 20.
   - **Component B1 (Leadership Involvement)**: Publication Officer=3, Member/contributor=2, cap 5.
   - **Component B2 (Journalism Awards / Citations)**: Int'l/National=3, Local=2, cap 5; Seminars mapped as supporting evidence with 0 pts.
4. **Candidate Generation & Eligibility**:
   - Automated candidate-generation threshold: **`80.00% Potential Score`** (Raw 56/70).
   - `graduating_only = 1`, `gender_restriction = NULL`.
5. **Cumulative Progress**:
   - Active catalog exposes **`4 Verified / 15 Authoritative Baseline`** (`Notre Dame Award` + `Saint Marcellin Champagnat (SMC) Award` + `Leadership Award` + `Campus Journalism Award` all `VERIFIED`).
   - Awards 01–03 Baselines retain 100% regression invariance without any scoring or mapping drift.

---

## 2. Campus Journalism Award Source-Fidelity Specification Matrix

| Metric / Dimension | Specification Value | Database Status |
|---|---|:---:|
| **Award Master Name** | `Campus Journalism Award` | **VERIFIED** |
| **Award Code** | `CAMPUS_JOURNALISM_AWARD` | **VERIFIED** |
| **Primary Key** | `50000001-0000-0000-0000-000000000023` | **VERIFIED** |
| **Authority Status** | `OFFICIAL` | **VERIFIED** |
| **Source Fidelity Status** | `VERIFIED` | **VERIFIED** |
| **Catalog Visibility** | `1` (Visible) | **VERIFIED** |
| **Graduating Students Only** | `1` (Yes) | **VERIFIED** |
| **Gender Restriction** | `NULL` (All) | **VERIFIED** |
| **Official Rubric Total** | `100.00 Points` | **VERIFIED** |
| **Max Computable Portfolio Score** | `70.00 Points` | **VERIFIED** |
| **Automated Candidate Threshold** | `80.00% Potential Score` (56/70) | **VERIFIED** |
| **Operational Limitation Notice** | Quality evaluated by panel; portfolio operationalizes publication evidence | **DECLARED** |

---

## 3. Official Criteria & Component Architecture

### Official Criteria Breakdown (100.00 pts)
1. `CRIT_JOURN_CHARACTER`: **Character** — 20.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)
2. `CRIT_JOURN_PUB_QUALITY`: **Quality of Publication** — 60.00 Max Pts (`is_portfolio_computable = 1`, `SYSTEM_OPERATIONALIZATION`)
3. `CRIT_JOURN_LEADERSHIP`: **Leadership** — 10.00 Max Pts (`is_portfolio_computable = 1`, `OFFICIAL`)
4. `CRIT_JOURN_INTERVIEW`: **Interview** — 10.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)

### Criterion Components Breakdown (70.00 pts Computable)
- `COMP_JOURN_NEWS` (10.00 pts, `sum_capped`): Sourced from `Campus Journalism → News Item` (2 pts/item).
- `COMP_JOURN_LITERARY` (10.00 pts, `sum_capped`): Sourced from `Campus Journalism → Literary Work` (2 pts/item).
- `COMP_JOURN_COLUMN` (20.00 pts, `sum_capped`): Sourced from `Campus Journalism → Column` (4 pts/item).
- `COMP_JOURN_EDITORIAL` (20.00 pts, `sum_capped`): Sourced from `Campus Journalism → Editorial` (4 pts/item).
- `COMP_JOURN_LEAD_ROLE` (5.00 pts, `sum_capped`): Sourced from `Campus Journalism → Publication Officer / Member` (Officer=3, Member=2).
- `COMP_JOURN_LEAD_AWARDS` (5.00 pts, `sum_capped`): Sourced from `Citation / Recognition` (3 intl, 2 local) and `Seminar / Training` (0 pts).

---

## 4. Verification Evidence & Test Output

```text
========================================================================
AchieveNest — Phase 4: Campus Journalism Award Full Stack Verification
========================================================================
  JOURN-IDENT-001  Exact Name "Campus Journalism Award" & Code       [PASS]
  JOURN-IDENT-002  Authority OFFICIAL, Status active, Source Fidelity VERIFIED [PASS]
  JOURN-IDENT-003  Graduating restriction is active (graduating_only = 1) [PASS]
  JOURN-IDENT-004  Candidate threshold is exactly 80.00%             [PASS]
  JOURN-OFFIC-001  Exact 4 Official Criteria present in Campus Journalism Award [PASS]
  JOURN-OFFIC-002  Official Rubric Total sums to exactly 100.00 points [PASS]
  JOURN-COMP-001   Computable Criteria max points sum to exactly 70.00 points [PASS]
  JOURN-COMP-002   Character (20) and Interview (10) isolated as non-computable [PASS]
  JOURN-A1-001     Component A1 rule configured as 2 pts/item (max 10.00) [PASS]
  JOURN-A2-001     Component A2 rule configured as 2 pts/item (max 10.00) [PASS]
  JOURN-A3-001     Component A3 rule configured as 4 pts/item (max 20.00) [PASS]
  JOURN-A4-001     Component A4 rule configured as 4 pts/item (max 20.00) [PASS]
  JOURN-B1-001     Component B1 rule configured as role-based (max 5.00) [PASS]
  JOURN-B2-001     Component B2 rule configured with 0 pts for seminars (max 5.00) [PASS]
  JOURN-MAP-001    Exact 8 Evidence Mapping Rules active for Campus Journalism [PASS]
  JOURN-SUMM-001   Evaluation Summary snapshot produced with complete totals [PASS]
  JOURN-SUMM-002   Evaluation Summary exposes 70.00 computable max & 100.00 official max [PASS]
  JOURN-SUMM-003   Evaluation Summary isolates 2 non-computable criteria with panel notice [PASS]
  CUMUL-001        Active catalog exposes exactly 4 Verified / 15 Authoritative Baseline [PASS]
  NDA-REGR-001     Notre Dame Award preserved: 100 official / 50 computable / VERIFIED [PASS]
  SMC-REGR-001     SMC Award preserved: 100 official / 60 computable / VERIFIED [PASS]
  LEAD-REGR-001    Leadership Award preserved: 100 official / 50 computable / VERIFIED [PASS]
========================================================================
Phase 4 Verification Summary: 22 Passed, 0 Failed
========================================================================
```

---

## 5. Cumulative Master Regression Summary

| Suite Name | Target Domain | Result |
|---|---|:---:|
| `spark verify:awards-phase-4`  | Campus Journalism Award Full Stack Verification | **22 / 22 PASS** |
| `spark verify:awards-phase-3`  | Leadership Award Full Stack Verification | **20 / 20 PASS** |
| `spark verify:awards-phase-2`  | SMC Award Full Source-Fidelity Verification | **19 / 19 PASS** |
| `spark verify:awards-phase-1b` | Notre Dame Award Full Stack Verification | **18 / 18 PASS** |
| `spark verify:awards-phase-1a` | Catalog Cleanup & Quarantine | **7 / 7 PASS** |
| `spark verify:awards-phase-1`  | Notre Dame Award Source Fidelity | **13 / 13 PASS** |
| `spark verify:awards-phase-j`  | Subsystem Closure Verification | **10 / 10 PASS** |
| `spark test:phase15-backend`   | Master Backend Regression (8 Suites) | **8 / 8 Suites PASS** |
| `npm test -- --run`            | Frontend Vitest Test Suites | **39 / 39 Files (239 Tests) PASS** |
| `npm run lint`                 | Frontend Quality / Static Analysis | **0 Errors** |
| `npm run build`                | Production Bundle Build | **Built in 1.98s** |

---

## 6. Final Phase 4 Gate Declaration

```text
========================================================================
AWARD 04: PASS — CAMPUS JOURNALISM AWARD SOURCE-FIDELITY VERIFIED
PHASE 4: PASS — CAMPUS JOURNALISM AWARD VERIFIED AND FROZEN
========================================================================
```
