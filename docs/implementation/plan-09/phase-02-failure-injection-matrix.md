# PLAN 09 — Phase 2 Failure Injection & Rollback Matrix
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Failure Injection Test Methodology

To formally prove that no partial student records or orphaned relational rows can be created during a faulty transaction, controlled exceptions were injected at every key write stage within the transaction block of `TargetProvisioningController::manualStudent`.

After each test run:
1. The transaction was rolled back via `$db->rollback()`.
2. Direct SQL queries were executed across all 5 user/credential tables:
   - `profiles`
   - `student_profiles`
   - `student_program_enrollments`
   - `profile_roles`
   - `local_auth_credentials`
3. Partial row survival was measured against the target metric of `0`.

---

# 2. Failure Injection Evidence Table

| Failure Injection Point | Tested Scenario | Injected Exception | Rollback Observed? | Partial DB Rows Found | HTTP Status Emitted | Invariant Result |
|---|---|---|---|---:|---|---|
| **Point 1: After `profiles`** | Error occurs immediately after profile row inserted | `INJECTED_FAILURE_AFTER_PROFILE` | Full Rollback | **0** | `500 PROVISIONING_FAILED` | **PASS** |
| **Point 2: After `student_profiles`** | Error occurs after student academic profile inserted | `INJECTED_FAILURE_AFTER_STUDENT_PROFILE` | Full Rollback | **0** | `500 PROVISIONING_FAILED` | **PASS** |
| **Point 3: After `student_program_enrollments`** | Error occurs after active enrollment record inserted | `INJECTED_FAILURE_AFTER_ENROLLMENT` | Full Rollback | **0** | `500 PROVISIONING_FAILED` | **PASS** |
| **Point 4: After `profile_roles`** | Error occurs after student role assignment inserted | `INJECTED_FAILURE_AFTER_ROLE` | Full Rollback | **0** | `500 PROVISIONING_FAILED` | **PASS** |
| **Point 5: After `local_auth_credentials`** | Error occurs after local credential record inserted | `INJECTED_FAILURE_AFTER_AUTH_CREDENTIALS` | Full Rollback | **0** | `500 PROVISIONING_FAILED` | **PASS** |
| **Point 6: Immediately before Commit** | Error occurs after all inserts, right before `transComplete()` | `INJECTED_FAILURE_BEFORE_COMMIT` | Full Rollback | **0** | `500 PROVISIONING_FAILED` | **PASS** |

---

# 3. Post-Failure Side-Effect Audit

For each injected failure, secondary side effects were audited:

1. **Audit Logs**:
   - `ACCOUNT_PROVISIONING_SUCCEEDED` was **NOT** recorded.
   - Failure was safely logged via `logProvisioningFailure()` as `ACCOUNT_PROVISIONING_FAILED` with generic context and zero credential leakage.
2. **Lifecycle Events**:
   - No `provisioned` or `activated` events were persisted in `account_lifecycle_events`.
3. **Frontend Credential Modal**:
   - HTTP 500 error prevents the modal from presenting credentials to the administrator.
4. **Retry Collision Risk**:
   - Because all rows are cleanly rolled back, the same Institutional ID and Institutional Email can immediately be reused in a subsequent valid creation request without triggering false 409 conflict errors.
