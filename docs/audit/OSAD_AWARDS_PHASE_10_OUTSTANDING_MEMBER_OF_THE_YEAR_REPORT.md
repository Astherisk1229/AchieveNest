# OSAD Awards & Scoring Criteria — Phase 10 Outstanding Member of the Year Report

> **Executive Scope:** Execution of **Phase 10: Outstanding Member of the Year Full Source-Fidelity Remediation** under the Award-by-Award Source-Fidelity Remediation program. Verified the exact 100-point official rubric, 40-point computable model, membership involvement scoring (activity=2, outreach=3, co-curricular=3, committee=4, sustained=5, cap 20), important contribution scoring (support=2, committee responsibility=3, organizer=4, major project=5, cap 10), leadership involvement (SSG/Collegiate=3, Club=2, cap 5), leadership awards/citations (Int/Nat=3, Local=2, cap 5, no seminar points), annual award-cycle eligibility, exclusion of interpersonal peer relationships from auto-scoring, potential-candidate discovery vs official nomination separation, cumulative regression across Awards 01–09, and full regression parity.

---

## 1. Executive Summary & Objective

Phase 10 completes the Outstanding Member of the Year Award vertically across all layers of the system while maintaining the frozen Phase 1–9 baselines:
1. **Exact Award Identity**: Master Name `Outstanding Member of the Year`, Code `MEMBER_OF_THE_YEAR`, `authority_status = 'OFFICIAL'`, `source_fidelity_status = 'VERIFIED'`.
2. **Official Evaluation Basis (100.00 pts)**:
   - Scholastic Achievement (15.00 pts) $\rightarrow$ Non-computable institutional requirement (`OFFICIAL`).
   - Quality of Membership Involvement (40.00 pts official weight):
     - Operationalized Computable Portion: **30.00 pts** (Membership Involvement 20.00 + Important Contribution 10.00).
     - Non-computable Portion: **10.00 pts** (Interpersonal Relationship with Peers $\rightarrow$ Non-computable human evaluation).
   - Leadership (10.00 pts) $\rightarrow$ Computable (Involvement 5.00 + Awards/Citations 5.00).
   - Character (20.00 pts) $\rightarrow$ Non-computable human evaluation (`OFFICIAL`).
   - Interview (15.00 pts) $\rightarrow$ Non-computable panel evaluation (`OFFICIAL`).
   - **Official Total**: Exactly 100.00 points.
   - **Portfolio-Computable Maximum**: Exactly 40.00 points ($30 + 10$).
   - **Non-Computable**: Exactly 60.00 points ($15 + 10 + 20 + 15$).
3. **Criterion Components & Scoring Engine (40.00 pts Computable)**:
   - **Component A (Membership Involvement and Participation, 20 pts max)**:
     - Activity/program = 2, outreach/extension = 3, co-curricular = 3, committee involvement = 4, sustained participation = 5, capped at 20.
   - **Component B (Important Contribution to the Organization, 10 pts max)**:
     - Contributor/support role = 2, committee responsibility = 3, facilitator/organizer = 4, major project responsibility = 5, capped at 10.
   - **Component C1 (Leadership Involvement, 5 pts max)**:
     - SSG/Collegiate Council = 3, Club/Org = 2, capped at 5.
   - **Component C2 (Leadership Awards & Citations, 5 pts max)**:
     - International/National Award = 3, Local Award/Citation = 2, capped at 5. *(No invented seminar points in C2)*.
4. **Candidate Generation & Eligibility**:
   - Automated candidate-generation threshold: **`80.00% Potential Score`** (Raw 32/40).
   - `graduating_only = 0` (Annual Award Cycle), `gender_restriction = NULL`.
5. **Dual-80% & Nomination Separation**:
   - Official 80% full-rubric requirement + interview kept strictly separate from the automated 80% portfolio candidate discovery threshold.
   - Automated portfolio discovery produces Potential Candidates; official single-nominee selection per college remains an institutional workflow.
6. **Cumulative Progress**:
   - Active catalog exposes **`10 Verified / 15 Authoritative Baseline`** (Awards 01–10 all `VERIFIED`).
   - Awards 01–09 Baselines retain 100% regression invariance without drift.

---

## 2. Member of the Year Specification Matrix

| Metric / Dimension | Specification Value | Database Status |
|---|---|:---:|
| **Award Master Name** | `Outstanding Member of the Year` | **VERIFIED** |
| **Award Code** | `MEMBER_OF_THE_YEAR` | **VERIFIED** |
| **Primary Key** | `50000001-0000-0000-0000-000000000029` | **VERIFIED** |
| **Authority Status** | `OFFICIAL` | **VERIFIED** |
| **Source Fidelity Status** | `VERIFIED` | **VERIFIED** |
| **Catalog Visibility** | `1` (Visible) | **VERIFIED** |
| **Graduating Students Only** | `0` (Annual Award) | **VERIFIED** |
| **Gender Restriction** | `NULL` (No restriction) | **VERIFIED** |
| **Official Rubric Total** | `100.00 Points` | **VERIFIED** |
| **Max Computable Portfolio Score** | `40.00 Points` | **VERIFIED** |
| **Automated Candidate Threshold** | `80.00% Potential Score` (32/40) | **VERIFIED** |
| **Interpersonal Relationship Auto-Score** | `Excluded (Not Auto-Scored)` | **VERIFIED** |

---

