# PLAN 12 — Phase 3 Current-vs-Historical Assignment Matrix
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Assignment Lifecycle State Matrix

| Assignment Scenario | `is_active` Flag | Personnel Status | Visible in Student Contacts? | Database Action |
|---|---|---|---|---|
| **Active Current Assignment** | `1` | `active` | **YES (Displayed)** | Retained in assignment table |
| **Historical Past Assignment** | `0` | `active` | **NO (Filtered)** | Retained for audit history |
| **Expired Assignment** | `0` | `active` | **NO (Filtered)** | Retained with `effective_until` |
| **Suspended Personnel** | `1` | `suspended` | **NO (Filtered)** | Retained; suppressed from contact card |
| **Archived Personnel** | `1` | `archived` | **NO (Filtered)** | Retained; suppressed from contact card |
| **Unassigned / Open** | N/A | N/A | **NO (Returns null)** | Shows neutral unassigned notice |
