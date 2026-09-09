# OSAD Awards & Scoring Criteria — Phase 11 Outstanding Volunteer of the Year Report

> **Executive Scope:** Execution of **Phase 11: Outstanding Volunteer of the Year Full Source-Fidelity Remediation** under the Award-by-Award Source-Fidelity Remediation program. Verified the exact 100-point official rubric, 50-point computable model, church involvement scoring (School=5, Community=5, Church=5, cap 15), initiated church activities scoring (School=5, Community=5, Church=5, cap 15 with active-role requirement), citations scoring (2.0 each, cap 10), leadership involvement (SSG/Collegiate=3, Club=2, cap 5), leadership awards/citations (Int/Nat=3, Local=2, cap 5, no invented seminar points), annual award-cycle eligibility, potential-candidate discovery vs official nomination separation, cumulative regression across Awards 01–10, and full regression parity.

---

## 1. Executive Summary & Objective

Phase 11 completes the Outstanding Volunteer of the Year Award vertically across all layers of the system while maintaining the frozen Phase 1–10 baselines:
1. **Exact Award Identity**: Master Name `Outstanding Volunteer of the Year`, Code `VOLUNTEER_OF_THE_YEAR`, `authority_status = 'OFFICIAL'`, `source_fidelity_status = 'VERIFIED'`.
2. **Official Evaluation Basis (100.00 pts)**:
   - Scholastic Achievement (15.00 pts) $\rightarrow$ Non-computable institutional requirement (`OFFICIAL`).
   - Volunteerism: On and Off Campus (40.00 pts) $\rightarrow$ Computable (`OFFICIAL`).
   - Leadership (10.00 pts) $\rightarrow$ Computable (`OFFICIAL`).
   - Character (20.00 pts) $\rightarrow$ Non-computable human evaluation (`OFFICIAL`).
   - Interview (15.00 pts) $\rightarrow$ Non-computable panel evaluation (`OFFICIAL`).
   - **Official Total**: Exactly 100.00 points.
   - **Portfolio-Computable Maximum**: Exactly 50.00 points ($40 + 10$).
   - **Non-Computable**: Exactly 50.00 points ($15 + 20 + 15$).
3. **Criterion Components & Scoring Engine (50.00 pts Computable)**:
   - **Component A1 (Church Involvement - Ministries / Organizations, 15 pts max)**:
     - School-Based = 5, Community-Based = 5, Church-Based = 5 (presence-based fixed buckets), capped at 15.
   - **Component A2 (Initiated Church-Related Activities, 15 pts max)**:
     - School-Based = 5, Community-Based = 5, Church-Based = 5 (active-role presence buckets), capped at 15.
   - **Component A3 (Citations Received, 10 pts max)**:
     - 2.0 pts per qualified volunteerism/community citation, capped at 10.
   - **Component B1 (Leadership Involvement, 5 pts max)**:
     - SSG/Collegiate Council = 3, Club = 2, capped at 5.
   - **Component B2 (Leadership Awards & Citations, 5 pts max)**:
     - International/National Award = 3, Local Award/Citation = 2, capped at 5 *(no invented seminar points in B2)*.
4. **Candidate Generation & Eligibility**:
   - Automated candidate-generation threshold: **`80.00% Potential Score`** (Raw 40/50).
   - `graduating_only = 0` (Annual Award Cycle), `gender_restriction = NULL`.
5. **Dual-80% & Nomination Separation**:
   - Official 80% full-rubric requirement + interview kept strictly separate from the automated 80% portfolio candidate discovery threshold.
   - Automated portfolio discovery produces Potential Candidates; official single-nominee selection per college remains an institutional workflow.
6. **Cumulative Progress**:
   - Active catalog exposes **`11 Verified / 15 Authoritative Baseline`** (Awards 01–11 all `VERIFIED`).
   - Awards 01–10 Baselines retain 100% regression invariance without drift.

---

## 2. Volunteer of the Year Specification Matrix

| Metric / Dimension | Specification Value | Database Status |
|---|---|:---:|
| **Award Master Name** | `Outstanding Volunteer of the Year` | **VERIFIED** |
| **Award Code** | `VOLUNTEER_OF_THE_YEAR` | **VERIFIED** |
| **Primary Key** | `50000001-0000-0000-0000-000000000030` | **VERIFIED** |
| **Authority Status** | `OFFICIAL` | **VERIFIED** |
| **Source Fidelity Status** | `VERIFIED` | **VERIFIED** |
| **Catalog Visibility** | `1` (Visible) | **VERIFIED** |
| **Graduating Students Only** | `0` (Annual Award) | **VERIFIED** |
| **Gender Restriction** | `NULL` (No restriction) | **VERIFIED** |
| **Official Rubric Total** | `100.00 Points` | **VERIFIED** |
| **Max Computable Portfolio Score** | `50.00 Points` | **VERIFIED** |
| **Automated Candidate Threshold** | `80.00% Potential Score` (40/50) | **VERIFIED** |
| **No-Invented-Seminar Invariant** | `Enforced (No invented points in B2)` | **VERIFIED** |

---

## 3. Official Criteria & Component Architecture

