# PLAN 09 — Phase 2 Create/List/Detail Field Mapping Reference
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Authoritative Backend Field Mapping Reference

To prepare for subsequent frontend listing synchronization without field guessing or naming drift, this reference establishes the exact canonical field contracts across **Create Response**, **Authoritative List Endpoint (`GET /api/v1/osad/students`)**, and **Detail Retrieval**.

| Conceptual Meaning | Create Response Field (`POST /manual-student`) | List Endpoint Field (`GET /osad/students`) | Type | Example Value | Notes |
|---|---|---|---|---|---|
| **Canonical Account ID** | `data.id` | `item.id` | String (UUID) | `"e8d4bde1-a83a-4d87-928d-006f78ee6efd"` | Primary key in `profiles` |
| **Institutional ID** | `data.institutional_id` | `item.institutional_id` / `item.student_id` | String | `"2026315391"` | List provides both keys for backward compatibility |
| **Institutional Email** | `data.institutional_email` | `item.email` | String | `"plan09.test@ndmu.edu.ph"` | Normalized `@ndmu.edu.ph` |
| **Full Display Name** | `data.full_name` | `item.full_name` | String | `"Juan Dela Cruz"` | Standardized order |
| **First Name** | `data.first_name` (optional) | `item.first_name` | String | `"Juan"` | |
| **Middle Name** | `data.middle_name` (optional) | `item.middle_name` | String / Null | `"Protacio"` | |
| **Last Name** | `data.last_name` (optional) | `item.last_name` | String | `"Dela Cruz"` | |
| **Sex** | `data.sex` | `item.sex` | String | `"Male"` | Canonical: `Male`, `Female`, `Prefer not to say` |
| **College Code** | `data.college` (derived) | `item.college` / `item.college_code` | String | `"CET"` | e.g. `CET`, `CBA`, `CAS` |
| **College ID** | `data.college_id` (optional) | `item.college_id` | String (UUID) | `"20000000-0000-0000-0000-000000000001"` | Foreign key |
| **College Name** | `data.college_name` (optional) | `item.college_name` | String | `"College of Engineering and Technology"` | |
| **Program Code** | `data.program_code` | `item.program_code` | String | `"BSCS"` | e.g. `BSCS`, `BSIT`, `BSBA` |
| **Program Name** | `data.program` | `item.program` / `item.program_name` | String | `"Bachelor of Science in Computer Science"` | |
| **Program ID** | `data.academic_program_id` | `item.academic_program_id` | String (UUID) | `"30000000-0000-0000-0000-000000000001"` | Foreign key |
| **Year Level** | `data.year_level` | `item.year_level` | String | `"1st Year"` | Canonical: `1st Year` to `5th Year` |
| **Enrollment Status** | `data.enrollment_status` | `item.enrollment_status` | String | `"enrolled"` | Canonical: `enrolled` |
| **Administrative Status** | `data.administrative_status` | `item.administrative_status` / `item.status` | String | `"active"` | `active`, `suspended`, `archived` |
| **Lifecycle Status** | `data.account_lifecycle_status` | `item.account_lifecycle_status` | String | `"pending_first_login"` | Computed via `AccountLifecycleResolver` |
| **Credential Gate** | `data.must_change_password` | `item.must_change_password` | Boolean / Int (1/0) | `true` / `1` | First-login requirement gate |
| **Temporary Credential** | `data.temporary_password` | **NONE (Omitted)** | String | `"Temp#98124!a"` | Emitted ONLY in create response |

---

# 2. Key Observations for Frontend Listing Consumption

1. **Email Key Discrepancy**:
   - Create response returns `institutional_email`.
   - List response returns `email`.
   - Frontend components should accept `item.institutional_email || item.email`.
2. **Student ID Alias**:
   - List endpoint returns both `institutional_id` and `student_id`.
   - Frontend components should accept `item.institutional_id || item.student_id`.
3. **College / Program Properties**:
   - List endpoint includes both short code (`college`, `college_code`, `program_code`) and full names (`college_name`, `program`).
4. **Must Change Password Format**:
   - Backend database stores tinyint (`1` / `0`); create response returns boolean (`true` / `false`); list endpoint returns integer or boolean.
   - Frontend normalization helper should use `Boolean(item.must_change_password)`.
