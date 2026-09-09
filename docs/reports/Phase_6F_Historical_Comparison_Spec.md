# Phase 6F — Historical Comparison Specification
## Snapshot Replay, Live vs. Snapshot Score Differential, and Version Comparison

**Domain:** Historical Comparison & Replay  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 22:55:00 UTC+08:00  

---

## 1. Snapshot Replay Protocol

When an OSAD administrator opens a candidate's scoring basis from a locked award cycle:
1. The UI renders the exact immutable `summary_payload` captured at snapshot creation.
2. The UI displays the **Historical Snapshot Badge**:
   ```text
   Candidate Snapshot (Version 1) • Generated: March 20, 2027 • Status: Locked
   ```
3. Live portfolio modifications made by the student after snapshot generation do not alter the snapshot data.

---

## 2. Live vs. Snapshot Differential Indicator

If the student's live portfolio score changes (e.g. additional achievements verified or an old record archived), the system presents an explicit differential panel:

```text
┌─────────────────────────────────────────────────────────────┐
│ Snapshot Score Reviewed by OSAD: 62.00 / 70.00 (88.57%)     │
│ Current Live Portfolio Score:    58.00 / 70.00 (82.86%)     │
│ Difference:                      -4.00 pts                  │
│ Delta Explanation: Editorial "Ethics in AI" was archived.   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Snapshot Version Comparison Protocol

When multiple snapshot versions exist ($V_1$ vs. $V_2$):
- Displays score changes per criterion and component.
- Lists newly contributing records and cap-excluded records between runs.
- Tracks the author and justification note of the regeneration.
