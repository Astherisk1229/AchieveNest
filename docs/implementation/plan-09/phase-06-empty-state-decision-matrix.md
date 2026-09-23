# PLAN 09 — Phase 6 Empty-State Decision Matrix
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Empty State Decision Matrix

To ensure that administrators are never confused by false database emptiness, the UI follows a deterministic decision matrix:

```text
+---------------------------------------------------------------------------------------------------+
| 1. Is isLoadingStudents === true?                                                                  |
|    -> YES: Render Loading Skeleton / Non-blocking spinner. Do NOT render empty message.          |
|    -> NO: Proceed to Step 2.                                                                     |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+-------------------------------------------------+
| 2. Is studentsError !== null?                                                                     |
|    -> YES: Render Error Banner with "Retry" action. Do NOT render zero-record message.            |
|    -> NO: Proceed to Step 3.                                                                     |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+-------------------------------------------------+
| 3. Is rawUsersList.length === 0 AND activeFilterCount === 0 AND !userSearchTerm?                 |
|    -> YES: Render TRUE EMPTY STATE:                                                               |
|            "No student accounts have been created yet."                                           |
|            Action: "Add Student Account"                                                          |
|    -> NO: Proceed to Step 4.                                                                     |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+-------------------------------------------------+
| 4. Is userSearchTerm non-empty AND activeFilterCount === 0 AND filteredUsersList.length === 0?   |
|    -> YES: Render SEARCH EMPTY STATE:                                                             |
|            "No student accounts found matching '[term]'."                                         |
|            Action: "Clear Search"                                                                 |
|    -> NO: Proceed to Step 5.                                                                     |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+-------------------------------------------------+
| 5. Is (activeFilterCount > 0 OR userSearchTerm) AND filteredUsersList.length === 0?               |
|    -> YES: Render FILTERED EMPTY STATE:                                                           |
|            "No student accounts match your active search and filter criteria."                    |
|            Action: "Reset All Filters"                                                            |
|    -> NO: Render Paginated Table Rows.                                                            |
+---------------------------------------------------------------------------------------------------+
```
