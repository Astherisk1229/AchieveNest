# AchieveNest API Contract - Revised Approved Version

## Phases 0-4 Review and Implementation Scope

This document defines the approved API contract and backend authentication/authorization boundary for the current implementation phase.

The implementation is limited to:

- Phase 0 - Foundation schema reconciliation
- Phase 1 - Identity and account architecture
- Phase 2 - Academic/organizational foundation review only
- Phase 3 - Student and Personnel identity separation review only
- Phase 4 - Authentication and authorization foundation

The following areas are explicitly deferred until a later approval:

- Student account provisioning
- Personnel account provisioning
- `.xlsx` and `.csv` roster imports
- Password-reset workflows
- Governance appointments
- Department Secretary assignment
- Program Coordinator assignment
- Organization Moderator assignment
- Dean assignment
- Achievement APIs
- Portfolio APIs
- Event APIs
- Verification workflows
- Evaluation
- Ranking
- Reporting
- General audit APIs
- Academic-structure CRUD APIs

No later-phase routes should be created during this implementation.

## 1. Confirmed System Architecture

```text
React Frontend
      |
      v
Supabase Auth
      |
      v
Supabase Access Token
      |
      v
CodeIgniter 4.7 REST API
      |
      v
Supabase PostgreSQL
```

### React Frontend

Responsible for:

- displaying the login interface
- initiating Supabase Auth login
- maintaining the Supabase client session
- refreshing sessions using Supabase Auth
- sending the current access token to CodeIgniter
- maintaining the currently selected UI role context
- rendering authorized navigation options based on backend data

The frontend is not the source of truth for role assignments, permissions, scopes, account status, or institutional identity.

### Supabase Auth

Responsible for authentication identity, email/password verification, access and refresh tokens, sessions, session refresh, normal logout, and password-related authentication functions.

The Supabase Auth UUID is the stable authentication identifier.

### CodeIgniter Backend

Responsible for verifying access tokens, resolving the authenticated UUID, loading the linked profile, checking account status, loading active roles and scopes, and rejecting unauthorized, suspended, or archived requests.

CodeIgniter remains the authoritative application API.

### Supabase PostgreSQL

Responsible for profiles, application roles, role assignments, academic structure, account lifecycle data, future institutional records, relational integrity, constraints, indexes, and RLS.

## 2. Confirmed Identity Model

```text
auth.users
    |
    v
public.profiles
    |
    v
public.profile_roles
    |
    v
public.roles
```

The application must maintain one authentication identity per person. Specialized responsibilities must not create duplicate login accounts.

Example:

```text
Personnel profile
|- account_type: personnel
|- role: personnel
|- role: program_coordinator
`- role: organization_moderator
```

## 3. Account Type vs Role

Valid `profiles.account_type` values are only:

```text
student
personnel
```

Canonical application roles are:

```text
student
personnel
department_secretary
program_coordinator
organization_moderator
hr_staff
osad_staff
```

HR and OSAD are represented as personnel profiles with the corresponding application role:

```text
HR:   account_type = personnel, role = hr_staff
OSAD: account_type = personnel, role = osad_staff
```

Old frontend mock values such as `user_type = hr_staff` and `user_type = osad_staff` must later be adapted to this model.

## 4. Common API Rules

Base path:

```text
/api/v1
```

Protected requests must send:

```http
Authorization: Bearer <supabase-access-token>
Accept: application/json
Content-Type: application/json
```

`Content-Type` may be omitted for requests without a body.

## 5. Standard Response Envelopes

Default success response:

```json
{
  "data": {}
}
```

When metadata is required:

```json
{
  "data": {},
  "meta": {}
}
```

The `meta` property is optional and must not be added as an empty object unnecessarily.

Error response:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message.",
    "details": {}
  }
}
```

The `details` property may be omitted when no safe details are required.

Errors must not expose credentials, hostnames, API keys, service-role keys, stack traces, SQL queries, internal paths, or unnecessary raw provider errors.

## 6. Error Code Convention

Error codes use uppercase snake case. Approved examples include:

```text
AUTHENTICATION_REQUIRED
MISSING_BEARER_TOKEN
INVALID_ACCESS_TOKEN
EXPIRED_ACCESS_TOKEN
PROFILE_NOT_FOUND
ACCOUNT_UNAVAILABLE
ACCOUNT_SUSPENDED
ACCOUNT_ARCHIVED
ROLE_NOT_ASSIGNED
ROLE_NOT_FOUND
INSUFFICIENT_PERMISSION
SCOPE_ACCESS_DENIED
VALIDATION_FAILED
SERVICE_UNAVAILABLE
DATABASE_UNAVAILABLE
AUTHENTICATION_SERVICE_ERROR
```

