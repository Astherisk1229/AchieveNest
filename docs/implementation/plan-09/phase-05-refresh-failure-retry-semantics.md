# PLAN 09 — Phase 5 Refresh Failure & Retry Semantics
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Post-Commit Refresh Failure Scenario

A critical edge case in distributed web applications occurs when a creation transaction commits to the database, but the client experiences a network glitch during the immediate list refetch.

### Failure Classification & Messaging

```text
+---------------------------------------------------------------------------------------------------+
| TRANSACTION STATUS: COMMITTED (HTTP 201 Created)                                                  |
| REFETCH STATUS: FAILED (Network Timeout / HTTP 500 / Connection Dropped)                          |
+---------------------------------------------------------------------------------------------------+
```

### Prohibited UX Anti-Patterns
1. **Never Show**: `"Creation failed"` — This is untruthful because the record committed in the database.
2. **Never Show**: `"Please submit the form again"` — This triggers false duplicate errors (`409 Conflict: Institutional ID already exists`).

### Required Truthful Implementation
1. **Notice Banner**:
   > **Notice:** Student account was created successfully, but the Student Accounts list could not refresh.
2. **Action Button**:
   - `Retry List` (`onClick={() => fetchStudentAccounts(true, lastCreatedStudent)}`)
3. **Execution Safety**:
   - The Retry button invokes `fetchStudents()` **ONLY**. It never invokes `provisionManualStudent()`, ensuring zero duplicate account submissions.
