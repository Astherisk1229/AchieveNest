# PLAN 10 — Phase 8 Result Count & Query-State Behavior Matrix
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Result Count & Pagination Across States

| Page State | Directory Tab Badge | Footer Metric Text | Pagination Controls |
|---|---|---|---|
| **INITIAL_LOADING** | `Student Directory (0)` | "Loading student accounts..." | Hidden |
| **LOADED_WITH_ROWS**| `Student Directory (103)` | "Showing 1 to 25 of 103 matching students" | "Page 1 of 5", Previous / Next buttons |
| **TRUE_EMPTY** | `Student Directory (0)` | "Showing 0 to 0 of 0 matching students" | Hidden |
| **SEARCH_EMPTY** | `Student Directory (0)` | "Showing 0 to 0 of 0 matching students (103 total)" | Hidden |
| **FILTERED_EMPTY** | `Student Directory (0)` | "Showing 0 to 0 of 0 matching students (103 total)" | Hidden |
| **LIST_ERROR** | `Student Directory (0)` | Hidden during error banner | Preserved for Retry |
