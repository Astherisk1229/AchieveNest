# Phase 2 Deliverable: Database Validation & Test Execution Report

**Document Identifier:** `docs/audits/osad-award-phase2-validation-report.md`  
**Phase:** 2 of 8 (Authoritative Award Definitions, Eligibility Metadata & Rubric Seeding)  
**Authoritative Source:** *AchieveNest — OSAD Award Evaluation & Portfolio Scoring Implementation Plan — COMPLETE*  
**Audit Baseline Commit:** `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`  
**Status:** **ALL VALIDATIONS PASSED**

---

## 1. Executive Summary

This report documents the automated and database validation queries executed against the live MySQL database `achievenest_local` to prove exact mathematical and relational compliance across all 15 authoritative awards.

---

## 2. Quantitative Verification Metrics

```text
========================================================================
AchieveNest — Phase 2 Database Quantitative Verification Results
========================================================================
  Check 1: Total Active Authoritative Awards = 15                 [PASS]
  Check 2: Universal Candidate Threshold = 80.00% across all 15   [PASS]
  Check 3: Graduating-Only Awards Count = 8                       [PASS]
  Check 4: Open-Pool (All Year Levels) Awards Count = 7           [PASS]
  Check 5: Female Variant Awards Count = 4                        [PASS]
  Check 6: Male Variant Awards Count = 4                          [PASS]
  Check 7: Non-Sex-Specific Awards Count = 7                      [PASS]
  Check 8: Total Award Criteria Count = 40                        [PASS]
  Check 9: Zero Orphan Criteria (orphan_count = 0)                [PASS]
  Check 10: Zero Orphan Evaluation Summaries (orphan_count = 0)   [PASS]
  Check 11: Idempotent Re-execution Invariance (0 duplicates)     [PASS]
========================================================================
```

---

## 3. Computable Criterion Total Invariants

| Award Code | Computable Criteria Sum | Expected Computable Max | Invariant Status |
|---|---:|---:|:---:|
| `NOTRE_DAME_AWARD` | $20.00 + 20.00 + 10.00 = 50.00$ | 50.00 | **PASS (Exact)** |
| `SMC_AWARD` | $20.00 + 30.00 + 10.00 = 60.00$ | 60.00 | **PASS (Exact)** |
| `LEADERSHIP_AWARD` | $30.00 + 20.00 = 50.00$ | 50.00 | **PASS (Exact)** |
| `CAMPUS_JOURNALISM_AWARD` | $60.00 + 10.00 = 70.00$ | 70.00 | **PASS (Exact)** |
| `SPORTS_AWARD_FEMALE` | $20.00 + 20.00 + 15.00 = 55.00$ | 55.00 | **PASS (Exact)** |
| `SPORTS_AWARD_MALE` | $20.00 + 20.00 + 15.00 = 55.00$ | 55.00 | **PASS (Exact)** |
| `SOCIO_CULTURAL_AWARD_FEMALE` | $20.00 + 20.00 + 15.00 = 55.00$ | 55.00 | **PASS (Exact)** |
| `SOCIO_CULTURAL_AWARD_MALE` | $20.00 + 20.00 + 15.00 = 55.00$ | 55.00 | **PASS (Exact)** |
| `STUDENT_LEADER_OF_THE_YEAR` | $40.00 + 10.00 = 50.00$ | 50.00 | **PASS (Exact)** |
| `MEMBER_OF_THE_YEAR` | $30.00 + 10.00 = 40.00$ | 40.00 | **PASS (Exact)** |
| `VOLUNTEER_OF_THE_YEAR` | $40.00 + 10.00 = 50.00$ | 50.00 | **PASS (Exact)** |
| `ATHLETE_OF_THE_YEAR_FEMALE` | $20.00 + 20.00 + 15.00 = 55.00$ | 55.00 | **PASS (Exact)** |
| `ATHLETE_OF_THE_YEAR_MALE` | $20.00 + 20.00 + 15.00 = 55.00$ | 55.00 | **PASS (Exact)** |
| `PERFORMER_OF_THE_YEAR_FEMALE` | $20.00 + 20.00 + 15.00 = 55.00$ | 55.00 | **PASS (Exact)** |
| `PERFORMER_OF_THE_YEAR_MALE` | $20.00 + 20.00 + 15.00 = 55.00$ | 55.00 | **PASS (Exact)** |

---

## 4. Anti-Copy & Rubric Differentiation Tests

1. **Notre Dame vs Leadership Award**:
   - Notre Dame Local Leadership Citation = **2 pts** (`PASS`).
   - Leadership Award Local Leadership Citation = **3 pts** (`PASS`).
2. **Student Leader Involvement Accumulation**:
   - Distinct categories accumulate up to **30 pts** ($12 + 8 + 6 + 4$) rather than applying highest-only (`PASS`).
3. **Campus Journalism Seminar Points**:
   - Verified that no seminar point row is seeded in Campus Journalism Leadership (`PASS`).
4. **Member of the Year Leadership C2**:
   - Int/Nat Award = 3 pts, Local Citation = 2 pts, no seminar points (`PASS`).
5. **Socio-Cultural / Performer Fidelity**:
   - Awards 7, 8, 14, 15 correctly preserve `source_fidelity_status = 'PROPOSED'` (`PASS`).
