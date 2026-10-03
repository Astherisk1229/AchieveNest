# PLAN 10 — Phase 5 Mutation Refresh & Failure Matrix
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Post-Mutation Refresh & Failure Invariants

| Mutation Trigger | Success Invariant | Failure Handling | Duplicate Protection |
|---|---|---|---|
| **Password Reset Confirmed** | Backend returns 200 -> toast emitted -> `fetchStudentAccounts()` refetches server population. | Toast displays error -> modal remains open for retry -> table remains usable. | Button disabled during in-flight request (`isSubmitting=true`). |
| **Reset Request Approved** | Backend returns 200 -> request marked approved -> pending badge count decrements. | Error toast emitted -> request remains pending -> table remains usable. | Request row action disabled upon initial click. |
| **Student Account Created** | Backend returns 201 -> Plan 07 modal opens -> `fetchStudentAccounts(true, student)` refreshes table. | Notice banner with "Retry List" button renders -> NO second create call emitted. | Create form submit button disabled during request. |
