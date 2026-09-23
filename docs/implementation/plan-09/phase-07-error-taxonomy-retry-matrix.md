# PLAN 09 — Phase 7 Error Taxonomy & Retry Matrix
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Error Taxonomy & Action Guidance

| Error Category | Origin Layer | Trigger Condition | Display Message | Permitted Retry Action | Prohibited Actions |
|---|---|---|---|---|---|
| `VALIDATION_REJECTED` | Server / Client | Invalid format, missing required sex, out-of-range AY | "Please review and correct the highlighted fields." | Fix inputs & resubmit form | Resetting entire form |
| `DUPLICATE_IDENTITY` | Server | Institutional ID or Email already registered | "An account with this Student ID or Email already exists." | Check directory for existing account | Re-submitting same data |
| `INVALID_INSTITUTIONAL_RELATIONSHIP` | Server | Program ID not found or inactive | "The selected program is no longer active." | Refresh catalog & reselect | Silent fallback to random program |
| `TRANSACTION_ROLLED_BACK` | Server | Database write error during multi-table commit | "Account could not be created. No data was saved." | Retry account creation | Leaving partial rows |
| `POST_COMMIT_REFRESH_FAILED` | Client | 201 Created ok, refetch network fails | "Account created successfully, but list could not refresh." | **Retry List ONLY** | **Re-submitting creation** |
| `LIST_RETRIEVAL_FAILED` | Server / Client | Directory list query fails | "Student Accounts could not be loaded." | Retry List query | Showing false empty state |
| `PERMISSION_DENIED` | Server | Non-OSAD role attempts access | "You do not have permission to view Student accounts." | Log in with OSAD Admin account | Bypassing auth check |
| `NETWORK_OUTCOME_UNKNOWN` | Client | Connection dropped before response received | "Outcome could not be confirmed. Check directory before retrying." | Search directory for ID | Auto-resubmitting creation |
