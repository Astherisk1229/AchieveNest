# PLAN 09 — Phase 7 Error Envelope & Trace Contract
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Canonical Error Response Schema

All error responses emitted by the backend provisioning and listing endpoints follow a standardized, predictable JSON envelope:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Validation failed for one or more fields.",
    "field_errors": {
      "institutional_id": "Student institutional ID must be between 5 and 50 digits.",
      "sex": "Sex must be one of: Male, Female, Prefer not to say."
    }
  }
}
```

---

# 2. HTTP Status Codes & Error Codes

| HTTP Status | Error Code | Example Trigger |
|---|---|---|
| `401 Unauthorized` | `UNAUTHORIZED` | Expired or missing Bearer token |
| `403 Forbidden` | `FORBIDDEN` | Non-OSAD user attempting student account provisioning |
| `409 Conflict` | `DUPLICATE_INSTITUTIONAL_ID` / `DUPLICATE_EMAIL` | Student ID or email already registered |
| `422 Unprocessable Content` | `VALIDATION_FAILED` | Invalid year level, invalid sex, mass-assignment keys |
| `500 Internal Server Error` | `PROVISIONING_FAILED` | Database transaction write failure |