## 7. Approved Endpoint Set

Only these endpoints may be implemented during Phases 0-4:

```text
GET /api/v1/health
GET /api/v1/auth/me
```

Do not implement CodeIgniter login, logout, role-context, password-reset, academic-structure, provisioning, governance, portfolio, achievement, verification, event, evaluation, ranking, report, or audit routes during this phase.

## 8. Health Endpoint

### `GET /api/v1/health`

**Authorization:** Public.

**Request:** None.

Expected response:

```json
{
  "data": {
    "service": "AchieveNest API",
    "status": "ok",
    "database": {
      "configured": true,
      "connected": true
    }
  }
}
```

When the database is unavailable, return `503 Service Unavailable`:

```json
{
  "error": {
    "code": "DATABASE_UNAVAILABLE",
    "message": "The database service is currently unavailable."
  }
}
```

The endpoint must never expose connection strings, hostnames, usernames, passwords, raw PostgreSQL errors, or stack traces.

## 9. Authentication Flow

There is no CodeIgniter login endpoint during Phases 0-4.

```text
User enters email/password
        |
        v
React calls Supabase Auth
        |
        v
Supabase validates credentials
        |
        v
Supabase returns authenticated session
        |
        v
React obtains access token
        |
        v
React calls GET /api/v1/auth/me
        |
        v
CodeIgniter validates token and returns application context
```

A valid Supabase login alone does not grant AchieveNest application access. `/auth/me` must independently resolve the linked profile and active authorization records.

## 10. Current Authentication Context

### `GET /api/v1/auth/me`

**Authorization:** Valid Supabase bearer token required.

The endpoint must:

1. Read the bearer token.
2. Verify the access token.
3. Resolve the Supabase Auth UUID.
4. Load the linked `public.profiles` record.
5. Validate the profile lifecycle state.
6. Load active `public.profile_roles` records.
7. Join role information from `public.roles`.
8. Return authoritative identity, account status, roles, and scopes.

Expected response:

```json
{
  "data": {
    "user": {
      "id": "auth-user-uuid",
      "institutional_id": "EMP20210842",
      "institutional_email": "faculty@ndmu.edu.ph",
      "full_name": "Dr. Maria Santos",
      "account_type": "personnel",
      "status": "active",
      "department_id": "department-uuid",
      "degree_program_id": null,
      "must_change_password": false,
      "roles": [
        {
          "role_key": "personnel",
          "scope_type": "university",
          "scope_id": null
        },
        {
          "role_key": "program_coordinator",
          "scope_type": "degree_program",
          "scope_id": "program-uuid"
        }
      ]
    }
  }
}
```

Do not return a backend-generated `active_role_context` during this phase.

Expected errors:

```text
401 AUTHENTICATION_REQUIRED
401 MISSING_BEARER_TOKEN
401 INVALID_ACCESS_TOKEN
401 EXPIRED_ACCESS_TOKEN
403 PROFILE_NOT_FOUND
403 ACCOUNT_SUSPENDED
403 ACCOUNT_ARCHIVED
403 ACCOUNT_UNAVAILABLE
```

## 11. Active Role Context

The approved strategy is:

```text
Client-side UI state
+
Backend validation against authoritative assigned roles
```

Do not add an `active_role_context` column, a role-context session table, or a role-context backend endpoint during this phase.

The selected context changes displayed navigation only. It must not change actual authorization.

If a previously selected role is no longer assigned, the frontend must fall back to a valid role returned by `/auth/me`.

## 12. Authentication Filter

Protected routes must use centralized authentication middleware or an equivalent filter.

For every protected request:

```text
1. Read Authorization header
2. Extract bearer token
3. Verify token
4. Resolve auth.users UUID
5. Load linked profile
6. Validate profile state
7. Load active roles and scopes
8. Attach authenticated context to the request
9. Continue to endpoint authorization
```

Expected filter errors include:

```text
401 MISSING_BEARER_TOKEN
401 INVALID_ACCESS_TOKEN
401 EXPIRED_ACCESS_TOKEN
403 PROFILE_NOT_FOUND
403 ACCOUNT_SUSPENDED
403 ACCOUNT_ARCHIVED
```

## 13. JWT Verification

Before implementation, inspect the actual `AchieveNest-Test` Auth signing configuration.

If supported asymmetric signing keys are in use, use the Supabase JWKS endpoint:

```text
https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
```

Validate at minimum:

```text
signature
issuer
audience
expiration
```

Expected issuer format:

```text
https://<project-ref>.supabase.co/auth/v1
```

Do not merely decode a token and trust its contents. If the project uses legacy/shared-secret signing or requires a signing migration, report that finding for approval rather than changing Auth configuration automatically.

