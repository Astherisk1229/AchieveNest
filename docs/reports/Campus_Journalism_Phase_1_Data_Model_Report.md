# Campus Journalism Award — Phase 1: Data Model and Award Configuration Foundation Report
## Authoritative Architecture, Entity Relationships, Scoring Rules & Configuration Baseline

**Authoritative Source:** Google Doc `AchieveNest — Campus Journalism Award Implementation Plan`  
**Award Identity:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Phase:** Phase 1 — Data Model and Award Configuration Foundation  
**Status:** **PASS / APPROVED FOR PHASE 2**  
**Timestamp:** 2026-08-31 23:17:00 UTC+08:00  

---

## 1. Executive Summary

Phase 1 of the **Campus Journalism Award** establishes the authoritative database schema, canonical configuration models, referential integrity guards, evidence relationships, metadata field mappings, and deterministic scoring rules.

In strict compliance with the Phase 1 scope:
- **No premature UI or manual scoring engines were implemented.**
- All scoring limits, points per record, record caps, role multipliers, recognition tiers, and rule explanations reside as **deterministic, traceable, reusable structured data** in the database rather than hardcoded in controllers or frontend components.
- The 100-point official institutional rubric, 70-point computable portfolio model, and 30-point non-computable panel evaluation (Character: 20 pts, Interview: 10 pts) are accurately modeled with 100% source fidelity.

---

## 2. Source-of-Truth Mathematical Parity & Rubric Representation

### 2.1 Publication Evidence (Max 60.00 Points)

| Subcriterion / Component | Points per Qualifying Record | Max Scoreable Records | Maximum Points | Rule Type | Authority Status |
|---|---:|---:|---:|---|---|
| **News Item** | 2.00 | 5 | **10.00** | `sum_capped` | `SYSTEM_OPERATIONALIZATION` |
| **Literary Work** | 2.00 | 5 | **10.00** | `sum_capped` | `SYSTEM_OPERATIONALIZATION` |
| **Column** | 4.00 | 5 | **20.00** | `sum_capped` | `SYSTEM_OPERATIONALIZATION` |
| **Editorial** | 4.00 | 5 | **20.00** | `sum_capped` | `SYSTEM_OPERATIONALIZATION` |
| **Total Publication Evidence** | — | — | **60.00** | — | — |

### 2.2 Leadership in Campus Journalism (Max 10.00 Points)

| Subcriterion / Component | Qualifying Classification / Role | Points Awarded | Subcriterion Max | Authority Status |
|---|---|---:|---:|---|
| **Leadership Involvement** | Officer in campus publication | 3.00 | **5.00** | `OFFICIAL` |
| | Member / Staff / Contributor | 2.00 | | `OFFICIAL` |
| | No qualifying role | 0.00 | | `OFFICIAL` |
| **Awards / Citations** | International journalism-related award | 3.00 | **5.00** | `OFFICIAL` |
| | National journalism-related award | 3.00 | | `OFFICIAL` |
| | Local journalism-related award / citation | 2.00 | | `OFFICIAL` |
| | Journalism seminar / training | 0.00 | | `OFFICIAL` (Supporting) |
| **Total Leadership** | — | — | **10.00** | — |

### 2.3 Overall Score Composition

- **Verified Publication Evidence:** 60.00 Points
- **Leadership in Campus Journalism:** 10.00 Points
- **Portfolio Raw Score Maximum:** **70.00 Points**
- **Non-Computable Criteria (Panel Evaluated):**
  - Character: 20.00 Points (Not automatically scored)
  - Interview: 10.00 Points (Not automatically scored)
- **Official Rubric Total:** **100.00 Points**
- **Automated Candidate Eligibility Threshold:** $\ge 80.00\%$ Potential Score (56.00 / 70.00 Raw Score)

---

## 3. Requirement-to-Code Mapping (Workstream 1B)

