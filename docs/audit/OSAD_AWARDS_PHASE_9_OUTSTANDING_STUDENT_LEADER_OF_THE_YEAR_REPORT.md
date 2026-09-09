# OSAD Awards & Scoring Criteria — Phase 9 Outstanding Student Leader of the Year Report

> **Executive Scope:** Execution of **Phase 9: Outstanding Student Leader of the Year Full Source-Fidelity Remediation** under the Award-by-Award Source-Fidelity Remediation program. Verified the exact 100-point official rubric, 50-point computable model, leadership involvement accumulation (SSG=12, Collegiate=8, Club=6, Year Level=4, cap 30), leadership awards/citations/seminars (Int/Nat=4, Local=2, Citation=2, Seminar=2, cap 10), community involvement buckets (School=4, Community=3, Church=3, cap 10), annual award-cycle eligibility, dual-80% rule separation, candidate discovery vs official nomination separation, cumulative regression across Awards 01–08, and full regression parity.

---

## 1. Executive Summary & Objective

Phase 9 completes the Outstanding Student Leader of the Year Award vertically across all layers of the system while maintaining the frozen Phase 1–8 baselines:
1. **Exact Award Identity**: Master Name `Outstanding Student Leader of the Year`, Code `STUDENT_LEADER_OF_THE_YEAR`, `authority_status = 'OFFICIAL'`, `source_fidelity_status = 'VERIFIED'`. (Strictly separated from the graduating-only Phase 3 `Leadership Award` `LEADERSHIP_AWARD`).
2. **Official Evaluation Basis (100.00 pts)**:
   - Scholastic Achievement (15.00 pts) $\rightarrow$ Non-computable institutional requirement (`OFFICIAL`).
   - Leadership: On and Off Campus (40.00 pts) $\rightarrow$ Computable (`OFFICIAL`).
   - Community Involvement (10.00 pts) $\rightarrow$ Computable (`OFFICIAL`).
   - Character (20.00 pts) $\rightarrow$ Non-computable human evaluation (`OFFICIAL`).
   - Interview (15.00 pts) $\rightarrow$ Non-computable panel evaluation (`OFFICIAL`).
   - **Official Total**: Exactly 100.00 points.
   - **Portfolio-Computable Maximum**: Exactly 50.00 points ($40 + 10$).
   - **Non-Computable**: Exactly 50.00 points ($15 + 20 + 15$).
3. **Criterion Components & Scoring Engine (50.00 pts Computable)**:
   - **Component A1 (Leadership Involvement, 30 pts max)**:
     - Distinct verified roles accumulate (SSG/University-wide = 12, Collegiate Council = 8, Club/Org = 6, Year Level = 4), capped at 30. (*Not highest_only*).
   - **Component A2 (Leadership Awards, Citations, and Seminars, 10 pts max)**:
     - International/National Award = 4, Local Award = 2, Citation = 2, Seminar/Training = 2, capped at 10.
   - **Component B (Community Involvement Buckets, 10 pts max)**:
     - School/University-Based = 4, Community-Based = 3, Church-Based = 3 (presence-based fixed buckets), capped at 10.
4. **Candidate Generation & Eligibility**:
   - Automated candidate-generation threshold: **`80.00% Potential Score`** (Raw 40/50).
   - `graduating_only = 0` (Annual Award Cycle), `gender_restriction = NULL`.
5. **Dual-80% & Nomination Separation**:
   - Official 80% full-rubric requirement + interview kept strictly separate from the automated 80% portfolio candidate discovery threshold.
   - Automated portfolio discovery produces Potential Candidates; official single-nominee selection per college remains an institutional workflow.
6. **Cumulative Progress**:
   - Active catalog exposes **`9 Verified / 15 Authoritative Baseline`** (Awards 01–09 all `VERIFIED`).
   - Awards 01–08 Baselines retain 100% regression invariance without drift.

---

## 2. Student Leader of the Year Specification Matrix

| Metric / Dimension | Specification Value | Database Status |
|---|---|:---:|
| **Award Master Name** | `Outstanding Student Leader of the Year` | **VERIFIED** |
| **Award Code** | `STUDENT_LEADER_OF_THE_YEAR` | **VERIFIED** |
| **Primary Key** | `50000001-0000-0000-0000-000000000028` | **VERIFIED** |
| **Authority Status** | `OFFICIAL` | **VERIFIED** |
| **Source Fidelity Status** | `VERIFIED` | **VERIFIED** |
| **Catalog Visibility** | `1` (Visible) | **VERIFIED** |
| **Graduating Students Only** | `0` (Annual Award) | **VERIFIED** |
| **Gender Restriction** | `NULL` (No restriction) | **VERIFIED** |
| **Official Rubric Total** | `100.00 Points` | **VERIFIED** |
| **Max Computable Portfolio Score** | `50.00 Points` | **VERIFIED** |
| **Automated Candidate Threshold** | `80.00% Potential Score` (40/50) | **VERIFIED** |
| **Phase 3 Separation** | Distinct from `LEADERSHIP_AWARD` (Graduating) | **PRESERVED** |

