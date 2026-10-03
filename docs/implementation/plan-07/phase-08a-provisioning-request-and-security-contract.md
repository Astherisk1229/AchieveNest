# AchieveNest Plan 07 — Phase 8A Request & Security Contract
# Provisioning Request, Security & Anti-Abuse Contract

---

## 1. Request-Shape & Mass Assignment Protection

- **Allowlisted Fields**: Only explicit DTO fields are accepted (`institutional_id`, `institutional_email`, `first_name`, `middle_name`, `last_name`, `suffix`, `academic_program_id`, `year_level`, `academic_year`, `sex`).
- **Server Authority**: Fields such as `id`, `account_type`, `status`, `must_change_password`, and `roles` cannot be supplied by clients; they are derived server-side.
- **Payload Sanitization**: Reject nested arrays/objects where scalar strings are required.

---

## 2. Rate Limiting & Anti-Abuse

- **Availability Probing Rate Limit**: 30 email availability checks per 60 seconds per authenticated administrator and source IP.
- **Exceeded Limit Response**: HTTP `429 Too Many Requests` with header `Retry-After: N` and code `AVAILABILITY_RATE_LIMITED`.
- **RBAC & Lifecycle Gate**: Availability checks and provisioning require an active, fully authenticated `osad_admin` or `hr_admin` session (pending-first-login administrators are blocked).
