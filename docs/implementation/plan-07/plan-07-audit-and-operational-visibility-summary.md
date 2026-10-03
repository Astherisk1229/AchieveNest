# AchieveNest Plan 07 — Audit & Operational Visibility Summary
## Canonical Audit Event Families & Administrative Visibility Endpoints

---

## 1. Canonical Audit Event Definitions

All Plan 07 operations are tracked in the database tables `audit_logs` and `account_lifecycle_events` using structured JSON safe context with zero secret leakage.

| Event Code (`event_code`) | Category | Trigger / Action | Safe Context Recorded | Secret Exclusion Guarantee |
| :--- | :--- | :--- | :--- | :--- |
| `ACCOUNT_PROVISIONING_SUCCEEDED` | `provisioning` | Manual creation committed | `institutional_id`, `academic_program_id`, `year_level` | Zero temporary passwords or hashes |
| `ACCOUNT_PROVISIONING_FAILED` | `provisioning` | Validation or conflict error | `target_type`, non-secret error details | Zero form passwords or inputs |
| `CREDENTIALS_COPIED` | `credential_delivery` | Admin copies text in modal | `action`, `institutional_id`, `target_role` | Zero clipboard plaintext content |
| `CREDENTIAL_SLIP_PRINTED` | `credential_delivery` | Admin prints slip in modal | `action`, `institutional_id`, `target_role` | Zero print body plaintext |
| `AUTH_FIRST_LOGIN_SUCCESS` | `auth` | First login with temp pass | `auth_mode`, `first_login: true` | Zero submitted password plaintext |
| `AUTH_LOGIN_FAILED` | `auth` | Invalid credentials submitted | `auth_mode`, `failure_code` | Zero attempted password plaintext |
| `AUTH_PASSWORD_CHANGE_COMPLETED`| `security` | Personal password created | `auth_mode` | Zero new/old password plaintext |
| `ACCOUNT_ACTIVATED` | `lifecycle` | Mandatory password gate cleared | `prior_state`, `new_state: active` | Zero password or credential data |
| `AUTH_ADMIN_PASSWORD_RESET_COMPLETED` | `security` | Admin resets temp pass | `auth_mode`, `reason` | Zero new temporary passkey |
| `ACCOUNT_SUSPENDED` | `lifecycle` | Admin suspends account | `reason`, `previous_status`, `new_status` | No secret metadata |
| `ACCOUNT_RESTORED` | `lifecycle` | Admin restores account | `previous_status`, `new_status: active` | No secret metadata |
| `ACCOUNT_ARCHIVED` | `lifecycle` | Admin archives account | `reason`, `previous_status`, `new_status` | No secret metadata |

---

## 2. Operational Visibility Endpoints

### 2.1 OSAD Student Audit Visibility
- **Endpoint**: `GET /api/v1/osad/audit`
- **Authorized Role**: `osad_staff` (`account_type: osad_admin`)
- **Query Parameters**:
  - `page`: Page number (default `1`)
  - `per_page`: Rows per page (default `50`)
  - `profile_id`: Filter by actor or target profile ID
  - `event_code`: Filter by specific event family (e.g. `ACCOUNT_PROVISIONING_SUCCEEDED`)
  - `from_date` / `to_date`: Timestamp range (`YYYY-MM-DD`)
- **Response Format**:
  ```json
  {
    "data": {
      "page": 1,
      "per_page": 50,
      "events": [
        {
          "id": "uuid",
          "event_code": "ACCOUNT_PROVISIONING_SUCCEEDED",
          "target_name": "Juan Dela Cruz",
          "actor_name": "Demo OSAD Admin",
          "outcome": "success",
          "details": "Student account provisioned successfully by OSAD administrator.",
          "safe_context": "{\"institutional_id\":\"2023368\",\"year_level\":\"1st Year\"}",
          "created_at": "2026-09-02 04:26:17.000000"
        }
      ]
    }
  }
  ```

### 2.2 HR Personnel Audit Visibility
- **Endpoint**: `GET /api/v1/hr/audit`
- **Authorized Role**: `hr_staff` (`account_type: hr_admin`)
- **Capability**: Provides paginated access to personnel creation, credential delivery, and status changes.
- **RBAC Protection**: Unauthorized student/personnel sessions receive HTTP `403 FORBIDDEN` or `401 UNAUTHORIZED`.