---

## 3. Official Criteria & Component Architecture

### Official Criteria Breakdown (100.00 pts)
1. `CRIT_LEADER_YR_SCHOLASTIC`: **Scholastic Achievement** — 15.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)
2. `CRIT_LEADER_YR_LEADERSHIP`: **Leadership: On and Off Campus** — 40.00 Max Pts (`is_portfolio_computable = 1`, `OFFICIAL`)
3. `CRIT_LEADER_YR_COMMUNITY`: **Community Involvement** — 10.00 Max Pts (`is_portfolio_computable = 1`, `OFFICIAL`)
4. `CRIT_LEADER_YR_CHARACTER`: **Character** — 20.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)
5. `CRIT_LEADER_YR_INTERVIEW`: **Interview** — 15.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)

### Criterion Components Breakdown (50.00 pts Computable)
- `COMP_LEADER_YR_INVOLVEMENT` (30.00 pts, accumulative): SSG=12, Collegiate=8, Club=6, Year Level=4.
- `COMP_LEADER_YR_AWARDS_SEMINARS` (10.00 pts, sum_capped): Int/Nat Award=4, Local Award=2, Citation=2, Seminar=2.
- `COMP_LEADER_YR_COMMUNITY` (10.00 pts, presence buckets): School/Univ=4, Community=3, Church=3.

---

## 4. Verification Evidence & Test Output

```text
========================================================================
AchieveNest — Phase 9: Student Leader of the Year Full Stack Verification
========================================================================
  LEADER-YR-IDENT-001 Exact Name "Outstanding Student Leader of the Year" [PASS]
  LEADER-YR-IDENT-002 Authority OFFICIAL, Status active, Source Fidelity VERIFIED [PASS]
  LEADER-YR-IDENT-003 Annual cycle (graduating_only = 0) & no gender restriction [PASS]
  LEADER-YR-IDENT-004 Candidate threshold is exactly 80.00%           [PASS]
  LEADER-YR-OFFIC-001 Exact 5 Official Criteria present in Student Leader Award [PASS]
  LEADER-YR-OFFIC-002 Official Rubric Total sums to exactly 100.00 points [PASS]
  LEADER-YR-COMP-001 Computable Criteria max points sum to exactly 50.00 points [PASS]
  LEADER-YR-COMP-002 Scholastic (15), Character (20), Interview (15) isolated as non-computable [PASS]
  LEADER-YR-A1-001   Component A1 configured as leadership accumulation (SSG=12, max 30.00) [PASS]
  LEADER-YR-A2-001   Component A2 configured as honors & seminars matrix (Int/Nat=4, max 10.00) [PASS]
  LEADER-YR-B-001    Component B configured as community presence buckets (School=4, max 10.00) [PASS]
  LEADER-YR-MAP-001  Exact 4 Evidence Mapping Rules active for Student Leader [PASS]
  LEADER-YR-SUMM-001 Evaluation Summary snapshot produced with complete totals [PASS]
  LEADER-YR-SUMM-002 Evaluation Summary exposes 50.00 computable max & 100.00 official max [PASS]
  CUMUL-001          Active catalog exposes exactly 9 Verified / 15 Authoritative Baseline [PASS]
  NDA-REGR-001       Notre Dame Award preserved: 100 official / 50 computable / VERIFIED [PASS]
  SMC-REGR-001       SMC Award preserved: 100 official / 60 computable / VERIFIED [PASS]
  LEAD-REGR-001      Leadership Award preserved: 100 official / 50 computable / VERIFIED (distinct from Student Leader of the Year) [PASS]
  JOURN-REGR-001     Campus Journalism preserved: 100 official / 70 computable / VERIFIED [PASS]
  SPORTS-F-REGR-001  Sports Female preserved: 100 official / 55 computable / female / VERIFIED [PASS]
  SPORTS-M-REGR-001  Sports Male preserved: 100 official / 55 computable / male / VERIFIED [PASS]
  SOCIO-F-REGR-001   Socio-Cultural Female preserved: PROPOSED / 55 computable / female / VERIFIED [PASS]
  SOCIO-M-REGR-001   Socio-Cultural Male preserved: PROPOSED / 55 computable / male / VERIFIED [PASS]
========================================================================
Phase 9 Verification Summary: 23 Passed, 0 Failed
========================================================================
```

---

## 5. Cumulative Master Regression Summary

| Suite Name | Target Domain | Result |
|---|---|:---:|
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
| `npm run build`                | Production Bundle Build | **Built in 2.59s** |

---

## 6. Final Phase 9 Gate Declaration

```text
========================================================================
AWARD 09: PASS — OUTSTANDING STUDENT LEADER OF THE YEAR SOURCE-FIDELITY VERIFIED
PHASE 9: PASS — OUTSTANDING STUDENT LEADER OF THE YEAR VERIFIED AND FROZEN
========================================================================
```
