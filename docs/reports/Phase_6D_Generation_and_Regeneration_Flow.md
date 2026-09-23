# Phase 6D — Generation and Regeneration Flow
## Batch Candidate Generation, Version Increments, and Regeneration Protocols

**Domain:** Candidate Batch Generation & Versioning  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 22:55:00 UTC+08:00  

---

## 1. Candidate Generation Execution Protocol

```text
OSAD Candidate Generation Workflow:
┌─────────────────────────────────────────────────────────────┐
│ 1. OSAD clicks "Generate Candidates for Award Cycle"        │
│ 2. System verifies Award Cycle is OPEN and within window    │
│ 3. Retrieves all graduating active students                 │
│ 4. Executes CampusJournalismScoringService for each student │
│ 5. Filters students meeting threshold: Raw >= 56 (>= 80.00%)│
│ 6. Creates Snapshot Version 1 for each candidate            │
│ 7. Logs CANDIDATES_GENERATED audit event with batch ID      │
│ 8. Locks generation into GENERATION_LOCKED state            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Controlled Regeneration Protocol

If candidate portfolio records are amended prior to committee finalization, OSAD may trigger a controlled regeneration:

1. **Policy Gate**: Reopening requires OSAD staff authorization with non-empty justification remark.
2. **Version Invariant**: Snapshot version increments from Version $N \rightarrow N+1$.
3. **No In-Place Overwrites**: Version $N$ is preserved as an immutable historical record.
4. **Threshold Transitions**:
   - Students falling below $80.00\%$ are excluded from Version $N+1$ active list (historical Version $N$ remains viewable).
   - Students newly crossing $80.00\%$ receive their first snapshot in Version $N+1$.
