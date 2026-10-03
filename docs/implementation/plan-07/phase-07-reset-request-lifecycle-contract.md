# AchieveNest Plan 07 — Phase 7 Contract
# Reset Request Lifecycle Contract

---

## 1. Request Lifecycle State Machine

```text
               +----------------------------------+
               |  Public Submission / In-Office   |
               +----------------------------------+
                                |
                                v
               +----------------------------------+
               |             PENDING              |
               | (Queued in OSAD/HR Admin Inbox)  |
               +----------------------------------+
                     /                      \
      Identity Confirmed & Approved    Rejected / Dismissed
                   /                          \
                  v                            v
    +---------------------------+    +---------------------------+
    |         COMPLETED         |    |         REJECTED          |
    | (Temporary Passkey Issued |    | (No Credential Mutation,  |
    | & Sessions Revoked)       |    | Audit Log Stored)         |
    +---------------------------+    +---------------------------+
                  |
                  v
    +---------------------------+
    | PENDING FIRST/NEXT LOGIN  |
    | (must_change_password=1)  |
    +---------------------------+
```

---

## 2. Invariants & Guarantees

1. **Terminal States**: Both `completed` and `rejected` states are final. Re-executing reset on a terminal request is rejected with `422 REQUEST_ALREADY_PROCESSED`.
2. **Coalescing**: Submitting a new public request while a previous request is already in `pending` within 24 hours does not create duplicate entries and returns a generic success message.
3. **Domain Segregation**: OSAD administrators can transition Student requests only; HR administrators can transition Personnel requests only.
