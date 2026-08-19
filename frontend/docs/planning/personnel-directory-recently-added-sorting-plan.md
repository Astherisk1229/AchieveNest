# Personnel Directory Recently Added Sorting and Highlighting

## Objective

Enhance the HR Personnel Directory so a newly created or pending-placement personnel record is immediately visible after onboarding.

The implementation will:

- persist the personnel account creation timestamp;
- open the Directory tab after successful onboarding;
- apply Recently Added (Newest First);
- clear filters that could hide the new record;
- reset pagination to Page 1;
- highlight the created row with a temporary NEW badge; and
- add a quick-sort selector that remains compatible with sortable column headers.

## Approved User Experience

Normal directory entry continues to default to Name (A to Z).

After successful onboarding:

    HR submits onboarding form
      → Create and persist personnel record
      → Return the created record
      → Open Directory tab
      → Clear search and filters
      → Apply Recently Added (Newest First)
      → Reset to Page 1
      → Highlight the created row for 8 seconds

This behavior applies to fully onboarded accounts and records saved as Pending Placement. Existing toast messages will continue distinguishing the two results.

## Files to Modify

| File | Responsibility |
| :--- | :--- |
| src/models/HRModel.js | Add and serialize the personnel creation timestamp. |
| src/controllers/HRController.js | Stamp new records and return the created record. |
| src/hooks/useHR.js | Return the created record after refreshing HR data. |
| src/pages/hr-admin/HRPersonnelDirectoryPage.jsx | Coordinate onboarding, controlled sorting, record reveal, and highlight lifetime. |
| src/pages/hr-admin/personnel-directory/PersonnelDirectoryTable.jsx | Render quick sorting, apply timestamp sorting, reset view state, and highlight the row. |

## Phase 1: Persist Creation Time

### HRModel.js

Add a private created_at field to PersonnelEntity, expose it through a getter, and include it in toJSON().

The constructor must preserve legacy data:

    this.#created_at = data.created_at || null

Do not default missing values to the current time. Otherwise, legacy records would appear newly created every time they are loaded.

### HRController.js

Assign the timestamp only when a record is created:

    const newEntity = new PersonnelEntity({
      ...data,
      created_at: new Date().toISOString()
    })

Persist the entity through the existing local-storage workflow. Change createPersonnelAccount() to return newEntity.toJSON() instead of the complete personnel collection.

Before changing the return contract, confirm no other caller depends on the previous array result.

### useHR.js

Return the created DTO after refreshing hook state:

    const handleCreatePersonnelAccount = (accountData) => {
      const createdRecord =
        HRController.createPersonnelAccount(accountData)

      refreshData()
      return createdRecord
    }

## Phase 2: Coordinate the Directory from the Page

### Add Page State

Add controlled directory sorting:

    const [directorySort, setDirectorySort] = useState({
      column: 'full_name',
      direction: 'asc'
    })

Add onboarding feedback state:

    const [newlyCreatedId, setNewlyCreatedId] = useState(null)
    const [revealRequestKey, setRevealRequestKey] = useState(0)

The reveal request is an event counter. Incrementing it instructs the table to clear search and filters and return to Page 1.

### Refine handleOnboardSubmit

The handler must support synchronous and asynchronous implementations:

    const createdRecord = await Promise.resolve(
      handleCreatePersonnelAccount?.(formData)
    )

After successful creation:

1. Set activeTab to directory.
2. Set directorySort to created_at descending.
3. Increment revealRequestKey.
4. Set newlyCreatedId from createdRecord.id.
5. Preserve the existing full-account or pending-placement toast.
6. Close the onboarding modal.

If creation fails:

- keep the modal open;
- show an error message;
- do not change sorting;
- do not clear filters; and
- do not show a false highlight.

### Highlight Cleanup

Use an effect with cleanup for the eight-second timeout:

    useEffect(() => {
      if (!newlyCreatedId) return undefined

      const timeoutId = window.setTimeout(() => {
        setNewlyCreatedId(null)
      }, 8000)

      return () => window.clearTimeout(timeoutId)
    }, [newlyCreatedId])

Pass sortConfig, onSortChange, newlyCreatedId, and revealRequestKey to PersonnelDirectoryTable.

## Phase 3: Implement Controlled Sorting

### Table Props

Accept:

- sortConfig;
- onSortChange;
- newlyCreatedId; and
- revealRequestKey.

Remove duplicate local sortColumn and sortDirection state. Derive them from sortConfig, with full_name ascending as a defensive fallback.

### Timestamp Comparator

Use a safe parser:

    const getCreatedTime = (value) => {
      const time = Date.parse(value || '')
      return Number.isNaN(time)
        ? Number.NEGATIVE_INFINITY
        : time
    }

