# Phase 7B — Report Data Source Map
## Authoritative Backend Sources, Immutability Guarantees, and Endpoint Mapping

**Domain:** Report Data Source Mapping  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 23:05:00 UTC+08:00  

---

## 1. Report Data Source Matrix

| Institutional Report Type | Authoritative Backend Source | Snapshot or Live? | Immutability Invariant |
|---|---|:---:|---|
| **Locked Candidate Summary Report** | `award_student_evaluation_summaries` | **Snapshot** | Historical; live student edits cannot change output. |
| **Candidate Detailed Scoring Report** | `award_student_evaluation_summaries.summary_payload` | **Snapshot** | Exact replay of multi-tier component breakdown. |
| **Deliberation Status Report** | `award_student_evaluation_summaries` + `award_candidate_manual_decisions` | **Snapshot + Deliberation State** | Reflects committee review status and notes. |
| **Generation Batch History Report** | `award_student_evaluation_summaries.generated_at` + batch ID | **Snapshot Metadata** | Shows all generation batches and candidate counts. |
| **Live Score Comparison View** | `CampusJournalismScoringService::calculateForStudent()` | **Live** | Explicitly labeled as "Current Live Portfolio Score". |
| **Verification Audit Report** | `student_portfolio_verification_events` | **Audit Log** | Chronological record of submission and verification actions. |
| **Deliberation Audit Report** | `award_candidate_manual_decisions` | **Audit Log** | Immutable record of committee endorsements and remarks. |

---

## 2. Immutability Isolation Invariant

$$\text{Report Data} = \begin{cases} \text{Snapshot Payload } (V_N) & \text{for Official OSAD Cycle Reports} \\ \text{Live Service Engine} & \text{for Dynamic Discovery (Explicitly Labeled)} \end{cases}$$

Under no circumstances does reporting code independently re-execute scoring math or overwrite snapshot values.
