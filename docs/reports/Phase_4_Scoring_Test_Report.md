# Phase 4 — Scoring Test Report
## Test Case Execution and Verification Results (TC-4.1 through TC-4.24)

**Domain:** Scoring Engine & Explainability  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Execution Timestamp:** 2026-08-31 22:45:00 UTC+08:00  
**Overall Status:** **24 / 24 PASSED (100%)**  

---

## 1. Phase 4 Test Matrix Summary

| Test ID | Test Scenario | Calculation Formula / Fixture | Expected Score & Result | Result |
|---|---|---|---|:---:|
| **TC-4.1** | Zero Eligible Records | No verified records. | Raw = 0.00 / 70.00, Potential = 0.00%, `BELOW_THRESHOLD`. | **PASS** |
| **TC-4.2** | Five News Items | $5 \times 2\text{ pts}$. | News = 10.00 / 10.00. 5 records counted. | **PASS** |
| **TC-4.3** | Seven News Items | $7 \times 2 = 14\text{ pts}$ uncapped. | News = 10.00 / 10.00. 5 counted, 2 cap-excluded. `cap_applied = true`. | **PASS** |
| **TC-4.4** | Five Literary Pieces | $5 \times 2\text{ pts}$. | Literary = 10.00 / 10.00. 5 counted. | **PASS** |
| **TC-4.5** | Five Columns | $5 \times 4\text{ pts}$. | Column = 20.00 / 20.00. 5 counted. | **PASS** |
| **TC-4.6** | Five Editorials | $5 \times 4\text{ pts}$. | Editorial = 20.00 / 20.00. 5 counted. | **PASS** |
| **TC-4.7** | Publication Maximum | 5 News + 5 Lit + 5 Col + 5 Ed. | Publication = 60.00 / 60.00. | **PASS** |
| **TC-4.8** | Officer + Member Distinct | 1 Officer (3 pts) + 1 Member (2 pts). | Leadership Role = 5.00 / 5.00. | **PASS** |
| **TC-4.9** | Two Distinct Officers | 2 Officer roles in distinct AYs ($3 + 3 = 6$). | Leadership Role = 5.00 / 5.00. Cap applied. | **PASS** |
| **TC-4.10** | Duplicate Leadership Role | 2 Officer roles same AY and outlet. | First counted (3 pts); second excluded (0 pts). Total = 3.00 / 5.00. | **PASS** |
| **TC-4.11** | National + Local Award | 1 National (3 pts) + 1 Local (2 pts). | Awards/Citations = 5.00 / 5.00. | **PASS** |
| **TC-4.12** | Two National Awards | 2 National Awards ($3 + 3 = 6$). | Awards/Citations = 5.00 / 5.00. Cap applied. | **PASS** |
| **TC-4.13** | Seminar Only | 1 Journalism Seminar. | Awards/Citations = 0.00 / 5.00 (`SUPPORTING_ONLY`). | **PASS** |
| **TC-4.14** | Full Leadership Maximum | Role (5 pts) + Recognitions (5 pts). | Leadership = 10.00 / 10.00. | **PASS** |
| **TC-4.15** | Example Scenario 62/70 | Pub = 54.00, Leadership = 8.00. | Raw = 62.00 / 70.00, Potential = 88.57%, `POTENTIAL_CANDIDATE`. | **PASS** |
| **TC-4.16** | Exact Threshold 56/70 | Pub = 48.00, Leadership = 8.00. | Raw = 56.00 / 70.00, Potential = 80.00%, `POTENTIAL_CANDIDATE`. | **PASS** |
| **TC-4.17** | Just Below Threshold 55/70 | Pub = 48.00, Leadership = 7.00. | Raw = 55.00 / 70.00, Potential = 78.57%, `BELOW_THRESHOLD`. | **PASS** |
| **TC-4.18** | Multiple Evidence Files | 1 Editorial + 3 evidence attachments. | Score = 4.00 pts (not 12 pts). Cardinality preserved. | **PASS** |
| **TC-4.19** | Archived Verified Record | Verified record marked archived. | Phase 3 gate excludes record; contributes 0.00 pts. | **PASS** |
| **TC-4.20** | Rejected Record | Record in status rejected. | Contributes 0.00 pts. | **PASS** |
| **TC-4.21** | Cap Explainability Reconciles | 7 News Item records. | 7 qualifying, 5 counted, 2 cap-reached, subtotal = 10.00. | **PASS** |
| **TC-4.22** | Unknown Component Mapping | Corrupted subcategory. | Excluded from calculation without guessing. | **PASS** |
| **TC-4.23** | Deterministic Recalculation | Evaluated twice on same data. | Byte-for-byte identical output. | **PASS** |
| **TC-4.24** | Explainability Arithmetic | $\sum \text{Record Pts} = \text{Comp}$, $\sum \text{Comp} = \text{Crit}$, $\sum \text{Crit} = \text{Raw}$. | Exact mathematical parity verified across all levels. | **PASS** |

---

## 2. Test Execution Output

```text
========================================================================
AchieveNest — Phase 4: Scoring Engine & Explainability Test Output
========================================================================
  TC-4.1   Zero Eligible Records Evaluation                       [PASS]
  TC-4.2   Five News Items (10.00 / 10.00)                        [PASS]
  TC-4.3   Seven News Items (10.00 / 10.00 Capped)                [PASS]
  TC-4.4   Five Literary Works (10.00 / 10.00)                    [PASS]
  TC-4.5   Five Columns (20.00 / 20.00)                           [PASS]
  TC-4.6   Five Editorials (20.00 / 20.00)                        [PASS]
  TC-4.7   Full Publication Maximum (60.00 / 60.00)               [PASS]
  TC-4.8   Officer + Member Distinct Periods (5.00 / 5.00)        [PASS]
  TC-4.9   Two Distinct Officers (5.00 / 5.00 Capped)             [PASS]
  TC-4.10  Duplicate Leadership Role Defense                      [PASS]
  TC-4.11  National + Local Award (5.00 / 5.00)                   [PASS]
  TC-4.12  Two National Awards (5.00 / 5.00 Capped)               [PASS]
  TC-4.13  Seminar Supporting Record (0.00 Points)                [PASS]
  TC-4.14  Full Leadership Maximum (10.00 / 10.00)                [PASS]
  TC-4.15  Example Scenario 62/70 (88.57% Candidate)              [PASS]
  TC-4.16  Exact Boundary Threshold 56/70 (80.00% Candidate)      [PASS]
  TC-4.17  Just Below Threshold 55/70 (78.57% Below Threshold)    [PASS]
  TC-4.18  Multiple Evidence Attachment Cardinality Invariant     [PASS]
  TC-4.19  Archived Lifecycle Ineligibility Exclusion             [PASS]
  TC-4.20  Rejected Verification Status Exclusion                 [PASS]
  TC-4.21  Cap Explainability Reconciliation                      [PASS]
  TC-4.22  Unknown Mapping Defense (No Guessing)                  [PASS]
  TC-4.23  Deterministic Recalculation Parity                     [PASS]
  TC-4.24  Hierarchical Explainability Arithmetic Reconciliation  [PASS]
========================================================================
Phase 4 Verification Summary: 24 Passed, 0 Failed (100% PASS)
========================================================================
```
