# Phase 3C — Status Transition Matrix
## State Machine, Preconditions, Postconditions, and Audit Triggers

**Domain:** Verification Lifecycle & State Transitions  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 22:40:00 UTC+08:00  

---

## 1. Verification State Machine Diagram

```text
               ┌──────────────┐
               │    draft     │
               └──────┬───────┘
                      │ (Student submits with complete Phase 2 metadata & evidence)
                      ▼
               ┌──────────────┐
       ┌───────│  submitted   │──────────────┐
       │       └──────┬───────┘              │
       │              │                      │
(Verifier requests    │ (Verifier approves   │ (Verifier rejects
 revision with note)  │  with active proof)  │  with note)
       │              ▼                      │
       │       ┌──────────────┐              │
       │       │   verified   │              │
       │       └──────────────┘              │
       │              │                      │
       │              │ (Optional lifecycle  │
       │              │  archive/supersede)  │
       │              ▼                      │
       │       ┌──────────────┐              │
       │       │   archived   │              │
       │       └──────────────┘              │
       │                                     │
       ▼                                     ▼
┌──────────────────────┐              ┌──────────────┐
│ revisions_requested  │              │   rejected   │
└──────────┬───────────┘              └──────────────┘
           │ (Student edits & resubmits)
           └──────────► submitted
```

---

## 2. Transition Rules Matrix

| Initial State | Action Trigger | Target State | Authorized Role | Preconditions Enforced | Audit Event Emitted |
|---|---|---|---|---|---|
| `draft` | `submitNow = true` | `submitted` | Student (Owner) | Title, outlet, date (non-future), role, and $\ge 1$ evidence file present. | `PORTFOLIO_SUBMITTED` |
| `submitted` | `verifyRecord` | `verified` | Program Coordinator / OSAD | Record in reviewable state, $\ge 1$ active evidence file exists, non-owner actor. | `PORTFOLIO_VERIFIED` |
| `submitted` | `requestRevision` | `revisions_requested` | Program Coordinator / OSAD | Reviewer remarks non-empty (VR-3.6), non-owner actor. | `PORTFOLIO_REVISION_REQUESTED` |
| `submitted` | `rejectRecord` | `rejected` | Program Coordinator / OSAD | Reviewer remarks non-empty (VR-3.7), non-owner actor. | `PORTFOLIO_REJECTED` |
| `revisions_requested` | `resubmitRecord` | `submitted` | Student (Owner) | Student edits record, provides required updates/evidence. | `PORTFOLIO_RESUBMITTED` |
| `verified` | `archiveRecord` | `archived` | Admin / Student | Lifecycle update; verification status preserved as `verified`. | `PORTFOLIO_ARCHIVED` |

---

## 3. Invalid Transition Protections

- `draft` $\rightarrow$ `verified`: **BLOCKED** (HTTP 422 `INVALID_STATE_TRANSITION`).
- `verified` $\rightarrow$ `draft` via ordinary edit: **BLOCKED** (Score-relevant metadata locked).
- `rejected` $\rightarrow$ `verified` directly: **BLOCKED** (Must be resubmitted and reviewed).
