# PLAN 09 — Phase 6 Pagination & Count Behavior Matrix
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Pagination & Count Behavior Matrix

| Operation / Event | Previous State | Trigger | New State | Invariant Behavior |
|---|---|---|---|---|
| **Filter Applied** | Page `3` of `5` (103 rows) | User selects `College = 'CAS'` (2 rows) | Page `1` of `1` (2 rows) | Automatic page reset prevents viewing an out-of-range empty page. |
| **Search Input** | Page `2` of `5` (103 rows) | User types `"2026315391"` (1 row) | Page `1` of `1` (1 row) | Immediate page reset anchors to the single matching result. |
| **Search Cleared** | Page `1` of `1` (1 row) | User clicks Clear Search | Page `1` of `5` (103 rows) | Table expands to show all rows starting from Page 1. |
| **Student Created (Matching View)** | Page `1` of `5` (103 rows) | Admin creates student matching active filter | Page `1` of `5` (104 rows) | Refetch updates count to 104, row rendered immediately. |
| **Student Created (Hidden View)** | Filter `Year = 4th Year` | Admin creates student with `Year = 1st Year` | Filter preserved, Notice displayed | Banner alerts admin: "Created successfully, but hidden by active filters" with "View Created Student" action. |
| **Post-Commit Refetch Error** | Page `1` of `5` | Create succeeds, refetch fails | Notice banner displayed | "Retry List" button retries query only without duplicate creation risk. |
