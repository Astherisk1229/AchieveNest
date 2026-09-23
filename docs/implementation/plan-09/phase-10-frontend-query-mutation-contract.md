# PLAN 09 — Frontend Query & Mutation Contract
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. State Model & Ownership

`OSADStudentAccountsPage.jsx` owns the client-side representation of the server-backed student directory:

```javascript
const [serverStudents, setServerStudents] = useState([])
const [isLoadingStudents, setIsLoadingStudents] = useState(true)
const [studentsError, setStudentsError] = useState(null)
const [refreshFailedAfterCreate, setRefreshFailedAfterCreate] = useState(false)
const [createdExclusionNotice, setCreatedExclusionNotice] = useState(null)
const fetchSequenceRef = useRef(0)
```

---

# 2. Data Synchronization Rules

1. **Initial Mount**:
   - `useEffect` invokes `fetchStudentAccounts()`, querying `provisioningService.fetchStudents()`.
   - Results populate `serverStudents`.
2. **Post-Create Invalidation**:
   - `AddStudentAccountModal.onSubmit` calls `provisioningService.provisionManualStudent(payload)`.
   - Upon HTTP 201 response, `fetchStudentAccounts(true, createdStudent)` is triggered immediately.
   - Refetched server payload updates `serverStudents` from `N` to `N + 1`.
3. **No Fabricated Rows**:
   - The UI never synthesizes mock rows client-side. The table renders exclusively from `serverStudents`.
4. **Stale Response Protection**:
   - Increments `fetchSequenceRef.current` per request. Older, out-of-order responses are dropped.
5. **Post-Commit Refresh Retry**:
   - If refetch fails after a 201 commit, `refreshFailedAfterCreate` renders a notice banner with a "Retry List" button.
   - Clicking "Retry List" calls `fetchStudentAccounts()` only; it **never** re-submits creation.
