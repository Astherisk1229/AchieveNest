# PLAN 10 — Phase 10 Loading, Empty & Error State Contract
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. State Model & Precedence Order

```text
[1] PERMISSION_DENIED (HTTP 403)
      ↓
[2] LIST_ERROR (HTTP 500 / Network Error)
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

# 2. Recovery Pathway Matrix

| Condition | User Message | Action CTA | Context Preserved? |
|---|---|---|---|
| **True Empty** | "No student accounts have been created yet." | `Add Student Account` | 0 total count |
| **Search Empty** | "No student accounts found matching \"{term}\"." | `Clear Search` | Active filters preserved |
| **Filtered Empty** | "No student accounts match your filter criteria." | `Reset All Filters` | Active filter chips preserved |
| **List Request Error**| "Student Accounts could not be loaded." | `Retry` | Search & filter inputs preserved |
| **Post-Commit Error** | "Student created, but list could not refresh." | `Retry List` | 0 creation replay |
