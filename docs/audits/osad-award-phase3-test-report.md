# Phase 3 Deliverable: Automated Test Report

**Document Identifier:** `docs/audits/osad-award-phase3-test-report.md`  
**Phase:** 3 of 8 (Eligibility Gate Engine)  
**Authoritative Source:** *AchieveNest — OSAD Award Evaluation & Portfolio Scoring Implementation Plan — COMPLETE*  
**Audit Baseline Commit:** `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`  
**Status:** **100% TEST CASES PASSED**

---

## 1. Executive Summary

This report documents the test results for the **Award-Level Eligibility Gate Engine** implemented in [`AwardEligibilityService.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/AwardEligibilityService.php).

---

## 2. Test Execution Log

```text
========================================================================
AchieveNest — Phase 3: Eligibility Gate Engine Test Suite Execution
========================================================================
  TC-3.1 Exactly 15 active awards in registry                       [PASS]
  TC-3.2 Exactly 8 graduating-only awards metadata validated        [PASS]
  TC-3.3 Exactly 7 open-pool awards metadata validated              [PASS]
  TC-3.4 Graduating student passes Notre Dame Award                 [PASS]
  TC-3.5 Undergrad student fails Notre Dame Award (GRADUATING_REQ)  [PASS]
  TC-3.6 Undergrad student passes Student Leader Award (Open Pool)  [PASS]
  TC-3.7 Female student passes Sports Female Award                  [PASS]
  TC-3.8 Male student fails Sports Female Award (SEX_REQ)           [PASS]
  TC-3.9 Male student passes Sports Male Award                      [PASS]
  TC-3.10 Female student fails Sports Male Award (SEX_REQ)          [PASS]
  TC-3.11 Non-sex-gated award passes both Male and Female           [PASS]
  TC-3.12 Missing year level fails with GRADUATING_STATUS_MISSING   [PASS]
  TC-3.13 Missing sex fails with SEX_VALUE_MISSING on sex-gated award [PASS]
  TC-3.14 Inactive student account fails with STUDENT_PROFILE_INACTIVE [PASS]
  TC-3.15 Legacy total_points does not bypass graduation gate       [PASS]
========================================================================
Test Summary: 15 Passed, 0 Failed (100% PASS)
========================================================================
```

---

## 3. Test Coverage Matrix

- **Graduation Gating**:
  - Graduating student on graduating-only award $\rightarrow$ `eligible: true`
  - 1st/2nd/3rd year student on graduating-only award $\rightarrow$ `eligible: false` (`GRADUATING_REQUIREMENT_NOT_MET`)
  - 1st/2nd/3rd year student on open-pool award $\rightarrow$ `eligible: true`
- **Sex Gating**:
  - Female student on Female-only award $\rightarrow$ `eligible: true`
  - Male student on Female-only award $\rightarrow$ `eligible: false` (`SEX_REQUIREMENT_NOT_MET`)
  - Male student on Male-only award $\rightarrow$ `eligible: true`
  - Female student on Male-only award $\rightarrow$ `eligible: false` (`SEX_REQUIREMENT_NOT_MET`)
  - Both Male and Female students on non-sex-gated award $\rightarrow$ `eligible: true`
- **Missing Data**:
  - Null year-level on graduating-only award $\rightarrow$ `eligible: false` (`GRADUATING_STATUS_MISSING`)
  - Null sex on sex-gated award $\rightarrow$ `eligible: false` (`SEX_VALUE_MISSING`)
- **Legacy Regression Invariance**:
  - Student with 99,999 legacy `total_points` is strictly rejected if undergraduate on a graduating-only award (`PASS`).
- **Scoring Leakage Invariance**:
  - Verified that `AwardEligibilityService` does NOT read criteria scores, calculate raw points, or generate Potential Candidate statuses (`PASS`).
