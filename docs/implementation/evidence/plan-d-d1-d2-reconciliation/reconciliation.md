# Verification Evidence Reconciliation Report

**Document type:** Evidence Analysis & Root-Cause Reconciliation  
**Date:** 2026-09-08  
**Scope:** Plan D Phase D2 & Plan D1 Companion Full-Regression Totals  
**Authoritative Evidence Directory:** `docs/implementation/evidence/plan-d-d1-d2-reconciliation/`  

---

## 1. Executive Summary

During the documentation audit for **Plan D Phase D2 (Faculty Status & Master Data)** and the **Plan D1 Companion (Dean Annual Review Input & Portfolio-Validation Eligibility)**, two different full-regression totals were noted in project artifacts:
1. **114 test files / 725 test cases / 0 failures**
2. **115 test files / 738 test cases / 0 failures**

This reconciliation investigation reproduced the complete test suite under controlled, unfiltered conditions, verified the test inventory, and proved the exact cause of the difference.

---

## 2. Comparison & Mathematical Delta Analysis

| Metric | Phase D2 Baseline (Pre-D1) | Phase D1 Companion Addition | Authoritative Master Run |
| --- | :---: | :---: | :---: |
| **Test Files** | 114 | +1 (`DeanAnnualReviewD1Companion.test.js`) | **115** |
| **Test Cases** | 725 | +13 tests | **738** |
| **Passed Tests** | 725 | +13 tests | **738** |
| **Failed Tests** | 0 | 0 | **0** |
| **Skipped Tests** | 0 | 0 | **0** |
| **Pass Rate** | 100.0% | 100.0% | **100.0%** |

### Delta Breakdown
- **Added File:** `src/controllers/__tests__/DeanAnnualReviewD1Companion.test.js`
- **Tests in Added File:** 13
  1. `D1.1`: Records Cleared decision for Academic personnel in Dean college
  2. `D1.2`: Records Not Cleared decision with clear justification reason
  3. `D1.2`: Rejection of `not_cleared` without reason (`422 DECISION_REASON_REQUIRED`)
  4. `D1.2`: Rejection of duplicate review per cycle (`409 ANNUAL_REVIEW_ALREADY_RECORDED`)
  5. `D1.3`: Supersession creates successor and marks historical review superseded
  6. `D1.4`: Permanent Full-Time Faculty with Cleared decision is ranking-ready
  7. `D1.4`: Probationary Full-Time Faculty with Cleared decision is ranking-ready
  8. `D1.4`: Part-Time Faculty blocked from ranking readiness (`PART_TIME_FACULTY`)
  9. `D1.4`: Non-Teaching Faculty + Academic flags `UNSUPPORTED_PERSONNEL_GROUP_FOR_RANKING`
  10. `D1.4`: Missing annual review returns `ANNUAL_REVIEW_PENDING`
  11. `D1.4`: Existing Plan C evaluation root blocks ranking (`EVALUATION_ALREADY_EXISTS_FOR_CYCLE`)
  12. `D1.5`: HR Admin read-only diagnostic access
  13. `D1.6`: Dean queue workspace data fetching with filters

---

## 3. Verified Cause of Discrepancy

1. **Chronological Addition of Plan D1 Companion**:
   - The test run conducted immediately upon completing **Plan D Phase D2** executed before `DeanAnnualReviewD1Companion.test.js` was written. That run produced **114 test files / 725 tests**.
   - When the **Plan D1 Companion** specification was executed, `DeanAnnualReviewD1Companion.test.js` (1 file, 13 test cases) was created.
   - The full test suite was then rerun, yielding **115 test files / 738 tests**.
2. **Artifact Walkthrough Update Sequence**:
   - The walkthrough document's detailed verification section was updated to record the new D1 companion run (`115 / 738`), but the historical D2 bullet in the preceding section retained the pre-D1 baseline (`114 / 725`).
3. **Conclusion**:
   - Neither number was fabricated or erroneous; they represented two distinct, valid sequential milestones.
   - **115 test files / 738 tests / 0 failures** is the sole, authoritative, all-inclusive count for the fully implemented Plan D track (D0, D1 classification, D2 master data, and D1 companion).

---

## 4. Single Authoritative Baseline for Future Tracks

All downstream tracks (including **Plan F1 — Dynamic Portfolio Format, Categories, Subcategories & Criteria Configuration**) must cite this unified baseline:

```text
Authoritative Full-Suite Run: 115 test files / 738 test cases / 738 passed / 0 failed / 0 skipped.
Timestamp: 2026-09-08 22:28:59 +08:00 (14:28:59 UTC).
Revision: ea987bf32c208cc99ebe1a60b989c0c09ca83e98.
Command: npx vitest run --reporter=verbose --reporter=json --outputFile=test-results.json
Evidence Package: docs/implementation/evidence/plan-d-d1-d2-reconciliation/
```