## 14. Authorization Context

The backend should construct an internal request context containing:

```text
user_id
profile_id
account_type
account_status
department_id
degree_program_id
roles[]
scopes[]
```

This context must be derived server-side and must never be accepted from frontend-submitted data.

Authorization must use active `public.profile_roles` joined to `public.roles`. It must not use frontend roles, localStorage, sessionStorage, user metadata, request-body roles, URL role values, or active UI context as an authority source.

## 15. Scope Authorization

The supported scope types are:

```text
university
college
department
degree_program
organization
```

Later protected operations must evaluate:

```text
authenticated profile
+
account state
+
required role
+
assigned scope
+
resource scope
```

Conceptual reusable checks:

```text
isAuthenticated()
hasActiveAccount()
hasRole(roleKey)
hasRoleInScope(roleKey, scopeType, scopeId)
```

Do not duplicate permission logic across controllers.

## 16. Account Status Enforcement

Every protected request must check the current database profile status. Current states are:

```text
provisioned
active
suspended
archived
```

Normal protected access requires `active` unless a future workflow explicitly defines an exception.

A valid JWT must not override a suspended or archived profile. Database status must be checked on every protected request.

## 17. Logout and Session Refresh

No CodeIgniter logout endpoint will be implemented during Phases 0-4.

Supabase Auth manages normal logout, refresh tokens, access tokens, and session refresh. The frontend should sign out through Supabase Auth, clear AchieveNest in-memory context and selected UI role context, then redirect to login.

The system must not claim that normal logout instantly invalidates already-issued JWTs. Security must rely on profile status, active role assignments, scope checks, and token expiration rather than logout alone.

## 18. RLS Position

All existing application tables must keep RLS enabled.

Do not add broad browser-facing policies merely to support the CodeIgniter API. Direct frontend Data API access remains deferred.

## 19. Frontend Migration Boundary

During this phase, do not migrate every UI module. Prepare only the authentication boundary needed to transition from mock authentication and fake local JWT data toward:

```text
Supabase Auth
real access token
GET /api/v1/auth/me
server-authoritative profile and roles
```

Backend responses must use canonical role identifiers and must not return aliases such as `coordinator`, `moderator`, `secretary`, `hr`, or `osad`.

## 20. Deferred Roster Decision

Roster import remains deferred. When implemented later, both formats are approved:

```text
.xlsx
.csv
```

Both formats must use the same canonical fields and validation rules. `.xlsx` is the recommended/default format, while `.csv` remains supported.

## 21. Deferred APIs

Do not implement academic-structure CRUD, governance, account provisioning, password reset, achievements, portfolios, verification, events, evaluation, ranking, reporting, or general audit APIs during this phase.

Confirmed later governance authority remains:

```text
HR
`- Department Secretary

OSAD
|- Program Coordinator
|- Organization Moderator
`- Dean
```

## 22. Current-Phase Test Requirements

Add tests for:

### Health

```text
health succeeds when database is available
health fails safely when database is unavailable
health exposes no secrets
```

### Authentication filter

```text
missing bearer token -> 401
invalid token -> 401
expired token -> 401
valid token -> continue
```

### Profile resolution

```text
valid auth user + profile exists -> success
valid auth user + profile missing -> 403
```

### Account state

```text
active profile -> allowed
suspended profile -> denied
archived profile -> denied
```

### Role loading

```text
only active profile_roles are returned
canonical role keys are returned
scope_type and scope_id are returned correctly
```

### `/auth/me`

```text
returns correct identity
returns correct account type
returns current account status
returns active role assignments
does not trust frontend role values
does not return active_role_context
```

Schema and migration verification must use PostgreSQL-compatible testing or direct verification against `AchieveNest-Test`; SQLite tests alone are insufficient.

The implementation report must distinguish unit tests, integration tests, and live test-database verification.

## 23. Phase Completion Stop Point

Stop once the following are completed:

```text
foundation reconciliation
+
JWT verification
+
authentication middleware
+
profile resolution
+
role loading
+
scope loading
+
account-status enforcement
+
GET /api/v1/auth/me
+
tests
```

The completion report must include:

- changed files
- migrations changed or added
- routes added
- test results
- database verification results
- JWT signing configuration findings
- remaining unresolved issues
- confirmation that `Achievenest` production was not modified

Do not proceed to provisioning, governance, academic structure, achievements, portfolios, or other later phases without another approval.

## 24. Credential Handling

Secrets must not be pasted into source files, committed to Git, written into implementation documentation, printed in test output, or exposed in API responses.

If previously exposed database credentials have not been rotated, handle rotation separately and keep replacement credentials private.

All work must remain against `AchieveNest-Test`. Production project `Achievenest` must remain untouched.