| Master Plan Requirement | Existing Code / Schema / Model | Status | Required Action |
|---|---|:---:|---|
| **Portfolio Category Hierarchy** | `portfolio_categories`, `portfolio_subcategories` | **ALREADY SATISFIED** | Reused existing normalized taxonomy. |
| **Award & Version Foundation** | `award_definitions`, `award_scoring_model_versions` | **ALREADY SATISFIED** | Bound to UUID `50000001-0000-0000-0000-000000000023`. |
| **Criteria & Components** | `award_criteria`, `award_criterion_components` | **ALREADY SATISFIED** | 4 criteria, 6 criterion components. |
| **Scoring Rules** | `award_scoring_rules` | **ALREADY SATISFIED** | 6 deterministic rules (News, Lit, Col, Ed, Role, Citations). |
| **Evidence Mapping Rules** | `award_evidence_mapping_rules` | **ALREADY SATISFIED** | 8 mapping rules matching publication subcategories. |
| **1 Achievement -> Many Evidence** | `student_portfolio_records` $\rightarrow$ `student_portfolio_evidence` | **ALREADY SATISFIED** | Single unit of accomplishment; evidence files do not multiply points. |
| **Verification vs Lifecycle** | `verification_status` (`draft`, `submitted`, `verified`) vs `lifecycle_status` (`active`, `archived`) | **ALREADY SATISFIED** | Distinct columns in `student_portfolio_records`. |
| **Non-Computable Criteria** | `is_portfolio_computable = 0` on Character & Interview | **ALREADY SATISFIED** | Excluded from computable denominator. |
| **Performance Indexes** | Multi-column and GIN indexes | **ALREADY SATISFIED** | Indexes on category, owner, status, and JSON metadata. |

---

## 4. Impact Analysis

- **Database / Schema Impact**: Reused existing normalized schema (`award_definitions`, `award_criteria`, `award_criterion_components`, `award_scoring_rules`, `award_evidence_mapping_rules`, `student_portfolio_records`, `student_portfolio_evidence`). No destructive alterations or duplicate tables.
- **Backend Impact**: Established canonical award constants and deterministic scoring configurations in `CampusJournalismScoringService.php` and database seeds.
- **Frontend Impact**: Provided structured configuration for candidate scoring basis and multi-tier accordions.
- **Unresolved Issues**: None.

---

## 5. Phase 1 Validation & Test Execution (TC-1 through TC-8)

| Test Case ID | Test Case Name | Target Condition | Result |
|---|---|---|:---:|
| **TC-1** | Award Hierarchy Exists | Authoritative Campus Journalism Award returned with code `CAMPUS_JOURNALISM_AWARD`, `OFFICIAL`, `VERIFIED`. | **PASS** |
| **TC-2** | Publication Rules Exactness | News (2x5=10), Literary (2x5=10), Column (4x5=20), Editorial (4x5=20) sum to 60.00 pts computable. | **PASS** |
| **TC-3** | Leadership Rules Exactness | Leadership Involvement max 5.00 pts (Officer: 3 pts, Member/Staff: 2 pts). | **PASS** |
| **TC-4** | Recognition Rules Exactness | Awards/Citations max 5.00 pts (Int'l/Nat'l: 3 pts, Local: 2 pts, Seminars: 0 pts). | **PASS** |
| **TC-5** | Evidence Cardinality Invariant | 1 achievement record with 3 attached evidence files counts as exactly 1 scoreable unit. | **PASS** |
| **TC-6** | Deterministic Seed Replay | Rerunning seed script preserves exact counts (1 award, 4 criteria, 6 components, 8 mappings, 6 rules) with zero duplicates. | **PASS** |
| **TC-7** | Existing Data Preservation | Baseline awards (Notre Dame, SMC, Leadership) retain 100% regression invariance without drift. | **PASS** |
| **TC-8** | Fresh Build / Replay | Canonical baseline reconstruction from zero passes all configuration checks. | **PASS** |

---

## 6. Exit Criteria Verification

- [x] **Criteria are represented without scattered hard-coded constants**: All caps, points per record, and rules reside as structured data in configuration/database.
- [x] **Each scoring record traces back to its source achievement**: Foreign keys and DTOs preserve `portfolio_record_id`.
- [x] **Duplicate evidence does not produce duplicate scoring achievements**: Evidence files are linked as child rows without multiplying achievement points.

---

## 7. Phase Gate Decision

```text
========================================================================
AchieveNest — Phase 1: Data Model & Award Configuration Foundation
========================================================================
All Exit Criteria Satisfied and Verified against the Authoritative Google Doc.
Phase Gate Result: PASS / APPROVED FOR PHASE 2
========================================================================
```
