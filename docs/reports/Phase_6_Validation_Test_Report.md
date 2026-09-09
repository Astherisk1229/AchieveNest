# Phase 6 — Validation Test Report
## Test Case Execution and Verification Results (TC-6.1 through TC-6.20)

**Domain:** Award Cycle, Snapshot & Deliberation State Management  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Execution Timestamp:** 2026-08-31 22:55:00 UTC+08:00  
**Overall Status:** **20 / 20 PASSED (100%)**  

---

## 1. Phase 6 Test Matrix Summary

| Test ID | Test Scenario | Action & Input Fixture | Expected Outcome | Result |
|---|---|---|---|:---:|
| **TC-6.1** | Create Award Cycle | Admin creates AY 2026-2027 cycle with cutoff date. | Cycle created with `status = 'open'` and valid timestamps. | **PASS** |
| **TC-6.2** | Generate Candidate Batch | 18 potential candidates qualify. | 18 Version-1 snapshot records created; batch ID logged. | **PASS** |
| **TC-6.3** | Snapshot Matches Phase 4 | Candidate with 62/70 (88.57%). | Persisted snapshot exactly matches live Phase 4 payload. | **PASS** |
| **TC-6.4** | Live Portfolio Changes | Archive contributing Editorial after snapshot. | Historical snapshot remains 62/70 with Editorial intact. | **PASS** |
| **TC-6.5** | Live Score Recalculation | Live score becomes 58/70. | Historical snapshot score remains 62/70. Live score is separated. | **PASS** |
| **TC-6.6** | Regenerate Snapshot | Admin triggers controlled recalculation. | New Version-2 snapshot created; Version-1 preserved. | **PASS** |
| **TC-6.7** | Candidate Falls Below Threshold | Student drops to 53/70 in Version-2. | Student excluded from Version-2 active list; Version-1 inspectable. | **PASS** |
| **TC-6.8** | New Candidate Appears | Student improves from 54 to 58/70. | Student receives first snapshot in Version-2 batch. | **PASS** |
| **TC-6.9** | Lock Candidate Generation | Admin locks generation. | Cycle status becomes `GENERATION_LOCKED`; regeneration blocked. | **PASS** |
| **TC-6.10** | Unauthorized Unlock | Student/Coordinator attempts unlock. | Denied with HTTP 403 `FORBIDDEN`. | **PASS** |
| **TC-6.11** | Deliberation Status Change | Status changed: `NOT_REVIEWED` $\rightarrow$ `UNDER_REVIEW`. | Status updated and audit event logged. Scores unaffected. | **PASS** |
| **TC-6.12** | Add Deliberation Note | Committee member attaches review note. | Note persisted with author and timestamp. Scores unaffected. | **PASS** |
| **TC-6.13** | Snapshot Evidence Inspection | Inspect evidence rows from snapshot. | Complete record list with points awarded displayed. | **PASS** |
| **TC-6.14** | Config Changes Later | Scoring rule version updated in Phase 1. | Old snapshot remains linked to published version at generation. | **PASS** |
| **TC-6.15** | Closed Award Cycle | Cycle status changed to `CLOSED`. | Regeneration blocked; historical snapshots remain accessible. | **PASS** |
| **TC-6.16** | Snapshot Version Comparison | Compare Version-1 vs Version-2. | Score diff (-4.0 pts) and record deltas reported clearly. | **PASS** |
| **TC-6.17** | Snapshot Arithmetic Parity | Sum record and component points in snapshot. | Reconciles exactly to $62.00 / 70.00$ raw score. | **PASS** |
| **TC-6.18** | Generation Run Audit | Verify audit log of generation run. | Actor, batch ID, candidate count, timestamp verified. | **PASS** |
| **TC-6.19** | Multiple Generation Batches | Switch between Batch 1 and Batch 2. | Each batch population loads independently. | **PASS** |
| **TC-6.20** | Zero Binary File Duplication | Audit snapshot storage size. | Stores JSON references and SHA256 hashes, not raw binary bytes. | **PASS** |

---

## 2. Test Execution Output

```text
========================================================================
AchieveNest — Phase 6: Award Cycle & Snapshot Management Test Output
========================================================================
  TC-6.1   Award Cycle Creation & Cutoff Configuration            [PASS]
  TC-6.2   Candidate Batch Generation & Version-1 Persistence      [PASS]
  TC-6.3   Snapshot Exact Match to Phase 4 Computable Output       [PASS]
  TC-6.4   Live Portfolio Mutation Immutability Isolation          [PASS]
  TC-6.5   Live vs. Snapshot Score Differential Separation         [PASS]
  TC-6.6   Controlled Versioned Regeneration Protocol (V1 -> V2)  [PASS]
  TC-6.7   Candidate Threshold Drop Historical Preservation        [PASS]
  TC-6.8   New Candidate Inclusion on Regeneration                 [PASS]
  TC-6.9   Generation Locking Guard Enforcement                    [PASS]
  TC-6.10  Unauthorized Unlock & Tampering Blocked (HTTP 403)      [PASS]
  TC-6.11  Deliberation State Transition & Audit Trail             [PASS]
  TC-6.12  Deliberation Committee Note Persistence                 [PASS]
  TC-6.13  Snapshot Record-Level Evidence Replay                   [PASS]
  TC-6.14  Scoring Configuration Version Immutability Link         [PASS]
  TC-6.15  Closed Cycle Protection & Historical Access             [PASS]
  TC-6.16  Snapshot Version Differential Comparison                [PASS]
  TC-6.17  Hierarchical Snapshot Arithmetic Reconciliation         [PASS]
  TC-6.18  Batch Generation Run Audit Logging                      [PASS]
  TC-6.19  Independent Multi-Batch Snapshot Exploration            [PASS]
  TC-6.20  Metadata Reference Storage Invariant (No File Bloat)    [PASS]
========================================================================
Phase 6 Verification Summary: 20 Passed, 0 Failed (100% PASS)
========================================================================
```
