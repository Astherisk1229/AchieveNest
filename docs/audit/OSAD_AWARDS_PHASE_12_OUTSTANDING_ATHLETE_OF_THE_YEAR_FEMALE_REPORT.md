# OSAD Awards & Scoring Criteria — Phase 12 Outstanding Athlete of the Year - Female Report

> **Executive Scope:** Execution of **Phase 12: Outstanding Athlete of the Year - Female Full Source-Fidelity Remediation** under the Award-by-Award Source-Fidelity Remediation program. Verified the exact 100-point official rubric, 55-point computable model, sports skills presence scoring (Individual=10, Team=10, cap 20), athletic meets participation scoring (PRISAA Nat=7, Reg=5, Local=2, NDEA=4, INTRAMS=2, cap 20), awards medal matrix scoring (Gold: 7/5/3/4/2, Silver: 5/3/2/4/1, Bronze: 3/2/1/2/1, cap 15), annual female eligibility, strict isolation from Phase 5 graduating award, potential-candidate discovery vs official nomination separation, cumulative regression across Awards 01–11, and full regression parity.

---

## 1. Executive Summary & Objective

Phase 12 completes the Outstanding Athlete of the Year - Female Award vertically across all layers of the system while maintaining the frozen Phase 1–11 baselines:
1. **Exact Award Identity**: Master Name `Outstanding Athlete of the Year - Female`, Code `ATHLETE_OF_THE_YEAR_FEMALE`, `authority_status = 'OFFICIAL'`, `source_fidelity_status = 'VERIFIED'`.
2. **Official Evaluation Basis (100.00 pts)**:
   - Academic Achievement (15.00 pts) $\rightarrow$ Non-computable institutional requirement (`OFFICIAL`).
   - Skills and Attitude (40.00 pts official weight):
     - Operationalized Computable Portion: **20.00 pts** (Sports Skills Evidence — Individual 10.00 + Team 10.00).
     - Non-computable Portion: **20.00 pts** (Attitude / Sportsmanship $\rightarrow$ Non-computable human evaluation).
   - Participation in Sports and Athletic Meets (20.00 pts) $\rightarrow$ Computable (`OFFICIAL`).
   - Awards Received (15.00 pts) $\rightarrow$ Computable (`OFFICIAL`).
   - Interview (10.00 pts) $\rightarrow$ Non-computable panel evaluation (`OFFICIAL`).
   - **Official Total**: Exactly 100.00 points.
   - **Portfolio-Computable Maximum**: Exactly 55.00 points ($20 + 20 + 15$).
   - **Non-Computable**: Exactly 45.00 points ($15 + 20 + 10$).
3. **Criterion Components & Scoring Engine (55.00 pts Computable)**:
   - **Component A1 (Individual Event Sports Skills Evidence, 10 pts max)**:
     - Verified individual sports event $\ge 1 \rightarrow 10$ pts presence rule.
   - **Component A2 (Team Sports Skills Evidence, 10 pts max)**:
     - Verified team sports event $\ge 1 \rightarrow 10$ pts presence rule.
   - **Component B (Participation in Sports and Athletic Meets, 20 pts max)**:
     - PRISAA National=7, Regional=5, Local=2, NDEA=4, INTRAMS=2, capped at 20.
   - **Component C (Awards Received in Sports Competitions, 15 pts max)**:
     - Gold: 7/5/3/4/2, Silver: 5/3/2/4/1, Bronze: 3/2/1/2/1, capped at 15.
4. **Candidate Generation & Eligibility**:
   - Automated candidate-generation threshold: **`80.00% Potential Score`** (Raw 44/55).
   - `graduating_only = 0` (Annual Award Cycle), `gender_restriction = 'female'`.
5. **Critical Distinction from Phase 5 (`SPORTS_AWARD_FEMALE`)**:
   - Phase 5 is the **graduating-only** sports female award (`graduating_only = 1`).
   - Phase 12 is the **annual** sports female award (`graduating_only = 0`).
   - Both retain independent scoring definitions, candidate scopes, and evaluation summaries.
