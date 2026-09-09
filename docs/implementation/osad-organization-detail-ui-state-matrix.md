# OSAD Student Organization Detail UI State Matrix
## Plan 02 Phase 4 UI State & Interaction Matrix

| State / Condition | Card Grid Display | Detail View Display | User Actions Available |
|---|---|---|---|
| **Program Scope, Assigned Moderator** | Shows `[N] Programs`, Moderator Name, `[Code]`, Category, College | Full profile, `Fully Configured`, all affiliated programs listed, active moderator card with tenure, history table | Back, Reassign Moderator, Edit Details (Phase 5) |
| **Program Scope, Unassigned Moderator** | Shows `[N] Programs`, `Unassigned`, `Assign` button | Full profile, `Partially Configured`, affiliated programs listed, amber `Needs Moderator` card, empty history or previous ended rows | Back, Assign Moderator, Edit Details (Phase 5) |
| **University / College Scope, Assigned Moderator** | Shows `University / College Scope`, Moderator Name, `[Code]`, Category | Full profile, `Fully Configured`, informational badge *"University/College-wide scope; no program-specific affiliations required"*, active moderator card | Back, Reassign Moderator, Edit Details (Phase 5) |
| **University / College Scope, Unassigned Moderator** | Shows `University / College Scope`, `Unassigned`, `Assign` button | Full profile, `Partially Configured`, informational scope banner, amber `Needs Moderator` card | Back, Assign Moderator, Edit Details (Phase 5) |
| **Card Hover / Focus** | `hover:shadow-md`, `hover:border-emerald-300`, `focus:ring-2`, pointer cursor | N/A | Mouse click or keyboard `Enter` / `Space` opens detail view |
| **Nested "Assign" Click on Card** | Opens `PersonnelSelectorModal` directly; does NOT open detail view (`e.stopPropagation()`) | N/A | Select personnel candidate to assign moderator |
| **Loading State** | Initial cards or cached data | Spinner with *"Loading Organization details..."* | Back button |
| **Error / Network Failure** | Toast error on mutation | Rose banner with error message and *"Retry"* button | Retry fetch, Back to organizations |
| **Not Found (404) / Invalid Org ID** | N/A | Rose banner *"Organization not found."* with *"Back to Student Organizations"* | Back to organizations |
| **Direct URL Refresh (`?tab=organizations&orgId=...`)** | Direct load of specified organization | Fetches authoritative backend data for `orgId` and renders without requiring list state | All detail interactions |
