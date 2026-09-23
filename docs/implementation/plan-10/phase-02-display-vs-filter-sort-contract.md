# PLAN 10 — Phase 2 Display vs Filter/Sort Contract
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Decoupling Principle: Display Compactness vs. Filter/Sort Power

A fundamental tenet of Plan 10 is that **compacting or moving a field from the default table does not reduce administrative search or filtering capabilities**:

```text
Table Presentation Compactness != Backend Search/Filter Reduction
```

---

# 2. Capabilities Mapping

| Field | In Default Table? | Detail Modal? | Searchable via Toolbar? | Filterable via Toolbar? | Sortable via Header? |
|---|---|---|---|---|---|
| **Student Name** | **Yes** (Primary) | **Yes** | **Yes** | N/A | **Yes** (`selectedSort='name'`) |
| **Student ID** | **Yes** (Secondary) | **Yes** | **Yes** | N/A | **Yes** (`selectedSort='id'`) |
| **Institutional Email**| No (Moved to Modal)| **Yes** | **Yes** | N/A | No |
| **Academic Program** | **Yes** (Primary) | **Yes** | **Yes** | **Yes** (`selectedProgram`) | No |
| **Year Level** | **Yes** (Secondary) | **Yes** | No | **Yes** (`selectedYearLevel`)| No |
| **College** | **Yes** (Badge) | **Yes** | No | **Yes** (`selectedCollege`) | No |
| **Sex** | No (Moved to Modal)| **Yes** | No | **Yes** (`selectedSex`) | No |
| **Account Status** | **Yes** (Badge) | **Yes** | No | **Yes** (`selectedStatus`) | No |
| **Enrollment Status** | No (Moved to Modal)| **Yes** | No | No | No |
