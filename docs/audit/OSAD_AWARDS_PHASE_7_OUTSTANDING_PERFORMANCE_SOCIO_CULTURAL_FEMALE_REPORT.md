# OSAD Awards & Scoring Criteria — Phase 7 Outstanding Performance in Socio-Cultural - Female Report

> **Executive Scope:** Execution of **Phase 7: Outstanding Performance in Socio-Cultural - Female Proposed Model Remediation** under the Award-by-Award Source-Fidelity Remediation program. Verified the exact PROPOSED AchieveNest 55-point computable model, socio-cultural skills presence (individual & group/ensemble), meets/competitions participation matrix, awards/placement matrix with NDEA Silver = 3, female graduating eligibility ($\ge 80.00\%$ potential score), immutable evaluation summary generation, cumulative regression across Awards 01–06, and full regression parity.

---

## 1. Executive Summary & Objective

Phase 7 reconciles and verifies the Outstanding Performance in Socio-Cultural - Female Award strictly as the **PROPOSED** AchieveNest portfolio-based model:
1. **Exact Award Identity**: Master Name `Outstanding Performance in Socio-Cultural - Female`, Code `SOCIO_CULTURAL_AWARD_FEMALE`, `authority_status = 'PROPOSED'`, `source_fidelity_status = 'VERIFIED'`. (Strictly separated from the annual `Outstanding Performer of the Year - Female` in Phase 14 and the Male counterpart in Phase 8).
2. **Authority Lock — PROPOSED, Not OFFICIAL**:
   - The authoritative source explicitly states that no separate official OSAD scoring sheet exists for this specific Award.
   - AchieveNest preserves `authority_status = 'PROPOSED'` and does **NOT** invent a 100-point official rubric or subjective/attitude/interview grading.
   - `PROPOSED + VERIFIED` is proven and frozen.
