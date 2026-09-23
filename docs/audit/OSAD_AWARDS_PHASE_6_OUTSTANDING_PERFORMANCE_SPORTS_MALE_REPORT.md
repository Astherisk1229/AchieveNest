# OSAD Awards & Scoring Criteria — Phase 6 Outstanding Performance in Sports - Male Report

> **Executive Scope:** Execution of **Phase 6: Outstanding Performance in Sports - Male Full Source-Fidelity Remediation** under the Award-by-Award Source-Fidelity Remediation program. Verified the exact 100-point official rubric, 55-point computable model, sports skills presence (individual & team), athletic meets participation matrix, sports awards/medal matrix, male graduating eligibility ($\ge 80.00\%$ potential score), immutable evaluation summary generation, cumulative regression across Awards 01–05, and full regression parity.

---

## 1. Executive Summary & Objective

Phase 6 completes the Outstanding Performance in Sports - Male Award vertically across all layers of the system while maintaining the frozen Phase 1–5 baselines:
1. **Exact Award Identity**: Master Name `Outstanding Performance in Sports - Male`, Code `SPORTS_AWARD_MALE`, `authority_status = 'OFFICIAL'`, `source_fidelity_status = 'VERIFIED'`. (Strictly separated from the annual `Outstanding Athlete of the Year - Male` in Phase 13 and the female graduating Award in Phase 5).
2. **Official Evaluation Basis (100.00 pts)**:
   - Academic Achievement (15.00 pts) $\rightarrow$ Non-computable institutional requirement (`OFFICIAL`).
   - Skills and Attitude (40.00 pts) $\rightarrow$ Computable operationalization (Sports Skills Evidence = 20.00 max, Attitude = 20.00 non-computable).
   - Participation in Sports and Athletic Meets (20.00 pts) $\rightarrow$ Computable (`OFFICIAL`).
   - Awards Received (15.00 pts) $\rightarrow$ Computable (`OFFICIAL`).
   - Interview (10.00 pts) $\rightarrow$ Non-computable panel evaluation (`OFFICIAL`).
   - **Official Total**: Exactly 100.00 points.
   - **Portfolio-Computable Maximum**: Exactly 55.00 points ($20 + 20 + 15$).
   - **Non-Computable**: Exactly 45.00 points ($15 + 20 + 10$).
3. **Criterion Components & Scoring Engine (55.00 pts Computable)**:
   - **Component A1 (Individual Event Skills Evidence)**: 10.0 pts for verified individual event presence.
   - **Component A2 (Team Sports Skills Evidence)**: 10.0 pts for verified team sports presence.
   - **Component B (Participation in Sports Meets)**: PRISAA National=7, Regional=5, Local=2, NDEA=4, INTRAMS=2, cap 20.
   - **Component C (Awards Received in Sports)**:
     - PRISAA National: Gold=7, Silver=5, Bronze=3
     - PRISAA Regional: Gold=5, Silver=3, Bronze=2
     - PRISAA Local: Gold=3, Silver=2, Bronze=1
     - NDEA: Gold=4, Silver=4, Bronze=2
     - INTRAMS: Gold=2, Silver=1, Bronze=1
     - Cap 15.
4. **Candidate Generation & Eligibility**:
   - Automated candidate-generation threshold: **`80.00% Potential Score`** (Raw 44/55).
   - `graduating_only = 1`, `gender_restriction = 'male'`.
5. **Cumulative Progress**:
   - Active catalog exposes **`6 Verified / 15 Authoritative Baseline`** (`Notre Dame Award`, `Saint Marcellin Champagnat (SMC) Award`, `Leadership Award`, `Campus Journalism Award`, `Outstanding Performance in Sports - Female`, `Outstanding Performance in Sports - Male` all `VERIFIED`).
   - Awards 01–05 Baselines retain 100% regression invariance without any scoring or mapping drift.

---

## 2. Sports Male Award Source-Fidelity Specification Matrix

| Metric / Dimension | Specification Value | Database Status |
|---|---|:---:|
| **Award Master Name** | `Outstanding Performance in Sports - Male` | **VERIFIED** |
| **Award Code** | `SPORTS_AWARD_MALE` | **VERIFIED** |
| **Primary Key** | `50000001-0000-0000-0000-000000000025` | **VERIFIED** |
| **Authority Status** | `OFFICIAL` | **VERIFIED** |
| **Source Fidelity Status** | `VERIFIED` | **VERIFIED** |
| **Catalog Visibility** | `1` (Visible) | **VERIFIED** |
| **Graduating Students Only** | `1` (Yes) | **VERIFIED** |
| **Gender Restriction** | `male` | **VERIFIED** |
| **Official Rubric Total** | `100.00 Points` | **VERIFIED** |
| **Max Computable Portfolio Score** | `55.00 Points` | **VERIFIED** |
| **Automated Candidate Threshold** | `80.00% Potential Score` (44/55) | **VERIFIED** |
| **Annual Counterpart Separation** | Distinct from `OUTSTANDING_ATHLETE_MALE` (Annual) | **PRESERVED** |

