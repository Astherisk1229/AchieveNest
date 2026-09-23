# Phase 5 — Validation Test Report
## Test Case Execution and Verification Results (TC-5.1 through TC-5.20)

**Domain:** Candidate Generation & Deliberation UI  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Execution Timestamp:** 2026-08-31 22:50:00 UTC+08:00  
**Overall Status:** **20 / 20 PASSED (100%)**  

---

## 1. Phase 5 Test Matrix Summary

| Test ID | Test Scenario | Action & Input Fixture | Expected UI / API Result | Result |
|---|---|---|---|:---:|
| **TC-5.1** | Exact Threshold Candidate | Student with 56/70 (80.00%). | Appears in candidate list as `Potential Candidate`. | **PASS** |
| **TC-5.2** | Below Threshold Student | Student with 55/70 (78.57%). | Filtered out; does not appear in candidate list. | **PASS** |
| **TC-5.3** | More Than Five Candidates | 14 qualifying students. | All 14 returned. No Top-5 or Top-10 truncation. | **PASS** |
| **TC-5.4** | Default Candidate Sort | Multiple candidates with varying scores. | Sorted by `potential_score` DESC, `raw_score` DESC. | **PASS** |
| **TC-5.5** | View Scoring Basis Action | Click action on candidate with 62/70. | Opens scoring modal showing 54/60 pub, 8/10 lead, 88.57%. | **PASS** |
| **TC-5.6** | News Cap Breakdown | 7 qualifying News items. | Accordion shows 7 qualifying, 5 counted, 2 cap-reached, 10/10. | **PASS** |
| **TC-5.7** | Seminar Supporting Only | Journalism seminar present. | Visible with label `Supporting Evidence Only` and 0.0 pts. | **PASS** |
| **TC-5.8** | Moral Character Display | Moral Character row inspected. | Displays `20 pts — Not automatically scored`. Never `0/20`. | **PASS** |
| **TC-5.9** | Panel Interview Display | Panel Interview row inspected. | Displays `10 pts — Not automatically scored`. Never `0/10`. | **PASS** |
| **TC-5.10** | Search by Student Name | Filter input = "Santos". | Candidate list filters to matching students. Scores unchanged. | **PASS** |
| **TC-5.11** | Filter by Program | Filter dropdown = "BSIT". | Only BSIT candidates displayed without recalculation. | **PASS** |
| **TC-5.12** | Potential Score Filter | Filter range = `85% - 100%`. | Display filtered to high-scoring candidates. | **PASS** |
| **TC-5.13** | Pagination Scaling | 83 potential candidates. | All 83 accessible across paginated pages (25/page). | **PASS** |
| **TC-5.14** | Empty Candidate Set | 0 students reach 80% threshold. | Friendly empty state displayed ("No potential candidates"). | **PASS** |
| **TC-5.15** | Backend Failure State | API returns HTTP 500. | Error banner shown; no false zero-score candidate generation. | **PASS** |
| **TC-5.16** | Explainability Arithmetic | Modal components summed. | Hierarchical sums match backend DTO exactly. | **PASS** |
| **TC-5.17** | Mobile Responsive Layout | Viewport width = 375px. | Candidate details and action buttons remain accessible. | **PASS** |
| **TC-5.18** | Keyboard Navigable Accordion | Tab + Enter / Space on accordion. | Sections expand/collapse with keyboard focus. | **PASS** |
| **TC-5.19** | Status Wording Standards | Status tags inspected. | Labeled `Potential Candidate (Portfolio-Based)`. | **PASS** |
| **TC-5.20** | Refresh Consistency | Detail view refreshed. | Same Phase 4 scoring basis reloaded deterministically. | **PASS** |

---

## 2. Test Execution Output

```text
========================================================================
AchieveNest — Phase 5: Candidate Generation & Deliberation UI Output
========================================================================
  TC-5.1   Exact Threshold Candidate Discovery (56/70)            [PASS]
  TC-5.2   Below Threshold Student Exclusion (55/70)               [PASS]
  TC-5.3   No Top-N Truncation (All 14 Candidates Discoverable)   [PASS]
  TC-5.4   Deterministic Default Sort Order                        [PASS]
  TC-5.5   View Scoring Basis Modal Navigation                     [PASS]
  TC-5.6   News Cap Breakdown and Cap-Reached Record Display       [PASS]
  TC-5.7   Seminar Supporting-Only Evidence Display                [PASS]
  TC-5.8   Moral Character Non-Computable Criteria Isolation       [PASS]
  TC-5.9   Panel Interview Non-Computable Criteria Isolation       [PASS]
  TC-5.10  Student Name Search Filtering                           [PASS]
  TC-5.11  Academic Program Filtering                              [PASS]
  TC-5.12  Score Range Filtering                                   [PASS]
  TC-5.13  Candidate Pagination Scaling Verification               [PASS]
  TC-5.14  Empty Candidate Set Friendly State                      [PASS]
  TC-5.15  Backend Error State Isolation                           [PASS]
  TC-5.16  UI Hierarchical Explainability Arithmetic Match         [PASS]
  TC-5.17  Mobile Responsive Layout & Viewport Verification        [PASS]
  TC-5.18  Accessible Keyboard Navigation & ARIA Focus             [PASS]
  TC-5.19  Portfolio-Based Potential Candidate Status Wording     [PASS]
  TC-5.20  Deterministic Refresh State Consistency                 [PASS]
========================================================================
Phase 5 Verification Summary: 20 Passed, 0 Failed (100% PASS)
========================================================================
```
