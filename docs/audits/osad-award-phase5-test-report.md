# AchieveNest — OSAD Award Evaluation & Portfolio Scoring
# Phase 5: Test Execution Report

> **Document:** `osad-award-phase5-test-report.md`  
> **Phase:** 5 of 8  
> **Date:** September 1, 2026  
> **Test Suite:** `backend/run_phase5_tests.php`  
> **Status:** 100% PASS (15/15 Passed)  

---

## 1. Test Results Summary

| Test ID | Test Description | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| `TC-5.1` | Authoritative 15 awards loaded from DB | 15 active canonical awards | 15 active canonical awards | **PASS** |
| `TC-5.2` | Notre Dame leadership highest-only + awards | Earned = 19.00 pts | 19.00 pts | **PASS** |
| `TC-5.3` | SMC fixed presence B1=15 (no duplicate multiply) | Earned = 25.00 pts | 25.00 pts | **PASS** |
| `TC-5.4` | Leadership Award: Local citation=3, Civic highest=10 | Earned = 23.00 pts | 23.00 pts | **PASS** |
| `TC-5.5` | Campus Journalism: Pub counting + Lead caps | Earned = 18.00 pts | 18.00 pts | **PASS** |
| `TC-5.6` | Sports family: Skills 20 + Part 12 + Awards 10 | Earned = 42.00 pts | 42.00 pts | **PASS** |
| `TC-5.7` | Socio-Cultural: Skills 20 + Part 7 + Awards 7 | Earned = 34.00 pts | 34.00 pts | **PASS** |
| `TC-5.8` | Student Leader: Distinct category accumulation (cap 30) | Earned = 30.00 pts | 30.00 pts | **PASS** |
| `TC-5.9` | Member of the Year: Involvement 5 + Contribution 5 | Earned = 10.00 pts | 10.00 pts | **PASS** |
| `TC-5.10` | Volunteer of the Year: Involvements 15 + Initiated 15 + Citations 4 | Earned = 34.00 pts | 34.00 pts | **PASS** |
| `TC-5.11` | All 30 Sports & Socio-Cultural matrix cells exact lookup | Exact point match for all 30 cells | Exact point match | **PASS** |
| `TC-5.12` | Full evidence traceability linked to master records | Valid trace with record IDs | Valid trace | **PASS** |
| `TC-5.13` | No Potential Candidate status generated | `potential_candidate` unset | `potential_candidate` unset | **PASS** |
| `TC-5.14` | No candidate rank or top-n designation generated | `rank` and `top_candidates` unset | Unset | **PASS** |
| `TC-5.15` | No legacy min_points or weight_multiplier used | Legacy fields unset | Legacy fields unset | **PASS** |

---

## 2. Invariance Verification

- Total Test Cases: 15
- Passed: 15
- Failed: 0
- Success Rate: **100.0%**