### Official Criteria Breakdown (100.00 pts)
1. `CRIT_VOLUNTEER_YR_SCHOLASTIC`: **Scholastic Achievement** — 15.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)
2. `CRIT_VOLUNTEER_YR_VOLUNTEERISM`: **Volunteerism: On and Off Campus** — 40.00 Max Pts (`is_portfolio_computable = 1`, `OFFICIAL`)
3. `CRIT_VOLUNTEER_YR_LEADERSHIP`: **Leadership** — 10.00 Max Pts (`is_portfolio_computable = 1`, `OFFICIAL`)
4. `CRIT_VOLUNTEER_YR_CHARACTER`: **Character** — 20.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)
5. `CRIT_VOLUNTEER_YR_INTERVIEW`: **Interview** — 15.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)

### Criterion Components Breakdown (50.00 pts Computable)
- `COMP_VOLUNTEER_YR_CHURCH_INVOLVEMENT` (15.00 pts, presence buckets): School=5, Community=5, Church=5.
- `COMP_VOLUNTEER_YR_INITIATED_ACTIVITIES` (15.00 pts, active-role presence buckets): School=5, Community=5, Church=5.
- `COMP_VOLUNTEER_YR_CITATIONS` (10.00 pts, sum_capped): 2.0 pts per qualified citation.
- `COMP_VOLUNTEER_YR_LEAD_INVOLVEMENT` (5.00 pts, sum_capped): SSG/Collegiate=3, Club=2.
- `COMP_VOLUNTEER_YR_LEAD_AWARDS` (5.00 pts, sum_capped): Int/Nat Award=3, Local Award/Citation=2.

---

## 4. Verification Evidence & Test Output

```text
========================================================================
AchieveNest — Phase 11: Volunteer of the Year Full Stack Verification
========================================================================
  VOLUNTEER-YR-IDENT-001 Exact Name "Outstanding Volunteer of the Year"  [PASS]
  VOLUNTEER-YR-IDENT-002 Authority OFFICIAL, Status active, Source Fidelity VERIFIED [PASS]
  VOLUNTEER-YR-IDENT-003 Annual cycle (graduating_only = 0) & no gender restriction [PASS]
  VOLUNTEER-YR-IDENT-004 Candidate threshold is exactly 80.00%           [PASS]
  VOLUNTEER-YR-OFFIC-001 Exact 5 Official Criteria present in Volunteer Award [PASS]
  VOLUNTEER-YR-OFFIC-002 Official Rubric Total sums to exactly 100.00 points [PASS]
  VOLUNTEER-YR-COMP-001 Computable Criteria max points sum to exactly 50.00 points [PASS]
  VOLUNTEER-YR-COMP-002 Scholastic (15), Character (20), Interview (15) isolated as non-computable [PASS]
  VOLUNTEER-YR-A1-001 Component A1 configured as presence buckets (School=5, max 15.00) [PASS]
  VOLUNTEER-YR-A2-001 Component A2 configured as initiated activities (School=5, max 15.00) [PASS]
  VOLUNTEER-YR-A3-001 Component A3 configured as volunteerism citations (2.0 each, max 10.00) [PASS]
  VOLUNTEER-YR-B1-001 Component B1 configured as leadership involvement (SSG=3, max 5.00) [PASS]
  VOLUNTEER-YR-B2-001 Component B2 configured as honors/citations (Int/Nat=3, no seminar, max 5.00) [PASS]
  VOLUNTEER-YR-MAP-001 Exact 5 Evidence Mapping Rules active for Volunteer Award [PASS]
  VOLUNTEER-YR-SUMM-001 Evaluation Summary snapshot produced with complete totals [PASS]
  VOLUNTEER-YR-SUMM-002 Evaluation Summary exposes 50.00 computable max & 100.00 official max [PASS]
  CUMUL-001          Active catalog exposes exactly 11 Verified / 15 Authoritative Baseline [PASS]
  NDA-REGR-001       Notre Dame Award preserved: 100 official / 50 computable / VERIFIED [PASS]
  SMC-REGR-001       SMC Award preserved: 100 official / 60 computable / VERIFIED [PASS]
  LEAD-REGR-001      Leadership Award preserved: 100 official / 50 computable / VERIFIED [PASS]
  JOURN-REGR-001     Campus Journalism preserved: 100 official / 70 computable / VERIFIED [PASS]
  SPORTS-F-REGR-001  Sports Female preserved: 100 official / 55 computable / female / VERIFIED [PASS]
  SPORTS-M-REGR-001  Sports Male preserved: 100 official / 55 computable / male / VERIFIED [PASS]
  SOCIO-F-REGR-001   Socio-Cultural Female preserved: PROPOSED / 55 computable / female / VERIFIED [PASS]
  SOCIO-M-REGR-001   Socio-Cultural Male preserved: PROPOSED / 55 computable / male / VERIFIED [PASS]
  LEADER-YR-REGR-001 Student Leader of the Year preserved: 100 official / 50 computable / Annual / VERIFIED [PASS]
  MEMBER-YR-REGR-001 Member of the Year preserved: 100 official / 40 computable / Annual / VERIFIED [PASS]
========================================================================
Phase 11 Verification Summary: 27 Passed, 0 Failed
========================================================================
```

---

## 5. Cumulative Master Regression Summary

| Suite Name | Target Domain | Result |
|---|---|:---:|
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
| `npm run build`                | Production Bundle Build | **Built in 3.13s** |

---

## 6. Final Phase 11 Gate Declaration

```text
========================================================================
AWARD 11: PASS — OUTSTANDING VOLUNTEER OF THE YEAR SOURCE-FIDELITY VERIFIED
PHASE 11: PASS — OUTSTANDING VOLUNTEER OF THE YEAR VERIFIED AND FROZEN
========================================================================
```
