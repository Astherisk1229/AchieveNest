# Campus Journalism Award — Phase 4: Scoring Engine & Explainability Report
## Primary Phase 4 Deliverable — Authoritative 70-Point Computable Model

**Document Version:** 1.0.0  
**Domain:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Phase:** Phase 4 — Scoring Engine & Explainability  
**Status:** **COMPLETED / PASS**  
**Timestamp:** 2026-08-31 22:45:00 UTC+08:00  

---

## 1. Executive Summary & Core Results

Phase 4 implements the authoritative scoring engine and explainability generator for the **Campus Journalism Award** (`CAMPUS_JOURNALISM_AWARD`).

In strict compliance with all non-negotiable Phase 4 rules:
1. The scoring engine consumes **only records verified and approved by `CampusJournalismEligibilityService`**.
2. Applies the canonical 70-point computable rubric ($60\text{ pts}$ publication cap, $10\text{ pts}$ leadership cap).
3. Produces the Portfolio Potential Score:
   $$\text{Portfolio Potential Score} = \left(\frac{\text{Portfolio Raw Score}}{70.00}\right) \times 100$$
4. Evaluates the candidate threshold:
   $$\text{Raw Score} \ge 56.00 \iff \text{Potential Score} \ge 80.00\% \implies \text{POTENTIAL\_CANDIDATE}$$
5. Generates a rich, transparent, record-level explainability DTO without requiring any recalculation on the frontend.

---

## 2. Mathematical Scoring Summary & Cap Hierarchy

```text
========================================================================================
AchieveNest — Campus Journalism Award Canonical Scoring Hierarchy
========================================================================================
1. Criterion: Verified Publication Evidence                                [Max: 60.00]
   ├── News Item (COMP_JOURN_NEWS)       : 2.00 pts / record               [Cap: 10.00]
   ├── Literary (COMP_JOURN_LITERARY)    : 2.00 pts / record               [Cap: 10.00]
   ├── Column (COMP_JOURN_COLUMN)        : 4.00 pts / record               [Cap: 20.00]
   └── Editorial (COMP_JOURN_EDITORIAL)  : 4.00 pts / record               [Cap: 20.00]

2. Criterion: Leadership in Campus Journalism                              [Max: 10.00]
   ├── Leadership Role (COMP_JOURN_LEAD_ROLE) : Officer = 3, Member = 2   [Cap:  5.00]
   └── Awards/Citations (COMP_JOURN_LEAD_AWARDS): Int/Nat = 3, Local = 2,  [Cap:  5.00]
                                                Seminar = 0 (Supporting)

Total Portfolio Computable Raw Score                                       [Max: 70.00]
Candidate Qualifying Threshold (80.00%)                                    [Min: 56.00]
========================================================================================
```

---

## 3. Authoritative Implementation: `CampusJournalismScoringService`

The authoritative engine is implemented in [`CampusJournalismScoringService.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/CampusJournalismScoringService.php) and exposed via REST API route `GET /api/v1/awards/campus-journalism/students/{studentId}/score`.

Key Architecture Features:
- **Zero NLP / Quality Guessing**: Computes strictly based on verified evidence items.
- **Cardinality Invariant**: 1 achievement with multiple evidence files produces exactly 1 scoreable unit.
- **Transparent Cap Reporting**: Records beyond the component maximum are explicitly labeled as `CAP_REACHED`.
- **Seminar Zero-Point Rule**: Journalism trainings are reported as `SUPPORTING_ONLY` with 0.00 points effect.

---

## 4. Phase 4 Test Suite Verification Summary (TC-4.1 to TC-4.24)

```text
========================================================================
AchieveNest — Phase 4: Scoring Engine & Explainability Test Results
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
Total Phase 4 Tests: 24 Passed, 0 Failed (100% PASS)
========================================================================
```

---

## 5. Phase 4 Deliverables Package

1. **Primary Deliverable:** [`Campus_Journalism_Phase_4_Scoring_Engine_Report.md`](file:///c:/Users/Admin/Documents/AchieveNest/docs/reports/Campus_Journalism_Phase_4_Scoring_Engine_Report.md)
2. **Architecture Audit:** [`Phase_4A_Scoring_Architecture_Audit.md`](file:///c:/Users/Admin/Documents/AchieveNest/docs/reports/Phase_4A_Scoring_Architecture_Audit.md)
3. **Scoring Rule Map:** [`Phase_4B_Scoring_Rule_Map.md`](file:///c:/Users/Admin/Documents/AchieveNest/docs/reports/Phase_4B_Scoring_Rule_Map.md)
4. **Leadership Distinctness Rules:** [`Phase_4C_Leadership_Distinctness_Rules.md`](file:///c:/Users/Admin/Documents/AchieveNest/docs/reports/Phase_4C_Leadership_Distinctness_Rules.md)
5. **Explainability Payload Spec:** [`Phase_4D_Explainability_Payload_Spec.md`](file:///c:/Users/Admin/Documents/AchieveNest/docs/reports/Phase_4D_Explainability_Payload_Spec.md)
6. **Scoring API Map:** [`Phase_4E_Scoring_API_Map.md`](file:///c:/Users/Admin/Documents/AchieveNest/docs/reports/Phase_4E_Scoring_API_Map.md)
7. **Scoring Test Report:** [`Phase_4_Scoring_Test_Report.md`](file:///c:/Users/Admin/Documents/AchieveNest/docs/reports/Phase_4_Scoring_Test_Report.md)
8. **Performance Report:** [`Phase_4_Performance_Report.md`](file:///c:/Users/Admin/Documents/AchieveNest/docs/reports/Phase_4_Performance_Report.md)

---

## 6. Phase 5 Handoff Specification

With Phase 4 **COMPLETE / PASS**, the system provides **Phase 5 — Candidate Generation and OSAD Deliberation UI** with:
- A complete, verified scoring payload for any student containing exact raw points, potential percentages, candidate status, and itemized record breakdowns.
- Frontend components can render the expandable candidate review UI directly without recalculating or guessing scores.

**Phase 4 Gate Status:** **APPROVED / READY FOR PHASE 5**