3. **Proposed Portfolio-Computable Model (55.00 pts Total)**:
   - **Criterion 1: Socio-Cultural Skills Evidence (20.00 pts)**:
     - *Component A1 (Individual Performance, 10 pts)*: 10 pts presence rule.
     - *Component A2 (Group / Ensemble Performance, 10 pts)*: 10 pts presence rule.
   - **Criterion 2: Participation in Socio-Cultural Meets / Competitions (20.00 pts)**:
     - *Component B (Participation in Socio-Cultural Meets, 20 pts)*: PRISAA National=7, Regional=5, Local=2, NDEA=4, University-level/Intramurals=2, cap 20.
   - **Criterion 3: Awards Received (15.00 pts)**:
     - *Component C (Awards Received in Socio-Cultural Events, 15 pts)*:
       - PRISAA Nat'l: Gold=7, Silver=5, Bronze=3
       - PRISAA Reg'l: Gold=5, Silver=3, Bronze=2
       - PRISAA Local: Gold=3, Silver=2, Bronze=1
       - NDEA / Equivalent: Gold=4, **Silver=3** *(Critical source-faithful distinction from sports' 4)*, Bronze=2
       - University-Level: Gold=2, Silver=1, Bronze=1
       - Cap 15.
4. **Candidate Generation & Eligibility**:
   - Automated candidate-generation threshold: **`80.00% Potential Score`** (Raw 44/55).
   - `graduating_only = 1`, `gender_restriction = 'female'`.
5. **Cumulative Progress**:
   - Active catalog exposes **`7 Verified / 15 Authoritative Baseline`** (`Notre Dame Award`, `Saint Marcellin Champagnat (SMC) Award`, `Leadership Award`, `Campus Journalism Award`, `Outstanding Performance in Sports - Female`, `Outstanding Performance in Sports - Male`, `Outstanding Performance in Socio-Cultural - Female` all `VERIFIED`).
   - Awards 01–06 Baselines retain 100% regression invariance without drift.

---

## 2. Socio-Cultural Female Award Specification Matrix

| Metric / Dimension | Specification Value | Database Status |
|---|---|:---:|
| **Award Master Name** | `Outstanding Performance in Socio-Cultural - Female` | **VERIFIED** |
| **Award Code** | `SOCIO_CULTURAL_AWARD_FEMALE` | **VERIFIED** |
| **Primary Key** | `50000001-0000-0000-0000-000000000026` | **VERIFIED** |
| **Authority Status** | `PROPOSED` | **VERIFIED** |
| **Source Fidelity Status** | `VERIFIED` | **VERIFIED** |
| **Catalog Visibility** | `1` (Visible) | **VERIFIED** |
| **Graduating Students Only** | `1` (Yes) | **VERIFIED** |
| **Gender Restriction** | `female` | **VERIFIED** |
| **Official Rubric Total** | `None` (No fake 100-pt rubric) | **VERIFIED** |
| **Max Computable Portfolio Score** | `55.00 Points` | **VERIFIED** |
| **Automated Candidate Threshold** | `80.00% Potential Score` (44/55) | **VERIFIED** |
| **Annual Counterpart Separation** | Distinct from `PERFORMER_OF_THE_YEAR_FEMALE` (Annual) | **PRESERVED** |

---

## 3. Criteria & Component Architecture

### Criteria Breakdown (55.00 pts Proposed Total)
1. `CRIT_SOCIO_F_SKILLS`: **Socio-Cultural Skills Evidence** — 20.00 Max Pts (`is_portfolio_computable = 1`, `PROPOSED`)
2. `CRIT_SOCIO_F_PARTICIPATION`: **Participation in Socio-Cultural Meets / Competitions** — 20.00 Max Pts (`is_portfolio_computable = 1`, `PROPOSED`)
3. `CRIT_SOCIO_F_AWARDS`: **Awards Received** — 15.00 Max Pts (`is_portfolio_computable = 1`, `PROPOSED`)

### Criterion Components Breakdown (55.00 pts Computable)
- `COMP_SOCIO_F_INDIV_SKILLS` (10.00 pts, presence): Verified Individual Performance.
- `COMP_SOCIO_F_GROUP_SKILLS` (10.00 pts, presence): Verified Group/Ensemble Performance.
- `COMP_SOCIO_F_PARTICIPATION` (20.00 pts, meet matrix): Sourced from `Socio-Cultural / Performing Arts` meet participation.
- `COMP_SOCIO_F_AWARDS` (15.00 pts, medal matrix with NDEA Silver = 3): Sourced from `Socio-Cultural / Performing Arts` competition honors.

---

## 4. Verification Evidence & Test Output

```text
========================================================================
AchieveNest — Phase 7: Socio-Cultural Female Award Full Stack Verification
========================================================================
  SOCIO-F-IDENT-001  Exact Name "Outstanding Performance in Socio-Cultural - Female" [PASS]
  SOCIO-F-IDENT-002  Authority PROPOSED, Status active, Source Fidelity VERIFIED [PASS]
  SOCIO-F-IDENT-003  Graduating only & female restriction are active [PASS]
  SOCIO-F-IDENT-004  Candidate threshold is exactly 80.00%           [PASS]
  SOCIO-F-OFFIC-001  Exact 3 Proposed Criteria present in Socio-Cultural Female Award [PASS]
  SOCIO-F-OFFIC-002  Proposed Model Total sums to exactly 55.00 points [PASS]
  SOCIO-F-COMP-001   Computable Criteria max points sum to exactly 55.00 points [PASS]
  SOCIO-F-COMP-002   Zero non-computable criteria (no fake 100 pt official rubric) [PASS]
  SOCIO-F-A1-001     Component A1 rule configured as individual presence (max 10.00) [PASS]
  SOCIO-F-A2-001     Component A2 rule configured as group presence (max 10.00) [PASS]
  SOCIO-F-B-001      Component B rule configured as participation matrix (max 20.00) [PASS]
  SOCIO-F-C-001      Component C rule configured with NDEA Silver = 3 (max 15.00) [PASS]
  SOCIO-F-MAP-001    Exact 4 Evidence Mapping Rules active for Socio-Cultural Female [PASS]
  SOCIO-F-SUMM-001   Evaluation Summary snapshot produced with complete totals [PASS]
  SOCIO-F-SUMM-002   Evaluation Summary exposes 55.00 computable max & PROPOSED authority [PASS]
  CUMUL-001          Active catalog exposes exactly 7 Verified / 15 Authoritative Baseline [PASS]
  NDA-REGR-001       Notre Dame Award preserved: 100 official / 50 computable / VERIFIED [PASS]
  SMC-REGR-001       SMC Award preserved: 100 official / 60 computable / VERIFIED [PASS]
  LEAD-REGR-001      Leadership Award preserved: 100 official / 50 computable / VERIFIED [PASS]
  JOURN-REGR-001     Campus Journalism preserved: 100 official / 70 computable / VERIFIED [PASS]
  SPORTS-F-REGR-001  Sports Female preserved: 100 official / 55 computable / female / VERIFIED [PASS]
  SPORTS-M-REGR-001  Sports Male preserved: 100 official / 55 computable / male / VERIFIED [PASS]
========================================================================
Phase 7 Verification Summary: 22 Passed, 0 Failed
========================================================================
```

---

## 5. Cumulative Master Regression Summary

| Suite Name | Target Domain | Result |
|---|---|:---:|
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
| `npm run build`                | Production Bundle Build | **Built in 2.37s** |

---

## 6. Final Phase 7 Gate Declaration

```text
========================================================================
AWARD 07: PASS — OUTSTANDING PERFORMANCE IN SOCIO-CULTURAL - FEMALE PROPOSED MODEL SOURCE-FIDELITY VERIFIED
PHASE 7: PASS — OUTSTANDING PERFORMANCE IN SOCIO-CULTURAL - FEMALE VERIFIED AND FROZEN AS PROPOSED
========================================================================
```
