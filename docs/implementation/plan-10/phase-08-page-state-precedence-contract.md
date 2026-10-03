# PLAN 10 — Phase 8 Page-State Precedence Contract
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. State Precedence Order

```text
[1] PERMISSION_DENIED (HTTP 403)
      ↓
[2] LIST_ERROR (HTTP 500 / Network Failure)
      ↓
[3] INITIAL_LOADING (In-flight fetch with 0 prior rows)
      ↓
[4] LOADED_WITH_ROWS (1 or more students rendered)
      ↓
[5] SEARCH_EMPTY / FILTERED_EMPTY (0 matching students with active criteria)
      ↓
[6] TRUE_EMPTY (0 total student records in database)
```

---

# 2. State Invariants
- `LIST_ERROR` never renders as an empty state.
- `PERMISSION_DENIED` never leaks partial student identity or academic placements.
- `FILTERED_EMPTY` preserves active search and filter chips in the toolbar.
