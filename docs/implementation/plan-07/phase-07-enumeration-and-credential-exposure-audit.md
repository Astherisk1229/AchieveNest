# AchieveNest Plan 07 — Phase 7 Audit
# Enumeration & Credential Exposure Audit

---

## 1. Public Endpoint Audit (`POST /api/v1/password-reset-requests`)

- **Timing / Response Discrepancies**: The response payload format and status code (`200 OK` with generic message) are identical whether:
  - An active student account exists.
  - An active personnel account exists.
  - No matching institutional account exists.
  - An inactive or suspended account matches.
  - A duplicate pending request exists within the last 24 hours.
- **Account Disclosures**: Zero profile IDs, names, roles, or existence indicators are returned to unauthenticated callers.

---

## 2. Credential Exposure & Secret Redaction Audit

- **Audit Logs**: Neither temporary passwords, plaintext passkeys, nor previous hashes are logged in `audit_logs` or server application logs.
- **Session Revocation**: Prior active sessions are evicted from active token storage upon reset execution.
- **Single Source of Authority**: Hash is persisted with `local_auth_credentials.must_change_password = 1`.
