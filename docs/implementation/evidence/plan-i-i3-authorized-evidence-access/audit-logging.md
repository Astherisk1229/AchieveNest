# Audit Logging Specification

## 1. Access Audit Schema
When evidence preview or download is executed, an audit entry is recorded:
- `action`: `evidence_preview` | `evidence_download`
- `evidence_id`: Canonical UUID
- `actor_id`: Authenticated user ID
- `actor_role`: Active role during access
- `access_type`: `preview` | `download`
- `allowed`: `true` | `false`
- `reason_code`: Canonical reason code (e.g. `dean_scope_allowed`, `owner_access_allowed`)
- `timestamp`: ISO-8601 UTC timestamp

## 2. Confidentiality Rules
- File bytes, tokens, passwords, and absolute filesystem paths are **never** logged.
