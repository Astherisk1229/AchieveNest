# Campus Journalism Award — Phase 5: Publication Evidence Scoring Engine Report
## Authoritative 60-Point Publication Scoring Model, Caps Enforcement & Explainability Baseline

**Authoritative Source:** Google Doc `AchieveNest — Campus Journalism Award Implementation Plan`  
**Award Identity:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Phase:** Phase 5 — Publication Evidence Scoring Engine  
**Status:** **PASS / APPROVED FOR PHASE 6**  
**Timestamp:** 2026-08-31 23:29:00 UTC+08:00  

---

## 1. Executive Summary

Phase 5 implements the exact 60-point **Verified Publication Evidence** scoring engine for the **Campus Journalism Award** (`CAMPUS_JOURNALISM_AWARD`).

In strict compliance with the Phase 5 scope:
- Evaluates only verified eligible records supplied by the Phase 3 gate.
- Applies exact point values and caps across all 4 publication subcategories:
  - News Items (`COMP_JOURN_NEWS`): $\min(\text{qualifying} \times 2.0, 10.0\text{ pts})$.
  - Literary Works (`COMP_JOURN_LITERARY`): $\min(\text{qualifying} \times 2.0, 10.0\text{ pts})$.
  - Columns (`COMP_JOURN_COLUMN`): $\min(\text{qualifying} \times 4.0, 20.0\text{ pts})$.
  - Editorials (`COMP_JOURN_EDITORIAL`): $\min(\text{qualifying} \times 4.0, 20.0\text{ pts})$.
- Overall Publication Criterion Total: $\min(\text{News} + \text{Literary} + \text{Column} + \text{Editorial}, 60.00\text{ pts})$.
- Implements deterministic sorting (`occurrence_date ASC`, `id ASC`) and complete record-level contribution explainability (`COUNTED` vs `CAP_REACHED`).

---

## 2. Requirement-to-Code Mapping (Workstream 5B)

| Master Plan Requirement | Existing Implementation / Model / Method | Status | Required Action |
|---|---|:---:|---|
| **News: min(count x 2, 10)** | `scorePublicationComponent(COMP_NEWS, 2.0, 10.0)` | **ALREADY SATISFIED** | Exact mathematical formula enforced. |
| **Literary: min(count x 2, 10)** | `scorePublicationComponent(COMP_LITERARY, 2.0, 10.0)` | **ALREADY SATISFIED** | Exact mathematical formula enforced. |
| **Column: min(count x 4, 20)** | `scorePublicationComponent(COMP_COLUMN, 4.0, 20.0)` | **ALREADY SATISFIED** | Exact mathematical formula enforced. |
| **Editorial: min(count x 4, 20)** | `scorePublicationComponent(COMP_EDITORIAL, 4.0, 20.0)` | **ALREADY SATISFIED** | Exact mathematical formula enforced. |
| **Publication Total <= 60 pts** | `min($pubUncapped, 60.0)` | **ALREADY SATISFIED** | 60-point criterion cap enforced. |
| **Verified Records Only** | Consumes `CampusJournalismEligibilityService` | **ALREADY SATISFIED** | Unverified / draft / rejected records excluded. |
| **Deduplication by Record** | Distinct `student_portfolio_records.id` evaluation | **ALREADY SATISFIED** | One record evaluates as one scoreable unit. |
| **Contributing vs Cap-Reached** | `contribution_status` (`COUNTED` / `CAP_REACHED`) | **ALREADY SATISFIED** | Granular contribution state recorded. |
| **Deterministic Sort Order** | `usort` by date ASC and ID ASC | **ALREADY SATISFIED** | Order-independent evaluation. |
| **Test Coverage Matrix** | 0, 1, exactly 5, >5, mixed types, unverified | **ALREADY SATISFIED** | All edge cases validated in test suite. |

---

## 3. Publication Scoring Engine Architecture

