# PLAN 09 — Error, Retry & Observability Contract
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Canonical Error Taxonomy & Retry Actions

| Category | HTTP Code | Commit Status | Display Message | Safe Retry Action |
|---|---|---|---|---|
| `VALIDATION_REJECTED` | `422` | Uncommitted | "Please review and correct the highlighted fields." | Fix form fields & resubmit |
| `DUPLICATE_IDENTITY` | `409` | Uncommitted | "An account with this Student ID or Email already exists." | Review directory (Do not retry duplicate create) |
| `INVALID_INSTITUTIONAL_RELATIONSHIP` | `422` | Uncommitted | "The selected program or college reference is invalid." | Refresh form & choose active program |
| `TRANSACTION_ROLLED_BACK` | `500` | Rolled Back | "Failed to create student account. No data was saved." | Retry creation safely |
| `POST_COMMIT_REFRESH_FAILED` | `Client` | **Committed** | "Student account created successfully, but list could not refresh." | **Retry List ONLY** (Re-creation prohibited) |
| `LIST_RETRIEVAL_FAILED` | `500` | N/A | "Student Accounts could not be loaded." | Retry List query |
| `PERMISSION_DENIED` | `403` | N/A | "You do not have permission to view or manage Student accounts." | Log in with OSAD Admin account |
| `NETWORK_OUTCOME_UNKNOWN` | `Timeout` | Ambiguous | "Network timeout. Verify if account exists before retrying." | Search directory before resubmitting |

---

# 2. Credential Security & Redaction Standard

- **Temporary Passwords**: Transmitted strictly in the HTTP 201 response body and presented in the Plan 07 credential modal.
- **Log Scans**: 0 plaintext passwords or tokens persisted in `audit_logs` or server log files.
- **Exception Redaction**: Generic safe messages returned to client; zero internal SQL queries or database exception traces leaked.