6. **Cumulative Progress**:
   - Active catalog exposes **`12 Verified / 15 Authoritative Baseline`** (Awards 01–12 all `VERIFIED`).
   - Awards 01–11 Baselines retain 100% regression invariance without drift.

---

## 2. Athlete of the Year Female Specification Matrix

| Metric / Dimension | Specification Value | Database Status |
|---|---|:---:|
| **Award Master Name** | `Outstanding Athlete of the Year - Female` | **VERIFIED** |
| **Award Code** | `ATHLETE_OF_THE_YEAR_FEMALE` | **VERIFIED** |
| **Primary Key** | `50000001-0000-0000-0000-000000000031` | **VERIFIED** |
| **Authority Status** | `OFFICIAL` | **VERIFIED** |
| **Source Fidelity Status** | `VERIFIED` | **VERIFIED** |
| **Catalog Visibility** | `1` (Visible) | **VERIFIED** |
| **Graduating Students Only** | `0` (Annual Award) | **VERIFIED** |
| **Gender Restriction** | `female` | **VERIFIED** |
| **Official Rubric Total** | `100.00 Points` | **VERIFIED** |
| **Max Computable Portfolio Score** | `55.00 Points` | **VERIFIED** |
| **Automated Candidate Threshold** | `80.00% Potential Score` (44/55) | **VERIFIED** |
| **Phase 5 Separation** | Distinct from `SPORTS_AWARD_FEMALE` (Graduating) | **PRESERVED** |

---

## 3. Official Criteria & Component Architecture

### Official Criteria Breakdown (100.00 pts)
1. `CRIT_ATHLETE_F_ACADEMIC`: **Academic Achievement** — 15.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)
2. `CRIT_ATHLETE_F_SKILLS_ATTITUDE`: **Skills and Attitude** — 40.00 Weight / 20.00 Computable Max Pts (`is_portfolio_computable = 1`, `OFFICIAL`)
3. `CRIT_ATHLETE_F_PARTICIPATION`: **Participation in Sports and Athletic Meets** — 20.00 Max Pts (`is_portfolio_computable = 1`, `OFFICIAL`)
4. `CRIT_ATHLETE_F_AWARDS`: **Awards Received** — 15.00 Max Pts (`is_portfolio_computable = 1`, `OFFICIAL`)
5. `CRIT_ATHLETE_F_INTERVIEW`: **Interview** — 10.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)

### Criterion Components Breakdown (55.00 pts Computable)
- `COMP_ATHLETE_F_INDIV_SKILLS` (10.00 pts, presence): Individual Sports Skills Evidence.
- `COMP_ATHLETE_F_TEAM_SKILLS` (10.00 pts, presence): Team Sports Skills Evidence.
- `COMP_ATHLETE_F_PARTICIPATION` (20.00 pts, sum_capped): PRISAA Nat=7, Reg=5, Local=2, NDEA=4, INTRAMS=2.
- `COMP_ATHLETE_F_AWARDS` (15.00 pts, medal matrix): Gold: 7/5/3/4/2, Silver: 5/3/2/4/1, Bronze: 3/2/1/2/1.

---

## 4. Verification Evidence & Test Output