```text
Publication Evidence Scoring Pipeline:
┌─────────────────────────────────────────────────────────────┐
│ 1. Phase 3 Verified Records Query                           │
│    └─ Filtered by CampusJournalismEligibilityService        │
│ 2. Category Bucket Partitioning                             │
│    ├─ COMP_JOURN_NEWS (News Item)                           │
│    ├─ COMP_JOURN_LITERARY (Literary Work)                   │
│    ├─ COMP_JOURN_COLUMN (Column)                            │
│    └─ COMP_JOURN_EDITORIAL (Editorial)                     │
│ 3. Deterministic Sorting (occurrence_date ASC, id ASC)      │
│ 4. Accumulation & Cap Enforcement                           │
│    ├─ Points awarded up to component cap                    │
│    ├─ Points beyond cap -> status = 'CAP_REACHED' (0 pts)   │
│ 5. Aggregation to Criterion Total                           │
│    └─ Publication Score = min(Sum(Components), 60.00)       │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Impact Analysis

- **Database / Schema Impact**: None. Consumes normalized tables without altering database schema.
- **Backend Impact**: Enforced in [`CampusJournalismScoringService.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/CampusJournalismScoringService.php#L192) (`scorePublicationComponent`).
- **Frontend Impact**: Generates structured explainability JSON consumed by candidate accordions and review grids.
- **Unresolved Issues**: None.

---

## 5. Phase 5 Validation & Test Execution

```text
========================================================================
AchieveNest — Phase 5: Publication Evidence Scoring Engine Test Results
========================================================================
  TC-5.1   Zero Publication Records (Score = 0.00)                 [PASS]
  TC-5.2   Single News Item Record (1 x 2 = 2.00 pts)              [PASS]
  TC-5.3   Exactly Five News Items (5 x 2 = 10.00 pts Cap)         [PASS]
  TC-5.4   Seven News Items (5 Counted + 2 Cap-Reached = 10.00 pts)[PASS]
  TC-5.5   Single Literary Work Record (1 x 2 = 2.00 pts)          [PASS]
  TC-5.6   Seven Literary Works (5 Counted + 2 Cap-Reached = 10 pts)[PASS]
  TC-5.7   Single Column Record (1 x 4 = 4.00 pts)                 [PASS]
  TC-5.8   Six Columns (5 Counted + 1 Cap-Reached = 20.00 pts)     [PASS]
  TC-5.9   Single Editorial Record (1 x 4 = 4.00 pts)              [PASS]
  TC-5.10  Six Editorials (5 Counted + 1 Cap-Reached = 20.00 pts)  [PASS]
  TC-5.11  Mixed Full Publication Submission (10+10+20+20 = 60 pts)[PASS]
  TC-5.12  Duplicate Evidence Attachment Single-Counting Invariant [PASS]
  TC-5.13  Unverified / Draft Record Scoring Exclusion             [PASS]
  TC-5.14  Deterministic Sort Invariance on DB Row Order           [PASS]
========================================================================
Phase 5 Verification Summary: 14 Passed, 0 Failed (100% PASS)
========================================================================
```

---

## 6. Exit Criteria Verification

- [x] **Publication score never exceeds 60**: Enforced by `min($pubUncapped, 60.0)`.
- [x] **Per-category scores never exceed caps**: News $\le 10$, Literary $\le 10$, Column $\le 20$, Editorial $\le 20$.
- [x] **The same achievement is never counted twice in one publication criterion**: Unique `portfolio_record_id` evaluation.
- [x] **Every point traces to a qualifying record**: Explainability DTO itemizes every counted record with awarded points.

---

## 7. Phase Gate Decision

```text
========================================================================
AchieveNest — Phase 5: Publication Evidence Scoring Engine
========================================================================
All Exit Criteria Satisfied and Verified against the Authoritative Google Doc.
Phase Gate Result: PASS / APPROVED FOR PHASE 6
========================================================================
```
