# PLAN 09 — Phase 5 Query/Mutation State Contract
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. State Contract Definition

| State Property | Type | Default | Purpose & Invariant |
|---|---|---|---|
| `serverStudents` | `Array<Object>` | `[]` | Primary authoritative student dataset loaded from `GET /api/v1/osad/students`. |
| `isLoadingStudents` | `Boolean` | `true` | Indicates pending background or initial query execution. |
| `studentsError` | `String \| null` | `null` | Captures network/server errors and enables Retry action. |
| `refreshFailedAfterCreate` | `Boolean` | `false` | True only when creation succeeded (`201`) but list refetch failed. Enables dedicated "Retry List" banner. |
| `lastCreatedStudent` | `Object \| null` | `null` | Stores newly provisioned student metadata for retry and filter exclusion evaluation. |
| `createdExclusionNotice` | `Object \| null` | `null` | Holds notice metadata when a newly created student is hidden by active search/filters. |
| `fetchSequenceRef` | `useRef<number>` | `0` | Incremented on every request to prevent stale out-of-order network responses from overwriting newer state. |

---

# 2. Invariant Rules

1. **Zero Client-Only Fabrication**: The table rows are never mutated by client-side `.push()` or `.unshift()`. All rows must originate from a verified server response.
2. **Deterministic Filter Alignment**: Active filter and search state (`userSearchTerm`, `selectedCollege`, `selectedProgram`, `selectedYearLevel`, `selectedSex`, `selectedStatus`) are evaluated synchronously against the server-provided dataset.
3. **No Credential Persistence in State**: One-time credentials emitted during creation are passed strictly to `OneTimeCredentialModal` and are never persisted in the page list state.