## 3. Official Criteria & Component Architecture

### Official Criteria Breakdown (100.00 pts)
1. `CRIT_MEMBER_YR_SCHOLASTIC`: **Scholastic Achievement** — 15.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)
2. `CRIT_MEMBER_YR_MEMBERSHIP_QUALITY`: **Quality of Membership Involvement** — 40.00 Weight / 30.00 Computable Max Pts (`is_portfolio_computable = 1`, `OFFICIAL`)
3. `CRIT_MEMBER_YR_LEADERSHIP`: **Leadership** — 10.00 Max Pts (`is_portfolio_computable = 1`, `OFFICIAL`)
4. `CRIT_MEMBER_YR_CHARACTER`: **Character** — 20.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)
5. `CRIT_MEMBER_YR_INTERVIEW`: **Interview** — 15.00 Max Pts (`is_portfolio_computable = 0`, `OFFICIAL`)

### Criterion Components Breakdown (40.00 pts Computable)
- `COMP_MEMBER_YR_INVOLVEMENT` (20.00 pts, sum_capped): activity=2, outreach=3, co-curricular=3, committee=4, sustained=5.
- `COMP_MEMBER_YR_CONTRIBUTION` (10.00 pts, sum_capped): support=2, committee responsibility=3, organizer=4, major project=5.
- `COMP_MEMBER_YR_LEAD_INVOLVEMENT` (5.00 pts, sum_capped): SSG/Collegiate=3, Club/Org=2.
- `COMP_MEMBER_YR_LEAD_AWARDS` (5.00 pts, sum_capped): Int/Nat Award=3, Local Award/Citation=2.

---

## 4. Verification Evidence & Test Output

```text
========================================================================
AchieveNest — Phase 10: Member of the Year Full Stack Verification
========================================================================
  MEMBER-YR-IDENT-001 Exact Name "Outstanding Member of the Year"     [PASS]
  MEMBER-YR-IDENT-002 Authority OFFICIAL, Status active, Source Fidelity VERIFIED [PASS]
  MEMBER-YR-IDENT-003 Annual cycle (graduating_only = 0) & no gender restriction [PASS]
  MEMBER-YR-IDENT-004 Candidate threshold is exactly 80.00%           [PASS]
  MEMBER-YR-OFFIC-001 Exact 5 Official Criteria present in Member Award [PASS]
  MEMBER-YR-OFFIC-002 Official Rubric Total sums to exactly 100.00 points [PASS]
  MEMBER-YR-COMP-001 Computable Criteria max points sum to exactly 40.00 points [PASS]
  MEMBER-YR-COMP-002 Scholastic (15), Character (20), Interview (15) isolated as non-computable [PASS]
  MEMBER-YR-A-001    Component A configured as involvement sum_capped (activity=2, max 20.00) [PASS]
  MEMBER-YR-B-001    Component B configured as contribution responsibility (support=2, max 10.00) [PASS]
  MEMBER-YR-C1-001   Component C1 configured as leadership involvement (SSG=3, max 5.00) [PASS]
  MEMBER-YR-C2-001   Component C2 configured as honors/citations (Int/Nat=3, no seminar, max 5.00) [PASS]
  MEMBER-YR-MAP-001  Exact 4 Evidence Mapping Rules active for Member Award [PASS]
  MEMBER-YR-SUMM-001 Evaluation Summary snapshot produced with complete totals [PASS]
  MEMBER-YR-SUMM-002 Evaluation Summary exposes 40.00 computable max & 100.00 official max [PASS]
  CUMUL-001          Active catalog exposes exactly 10 Verified / 15 Authoritative Baseline [PASS]
  NDA-REGR-001       Notre Dame Award preserved: 100 official / 50 computable / VERIFIED [PASS]
  SMC-REGR-001       SMC Award preserved: 100 official / 60 computable / VERIFIED [PASS]
  LEAD-REGR-001      Leadership Award preserved: 100 official / 50 computable / VERIFIED [PASS]
  JOURN-REGR-001     Campus Journalism preserved: 100 official / 70 computable / VERIFIED [PASS]
  SPORTS-F-REGR-001  Sports Female preserved: 100 official / 55 computable / female / VERIFIED [PASS]
  SPORTS-M-REGR-001  Sports Male preserved: 100 official / 55 computable / male / VERIFIED [PASS]
  SOCIO-F-REGR-001   Socio-Cultural Female preserved: PROPOSED / 55 computable / female / VERIFIED [PASS]
  SOCIO-M-REGR-001   Socio-Cultural Male preserved: PROPOSED / 55 computable / male / VERIFIED [PASS]
  LEADER-YR-REGR-001 Student Leader of the Year preserved: 100 official / 50 computable / Annual / VERIFIED [PASS]
========================================================================
Phase 10 Verification Summary: 25 Passed, 0 Failed
========================================================================
```

---

## 5. Cumulative Master Regression Summary

| Suite Name | Target Domain | Result |
|---|---|:---:|
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
| `npm run build`                | Production Bundle Build | **Built in 2.22s** |

---

## 6. Final Phase 10 Gate Declaration

```text
========================================================================
AWARD 10: PASS — OUTSTANDING MEMBER OF THE YEAR SOURCE-FIDELITY VERIFIED
PHASE 10: PASS — OUTSTANDING MEMBER OF THE YEAR VERIFIED AND FROZEN
========================================================================
```
