# AchieveNest Plan 07 — Phase 6 Evidence
# Password Change Transaction Contract

---

## 1. Transactional Activation Sequence

```text
POST /api/v1/auth/change-password
  │
  ├─ 1. Authenticate Bearer JWT
  ├─ 2. Begin DB Transaction
  ├─ 3. Lock Credential Row: SELECT ... FOR UPDATE
  ├─ 4. Verify Current Temporary Password (password_verify)
  ├─ 5. Check New != Current (Anti-Reuse)
  ├─ 6. Validate New Password Policy (ValidationHelper)
  ├─ 7. Compute password_hash(new_password, PASSWORD_DEFAULT)
  ├─ 8. Update profiles & local_auth_credentials (must_change_password = 0)
  ├─ 9. Revoke All Prior Sessions for Profile
  ├─ 10. Issue Fresh JWT Session Token
  ├─ 11. Insert Non-Secret Audit Log
  ├─ 12. Commit DB Transaction
  │
  ▼
Return HTTP 200 with fresh session material and active account snapshot
```

---

## 2. Concurrency & Failure Invariants

- **Row Lock**: `SELECT * FROM local_auth_credentials WHERE profile_id = ? FOR UPDATE` serializes concurrent submissions.
- **Atomic State**: `must_change_password` flag and `password_hash` commit together.
- **Rollback Guarantee**: If validation fails or database errors occur, the transaction rolls back cleanly without secret exposure.
