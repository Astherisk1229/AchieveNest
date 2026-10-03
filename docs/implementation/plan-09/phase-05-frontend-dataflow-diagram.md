# PLAN 09 — Phase 5 Frontend Data-Flow Diagram
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Authoritative Frontend Data-Flow

```text
+---------------------------------------------------------------------------------------------------+
| 1. OSADStudentAccountsPage Mount                                                                   |
|    - Trigger: useEffect() on component mount                                                      |
|    - Action: fetchStudentAccounts()                                                               |
|    - State: isLoadingStudents = true, studentsError = null                                         |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+-------------------------------------------------+
| 2. API Request Dispatch                                                                           |
|    - Service: provisioningService.fetchStudents()                                                 |
|    - Endpoint: GET /api/v1/osad/students                                                          |
|    - Stale Protection: fetchSequenceRef.current tracks active sequence                            |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+-------------------------------------------------+
| 3. State Update & Table Rendering                                                                 |
|    - State: serverStudents = result (103+ records), isLoadingStudents = false                     |
|    - Rendering: Maps canonical fields (id, student_id, name, sex, college, program, status)      |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+-------------------------------------------------+
| 4. User Creates Student Account                                                                    |
|    - Modal: AddStudentAccountModal.jsx                                                            |
|    - Action: provisioningService.provisionManualStudent(payload)                                  |
|    - Response: HTTP 201 Created                                                                   |
|    - Presentation: OneTimeCredentialModal displays temporary credentials to administrator         |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+-------------------------------------------------+
| 5. Post-Create Invalidation & Authoritative Refetch                                               |
|    - Trigger: AddStudentAccountModal.onSubmit completion                                          |
|    - Action: fetchStudentAccounts(true, newStudent)                                               |
|    - Success: Updates serverStudents directly from database (N -> N+1)                            |
|    - Exclusion Check: If active filters hide student, displays CreatedExclusionNotice banner       |
|    - Failure: If refetch network error occurs, displays RetryList banner (Zero re-create risk)    |
+---------------------------------------------------------------------------------------------------+
```