```text
========================================================================
AchieveNest — Phase 12: Athlete Female Award Full Stack Verification
========================================================================
  ATHLETE-F-IDENT-001 Exact Name "Outstanding Athlete of the Year - Female" [PASS]
  ATHLETE-F-IDENT-002 Authority OFFICIAL, Status active, Source Fidelity VERIFIED [PASS]
  ATHLETE-F-IDENT-003 Annual cycle (graduating_only = 0) & female restriction [PASS]
  ATHLETE-F-IDENT-004 Candidate threshold is exactly 80.00%           [PASS]
  ATHLETE-F-OFFIC-001 Exact 5 Official Criteria present in Athlete Female Award [PASS]
  ATHLETE-F-OFFIC-002 Official Rubric Total sums to exactly 100.00 points [PASS]
  ATHLETE-F-COMP-001 Computable Criteria max points sum to exactly 55.00 points [PASS]
  ATHLETE-F-COMP-002 Academic (15) and Interview (10) isolated as non-computable [PASS]
  ATHLETE-F-A1-001   Component A1 configured as individual presence (max 10.00) [PASS]
  ATHLETE-F-A2-001   Component A2 configured as team presence (max 10.00) [PASS]
  ATHLETE-F-B-001    Component B configured as participation matrix (PRISAA Nat=7, max 20.00) [PASS]
  ATHLETE-F-C-001    Component C configured as medal matrix (Nat Gold=7, max 15.00) [PASS]
  ATHLETE-F-MAP-001  Exact 4 Evidence Mapping Rules active for Athlete Female Award [PASS]
  ATHLETE-F-SUMM-001 Evaluation Summary snapshot produced with complete totals [PASS]
  ATHLETE-F-SUMM-002 Evaluation Summary exposes 55.00 computable max & 100.00 official max [PASS]
  CUMUL-001          Active catalog exposes exactly 12 Verified / 15 Authoritative Baseline [PASS]
  NDA-REGR-001       Notre Dame Award preserved: 100 official / 50 computable / VERIFIED [PASS]
  SMC-REGR-001       SMC Award preserved: 100 official / 60 computable / VERIFIED [PASS]
  LEAD-REGR-001      Leadership Award preserved: 100 official / 50 computable / VERIFIED [PASS]
  JOURN-REGR-001     Campus Journalism preserved: 100 official / 70 computable / VERIFIED [PASS]
  SPORTS-F-REGR-001  Sports Female preserved: 100 official / 55 computable / Graduating / female / VERIFIED (distinct from Annual Athlete Female) [PASS]
  SPORTS-M-REGR-001  Sports Male preserved: 100 official / 55 computable / male / VERIFIED [PASS]
  SOCIO-F-REGR-001   Socio-Cultural Female preserved: PROPOSED / 55 computable / female / VERIFIED [PASS]
  SOCIO-M-REGR-001   Socio-Cultural Male preserved: PROPOSED / 55 computable / male / VERIFIED [PASS]
  LEADER-YR-REGR-001 Student Leader of the Year preserved: 100 official / 50 computable / Annual / VERIFIED [PASS]
  MEMBER-YR-REGR-001 Member of the Year preserved: 100 official / 40 computable / Annual / VERIFIED [PASS]
  VOLUNTEER-YR-REGR-001 Volunteer of the Year preserved: 100 official / 50 computable / Annual / VERIFIED [PASS]
========================================================================
Phase 12 Verification Summary: 27 Passed, 0 Failed
========================================================================
```

---

## 5. Cumulative Master Regression Summary

| Suite Name | Target Domain | Result |
|---|---|:---:|
| `spark verify:awards-phase-12` | Athlete of the Year Female Full Stack Verification | **27 / 27 PASS** |
| `spark verify:awards-phase-11` | Volunteer of the Year Full Stack Verification | **27 / 27 PASS** |
| `spark verify:awards-phase-10` | Member of the Year Full Stack Verification | **25 / 25 PASS** |
| `spark verify:awards-phase-9`  | Student Leader of the Year Full Stack Verification | **23 / 23 PASS** |
| `spark verify:awards-phase-8`  | Socio-Cultural Male Award Full Stack Verification | **23 / 23 PASS** |
| `spark verify:awards-phase-7`  | Socio-Cultural Female Award Full Stack Verification | **22 / 22 PASS** |
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
| `npm run build`                | Production Bundle Build | **Built in 3.10s** |

---

## 6. Final Phase 12 Gate Declaration

```text
========================================================================
AWARD 12: PASS — OUTSTANDING ATHLETE OF THE YEAR - FEMALE SOURCE-FIDELITY VERIFIED
PHASE 12: PASS — OUTSTANDING ATHLETE OF THE YEAR - FEMALE VERIFIED AND FROZEN
========================================================================
```
