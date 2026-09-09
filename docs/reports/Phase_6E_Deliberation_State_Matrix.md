# Phase 6E — Deliberation State Matrix
## Review States, Committee Notes, State Transition Audits, and Scoring Separation

**Domain:** Deliberation State Management  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 22:55:00 UTC+08:00  

---

## 1. Deliberation State Machine

```text
               ┌────────────────┐
               │  NOT_REVIEWED  │
               └───────┬────────┘
                       │ (Committee begins evaluating candidate portfolio)
                       ▼
               ┌────────────────┐
               │  UNDER_REVIEW  │
               └───────┬────────┘
                       │ (Committee completes review of portfolio evidence)
                       ▼
               ┌────────────────┐
       ┌───────│    REVIEWED    │───────┐
       │       └────────────────┘       │
       │                                │
(Committee endorses              (Committee does not
 for final panel)                 endorse candidate)
       │                                │
       ▼                                ▼
┌──────────────┐                 ┌──────────────┐
│   ENDORSED   │                 │ NOT_ENDORSED │
└──────────────┘                 └──────────────┘
```

---

## 2. Deliberation State vs. Scoring Result Separation

| State Category | Field Name | Possible Values | Meaning |
|---|---|---|---|
| **Authoritative Scoring Result** | `result` | `POTENTIAL_CANDIDATE`, `BELOW_THRESHOLD` | Mathematical outcome of Phase 4 portfolio computable scoring ($56/70$ threshold). |
| **Committee Deliberation State** | `deliberation_status` | `NOT_REVIEWED`, `UNDER_REVIEW`, `REVIEWED`, `ENDORSED`, `NOT_ENDORSED` | Human review workflow status during OSAD award committee deliberations. |

---

## 3. Deliberation Note Schema

```sql
CREATE TABLE IF NOT EXISTS award_candidate_deliberation_notes (
    id CHAR(36) NOT NULL PRIMARY KEY,
    snapshot_id CHAR(36) NOT NULL,
    author_profile_id CHAR(36) NOT NULL,
    note_text TEXT NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_acdn_snap FOREIGN KEY (snapshot_id) REFERENCES award_student_evaluation_summaries(id) ON DELETE CASCADE,
    CONSTRAINT fk_acdn_author FOREIGN KEY (author_profile_id) REFERENCES profiles(id) ON DELETE RESTRICT
);
```