---

## 3. Official Criteria & Component Architecture

### Official Criteria Breakdown (100.00 pts)
1. `CRIT_SPORTS_M_ACADEMIC`: **Academic Achievement** — 15.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)
2. `CRIT_SPORTS_M_SKILLS_ATTITUDE`: **Skills and Attitude** — 40.00 Weight / 20.00 Computable Max (`is_portfolio_computable = 1`, `OFFICIAL`)
3. `CRIT_SPORTS_M_PARTICIPATION`: **Participation in Sports and Athletic Meets** — 20.00 Max Pts (`is_portfolio_computable = 1`, `OFFICIAL`)
4. `CRIT_SPORTS_M_AWARDS`: **Awards Received** — 15.00 Max Pts (`is_portfolio_computable = 1`, `OFFICIAL`)
5. `CRIT_SPORTS_M_INTERVIEW`: **Interview** — 10.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)

### Criterion Components Breakdown (55.00 pts Computable)
- `COMP_SPORTS_M_INDIV_SKILLS` (10.00 pts, presence): Verified Individual Event participation.
- `COMP_SPORTS_M_TEAM_SKILLS` (10.00 pts, presence): Verified Team Sports participation.
- `COMP_SPORTS_M_PARTICIPATION` (20.00 pts, meet matrix): Sourced from `Sports` meet participation.
- `COMP_SPORTS_M_AWARDS` (15.00 pts, medal matrix): Sourced from `Sports` tournament medals.

---

## 4. Verification Evidence & Test Output

```text
========================================================================
AchieveNest — Phase 6: Sports Male Award Full Stack Verification
========================================================================
  SPORTS-M-IDENT-001 Exact Name "Outstanding Performance in Sports - Male" [PASS]
  SPORTS-M-IDENT-002 Authority OFFICIAL, Status active, Source Fidelity VERIFIED [PASS]
  SPORTS-M-IDENT-003 Graduating only & male restriction are active   [PASS]
  SPORTS-M-IDENT-004 Candidate threshold is exactly 80.00%           [PASS]
  SPORTS-M-OFFIC-001 Exact 5 Official Criteria present in Sports Male Award [PASS]
  SPORTS-M-OFFIC-002 Official Rubric Total sums to exactly 100.00 points [PASS]
  SPORTS-M-COMP-001  Computable Criteria max points sum to exactly 55.00 points [PASS]
  SPORTS-M-COMP-002  Academic (15) and Interview (10) isolated as non-computable [PASS]
  SPORTS-M-A1-001    Component A1 rule configured as individual presence (max 10.00) [PASS]
  SPORTS-M-A2-001    Component A2 rule configured as team presence (max 10.00) [PASS]
  SPORTS-M-B-001     Component B rule configured as participation matrix (max 20.00) [PASS]
  SPORTS-M-C-001     Component C rule configured as medal matrix (max 15.00) [PASS]
  SPORTS-M-MAP-001   Exact 4 Evidence Mapping Rules active for Sports Male [PASS]
  SPORTS-M-SUMM-001  Evaluation Summary snapshot produced with complete totals [PASS]
  SPORTS-M-SUMM-002  Evaluation Summary exposes 55.00 computable max & 100.00 official max [PASS]
  CUMUL-001          Active catalog exposes exactly 6 Verified / 15 Authoritative Baseline [PASS]
  NDA-REGR-001       Notre Dame Award preserved: 100 official / 50 computable / VERIFIED [PASS]
  SMC-REGR-001       SMC Award preserved: 100 official / 60 computable / VERIFIED [PASS]
  LEAD-REGR-001      Leadership Award preserved: 100 official / 50 computable / VERIFIED [PASS]
  JOURN-REGR-001     Campus Journalism preserved: 100 official / 70 computable / VERIFIED [PASS]
  SPORTS-F-REGR-001  Sports Female preserved: 100 official / 55 computable / female / VERIFIED [PASS]
========================================================================
Phase 6 Verification Summary: 21 Passed, 0 Failed
========================================================================
```

---

## 5. Cumulative Master Regression Summary

| Suite Name | Target Domain | Result |
|---|---|:---:|
| `spark verify:awards-phase-6`  | Sports Male Award Full Stack Verification | **21 / 21 PASS** |
| `spark verify:awards-phase-5`  | Sports Female Award Full Stack Verification | **20 / 20 PASS** |
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
| `npm run build`                | Production Bundle Build | **Built in 2.04s** |

---

## 6. Final Phase 6 Gate Declaration

```text
========================================================================
AWARD 06: PASS — OUTSTANDING PERFORMANCE IN SPORTS - MALE SOURCE-FIDELITY VERIFIED
PHASE 6: PASS — OUTSTANDING PERFORMANCE IN SPORTS - MALE VERIFIED AND FROZEN
========================================================================
```
