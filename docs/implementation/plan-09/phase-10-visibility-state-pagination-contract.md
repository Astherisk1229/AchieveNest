# PLAN 09 — Visibility-State & Pagination Contract
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Visibility Diagnostics & Empty-State Contract

The directory table explicitly differentiates all 5 visual states:

```text
1. LOADING STATE:
   Condition: isLoadingStudents === true
   Display  : Spinner with "Loading student accounts..." (Never flashes empty message)

2. ERROR STATE:
   Condition: studentsError !== null
   Display  : Error banner with "Retry" action

3. TRUE EMPTY STATE:
   Condition: rawUsersList.length === 0 && !isLoadingStudents && activeFilterCount === 0 && !search
   Display  : "No student accounts have been created yet." (Action: "Add Student Account")

4. SEARCH EMPTY STATE:
   Condition: search !== '' && filteredUsersList.length === 0 && activeFilterCount === 0
   Display  : "No student accounts found matching '[term]'." (Action: "Clear Search")

5. FILTERED EMPTY STATE:
   Condition: (activeFilterCount > 0 || search) && filteredUsersList.length === 0
   Display  : "No student accounts match your active search and filter criteria." (Action: "Reset All Filters")
```

---

# 2. Pagination & Filter Reset Rules

- **Page Size**: 25 rows per page (`PAGE_SIZE = 25`).
- **Filter/Search Change**: Modifying search term, college, program, year level, sex, or status automatically resets `currentPage = 1`.
- **Out-of-Range Correction**: If dataset shrinks such that `currentPage > totalPages`, `currentPage` auto-corrects to 1.
- **Post-Create Hidden State Notice**: If newly created student is outside current active search or filter criteria, an explanatory banner alerts the administrator and provides a 1-click "View Created Student" modal button and a "Clear Filters" button.
