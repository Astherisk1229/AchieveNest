# AchieveNest — OSAD Award Evaluation & Portfolio Scoring
# Phase 7: Candidate Status Persistence & Schema Alignment

> **Document:** `osad-award-phase7-candidate-status-persistence.md`  
> **Phase:** 7 of 8  
> **Table:** `student_award_evaluations`  
> **Status:** AUDITED & OPERATIONAL  

---

## 1. Persisted Schema Fields

| Column Name | Data Type | Purpose / Source |
|---|---|---|
| `id` | `CHAR(36)` | Evaluation record primary key UUID. |
| `award_definition_id` | `CHAR(36)` | Reference to authoritative award definition. |
| `student_profile_id` | `CHAR(36)` | Reference to evaluated student profile. |
| `status` | `VARCHAR(20)` | Phase 6 review lifecycle state (`pending`, `in_review`, `completed`). |
| `raw_score` | `DECIMAL(10,2)` | Phase 5 computed portfolio raw score. |
| `max_computable_score` | `DECIMAL(10,2)` | Phase 2 computable maximum points. |
| `potential_score` | `DECIMAL(5,2)` | Phase 7 normalized percentage ($0.00$ to $100.00\%$). |
| `qualifies_portfolio_based` | `TINYINT(1)` | Boolean preselection flag ($1$ if $\ge 80\%$, $0$ otherwise). |
| `candidate_status` | `VARCHAR(30)` | Phase 7 classification (`POTENTIAL_CANDIDATE`, `BELOW_THRESHOLD`, `STALE`, `NOT_CLASSIFIED`). |
| `candidate_classified_at` | `DATETIME(6)` | Timestamp when threshold evaluation occurred. |
| `updated_at` | `DATETIME(6)` | Record modification timestamp. |

---

## 2. Idempotency and Stale Invalidation
- **Idempotency**: Successive evaluation calls for unchanged student evidence and score produce identical rows and timestamps.
- **Stale Invalidation**: If an evaluation review is reopened or student evidence changes, `candidate_status` is updated to `'STALE'` and `qualifies_portfolio_based` is reset to `0` until re-finalized.
