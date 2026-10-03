# AchieveNest — OSAD Award Evaluation & Portfolio Scoring
# Phase 5: Award-Specific Scoring Engine & Architecture

> **Document:** `osad-award-phase5-scoring-engine.md`  
> **Phase:** 5 of 8  
> **Authority Source:** `AchieveNest — OSAD Award Evaluation & Portfolio Scoring Implementation Plan — COMPLETE`  
> **Service Layer:** `App\Services\AwardScoringService`  
> **Status:** IMPLEMENTED & AUDITED  

---

## 1. Executive Summary

Phase 5 implements the authoritative backend scoring engine (`AwardScoringService.php`) that transforms Phase 4's mapped verified portfolio records into deterministic, explainable criterion scores and award raw scores for all 15 authoritative institutional awards.

### Core Guarantees
1. **Rule Engine Integrity**: Evaluates all 7 canonical scoring rule families: Highest Applicable Only, Accumulate with Cap, Distinct Category Accumulation, Fixed Points on Category Presence, Per-Record Points Capped, Level $\times$ Placement Matrix Lookup (Sports & Socio-Cultural), and Campus Journalism Publication Counting.
2. **Computable Maximum Enforced**: Evaluates exact computable maximums (Notre Dame 50, SMC 60, Leadership 50, Journalism 70, Sports 55, Socio-Cultural 55, Student Leader 50, Member 40, Volunteer 50, Athlete 55, Performer 55).
3. **Traceability**: Every scored point is traceable to the exact underlying student master portfolio record, rule type, base points, and contribution points.
4. **No Candidate Leakage**: Strictly does NOT compute Potential Candidate status ($\ge 80\%$), does NOT rank students, and does NOT generate Top 3 / Top 5 designations (reserved for Phase 7).

---

## 2. Supported Rule Type Catalog

| Rule Identifier | Description | Awards Used In |
|---|---|---|
| `HIGHEST_APPLICABLE_ONLY` | Selects maximum qualifying score among records; rejects lower-tier records | Notre Dame (Leadership A1), SMC (Leadership A1), Leadership Award (A1, A3), Member (C1), Volunteer (B1) |
| `ACCUMULATE_WITH_CAP` | Sums distinct qualifying records up to subsection / component cap | Notre Dame (A2, B2), SMC (A2), Leadership (A2), Journalism (Leadership), Member (A, B), Volunteer (B2) |
| `DISTINCT_CATEGORY_ACCUMULATION` | Awards best score per distinct category (SSG 12, College 8, Club 6, Year 4; cap 30) | Student Leader of the Year (A1) |
| `FIXED_PRESENCE` | Fixed points awarded on category presence; multiple records do not multiply points | SMC (B1, B2), Leadership (B1, B2), Student Leader (B), Volunteer (A1, A2), Sports (Skills), Socio-Cultural (Skills) |
| `COUNT_PER_RECORD_CAPPED` | Points per record $\times$ count, capped at maximum | Notre Dame (Church B1, Citations C), SMC (Citations C), Volunteer (Citations A3), Journalism (Pubs) |
| `LEVEL_RESULT_MATRIX` | Two-dimensional lookup by event level and placement/result | Sports Performance F/M, Athlete F/M, Socio-Cultural Performance F/M, Performer F/M |
| `CAMPUS_JOURNALISM_PUBLICATION` | News 2 (cap 10), Literary 2 (cap 10), Column 4 (cap 20), Editorial 4 (cap 20), Seminars 0 | Campus Journalism Award |

---

## 3. Anti-Copy and Integrity Safeguards

- **Local Citation Differential**: Leadership Award scores local citations at **3.00 points** (Notre Dame and SMC score at 2.00 points).
- **Journalism Seminars**: Explicitly filtered out / evaluated at **0.00 points**.
- **Same-Subsection Deduplication**: Multiple entries in the same subsection (e.g. 2 School Ministry records) cannot bypass the 5-point fixed presence cap.
- **Zero Ineligible Points**: Ineligible students (Phase 3 fail) receive a hard 0.00 raw score with diagnostic failure explanations.
