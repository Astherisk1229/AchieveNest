# AchieveNest — OSAD Award Evaluation & Portfolio Scoring
# Final Database Integrity & Schema Audit Report

> **Document:** `osad-award-final-database-integrity-report.md`  
> **Status:** AUDITED & PASSING  

---

## 1. Relational Integrity Checks

| Verification Query | Expected Condition | Audit Result | Status |
|---|---|---|---|
| Active Award Count | `COUNT(*) = 15` | Exactly 15 active awards | **PASS** |
| Canonical Code Uniqueness | `COUNT(code) = COUNT(DISTINCT code)` | 0 duplicate award codes | **PASS** |
| Orphan Criteria Check | `criteria LEFT JOIN award_definitions` | 0 orphan criteria | **PASS** |
| Orphan Components Check | `components LEFT JOIN criteria` | 0 orphan components | **PASS** |
| Orphan Score Records | `scores LEFT JOIN student_award_evaluations` | 0 orphan score records | **PASS** |
| Candidate Status Consistency | `potential_score >= 80 <=> POTENTIAL_CANDIDATE` | 0 inconsistent classifications | **PASS** |
| Historical Data Preservation | Historical student portfolios & evaluations preserved | Preserved intact | **PASS** |

---

## 2. Table Schemas & Key Invariants

- **`award_definitions`**: Authoritative 15 awards with locked `candidate_threshold_percent = 80.00`.
- **`award_criteria`**: Computable criteria with `max_points` and `is_portfolio_computable = 1`.
- **`award_criterion_components`**: Scoring components, explicit point values, subcriteria caps, and rule types.
- **`student_award_evaluations`**: Records review state (`pending`, `in_review`, `completed`), computed `raw_score`, `max_computable_score`, normalized `potential_score`, and `candidate_status` (`POTENTIAL_CANDIDATE`, `BELOW_THRESHOLD`, `STALE`, `NOT_CLASSIFIED`).
