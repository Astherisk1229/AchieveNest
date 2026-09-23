# PLAN 09 — Phase 6 Visibility-State Contract
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Search & Filter State Contract

| Control | Input Parameter | Active Indicator Format | Reset / Clear Behavior |
|---|---|---|---|
| **Search Bar** | `userSearchTerm` | Chip: `Search: "[term]"` | Clears text, resets `currentPage = 1` |
| **College Select** | `selectedCollege` | Chip: `College: [CODE]` | Resets to `'all'`, resets `selectedProgram = 'all'`, resets `currentPage = 1` |
| **Program Select** | `selectedProgram` | Chip: `Program: [NAME]` | Resets to `'all'`, resets `currentPage = 1` |
| **Year Level Select** | `selectedYearLevel` | Chip: `Year: [LEVEL]` | Resets to `'all'`, resets `currentPage = 1` |
| **Sex Select** | `selectedSex` | Chip: `Sex: [SEX]` | Resets to `'all'`, resets `currentPage = 1` |
| **Status Select** | `selectedStatus` | Chip: `Status: [STATUS]` | Resets to `'all'`, resets `currentPage = 1` |
| **Clear All Action** | Global | Clears all chips | Sets all selects to `'all'`, clears `userSearchTerm`, clears exclusion notice, resets `currentPage = 1` |

---

# 2. Result Count Semantics

The UI renders the following authoritative result count summary in the footer:

```text
Showing {startRecord} to {endRecord} of {filteredCount} matching students ({totalCount} total)
```

- When unfiltered: `Showing 1 to 25 of 103 matching students`
- When filtered: `Showing 1 to 11 of 11 matching students (103 total)`
- When 0 matches: `Showing 0 to 0 of 0 matching students (103 total)`
