# AchieveNest Plan 07 — Phase 7 Contract
# Reset Transaction & Idempotency Contract

---

## 1. Transaction Atomic Steps

The administrative reset transaction executes the following steps inside a database transaction with exclusive row locks:

1. **Lock & Verify Target Profile**: Acquire `SELECT ... FOR UPDATE` on `profiles`. Verify target account exists and has status `active`.
2. **Lock & Verify Credential Row**: Acquire `SELECT ... FOR UPDATE` on `local_auth_credentials`.
3. **Generate Secure Credential**: Call `ValidationHelper::generateTemporaryPassword()` (16 characters, cryptographically secure).
4. **Store Password Hash**: Compute `password_hash($tempPassword, PASSWORD_DEFAULT)` and persist hash to `profiles` and `local_auth_credentials` with `must_change_password = 1`.
5. **Revoke Active Target Sessions**: Invoke `LocalTokenService::revokeAllSessionsForProfile($targetId, 'admin_password_reset')`.
6. **Update Request Status**: If invoked via request queue, update `password_reset_requests` to `completed` with `processed_by` and `processed_at`.
7. **Audit Log Emission**: Insert non-secret audit log (`AUTH_ADMIN_PASSWORD_RESET_COMPLETED`).
8. **One-Time Envelope Return**: Return one-time plaintext temporary password in standard API response payload.

---

## 2. Idempotency Guarantees

- **No Competing Resets**: Exclusive row locks prevent concurrent reset race conditions.
- **Terminal State Lock**: Re-sending a reset command on an already processed request returns `422 REQUEST_ALREADY_PROCESSED` without generating a new temporary credential or returning previous secrets.