Add the comparison:

    comparison =
      getCreatedTime(a.created_at) -
      getCreatedTime(b.created_at)

Do not use timeB minus timeA inside this branch. The table's existing final direction logic already reverses the comparison for descending order.

Continue using full name and ID as deterministic tie-breakers.

### Header Sorting

Route header actions through onSortChange. Toggling the current column reverses its direction.

Suggested first-click directions:

- Personnel Member: ascending;
- Department and College: ascending;
- Academic Rank: descending;
- Employment Details: ascending.

## Phase 4: Add the Quick-Sort Selector

Place a clearly labeled Sort by selector beside the existing filter controls.

| Label | Column | Direction |
| :--- | :--- | :---: |
| Recently Added (Newest First) | created_at | desc |
| Name (A to Z) | full_name | asc |
| Name (Z to A) | full_name | desc |
| Academic Rank (Highest First) | academic_rank | desc |
| Department and College (A to Z) | department | asc |

Use a combined selector value such as created_at:desc and split it into column and direction on change.

Existing column headers can generate configurations outside these presets. Prevent the selector from becoming blank by either:

1. including every supported header-sort combination; or
2. displaying a disabled Custom column sort option.

Including all supported combinations is preferred.

Sorting changes must continue resetting the table to Page 1 through the existing pagination effect.

## Phase 5: Reveal the Created Record

When revealRequestKey changes, the table must:

    setSearch('')
    setCollegeFilter('ALL')
    setDeptFilter('ALL')
    setStatusFilter('ALL')
    setCurrentPage(1)

Sorting remains controlled by the page and should not be duplicated in this effect.

This reset is necessary because an old search query or filter could otherwise hide the successfully created record.

## Phase 6: Add the Temporary Row Highlight

For each rendered record:

    const isNewlyCreated = p.id === newlyCreatedId

When true, apply:

- a subtle emerald background in light and dark mode;
- a left emerald border;
- a NEW badge beside the personnel name; and
- a non-pulsing color transition.

Recommended row classes:

    bg-emerald-50/80 dark:bg-emerald-950/40
    border-l-4 border-l-emerald-500 transition-colors

The badge identifies the record from the current onboarding action. It must not be a permanent status and must not be calculated from a general recent-time window.

## Edge Cases

- Legacy records with no created_at remain readable and sort below timestamped records in newest-first mode.
- Invalid timestamps are treated like missing timestamps.
- Equal timestamps use full name and then ID for stable ordering.
- Pending-placement records receive the same reveal and highlight behavior.
- Two rapid onboarding actions replace the highlighted ID and restart the timer for the latest record.
- Creation failure does not close the modal or alter the directory.
- Existing row selection, filters, CSV export, menus, pagination, responsive layout, and dark mode must remain functional.

## Implementation Order

1. Add created_at to PersonnelEntity.
2. Timestamp new records in HRController.
3. Return the created DTO from HRController and useHR.
4. Add controlled sort, reveal, and highlight state to HRPersonnelDirectoryPage.
5. Convert PersonnelDirectoryTable to controlled sorting.
6. Add safe created_at comparison.
7. Add the quick-sort selector.
8. Add the reveal-request effect.
9. Add the row highlight and NEW badge.
10. Test success, failure, legacy, and pending-placement paths.
11. Run the production build and regression checks.

## Verification

### Automated

From the frontend directory, run:

    npm run build

Run the project's lint or test commands as well if configured.

### Manual Acceptance Tests

1. Open the directory normally and confirm Name (A to Z).
2. Create a full personnel account and confirm it appears first on Page 1.
3. Save a Pending Placement record and confirm the same reveal behavior.
4. Start with search and all filters active; onboard a record and confirm it becomes visible.
5. Start from Page 2; onboard a record and confirm the table returns to Page 1.
6. Confirm the emerald highlight and NEW badge disappear after eight seconds.
7. Test every quick-sort option.
8. Test every sortable column header and confirm selector synchronization.
9. Reload and confirm created_at persists.
10. Confirm legacy records without timestamps load and sort safely.
11. Confirm equal timestamps produce deterministic ordering.
12. Simulate creation failure and confirm no false success behavior.
13. Recheck selection, CSV export, actions, filters, pagination, responsive layout, and dark mode.

## Acceptance Criteria

- New personnel records persist an ISO-formatted created_at value.
- The creation workflow returns the new record's stable ID.
- Successful onboarding opens the directory, selects newest-first, clears hiding filters, and resets Page 1.
- The created row shows a subtle NEW state for eight seconds.
- Pending-placement records behave consistently.
- Normal directory entry remains Name (A to Z).
- Quick-sort and header sorting remain synchronized.
- Legacy records are not incorrectly marked as new.
- The frontend production build completes without errors.
