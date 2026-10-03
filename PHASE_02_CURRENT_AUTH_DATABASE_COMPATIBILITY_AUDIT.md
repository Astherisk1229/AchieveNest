# AchieveNest Login Modernization
## Phase 2 — Current Authentication & Database Compatibility Audit

**Status:** Completed inspection audit
**Mode:** Inspection-only
**Source of truth:** `PHASE_01_AUTHENTICATION_POLICY_IMPLEMENTATION_PLAN.md`
**Audit date:** 2026-09-21
**Production behavior changed:** None
**Source code changed:** None
**Database schema or data changed:** None

---

## 1. Scope and evidence standard

This document records the authentication behavior found in the repository and in the configured local database. It does not design or implement Google Sign-In. Statements that could not be established from code, configuration, schema metadata, or tests are marked **UNVERIFIED**.

The configured database inspected was `achievenest_phase2_restore_test`, not the protected `achievenest_local` database. Its metadata corroborates the MySQL defense migration set, but the state of any production-like or protected database remains **UNVERIFIED**.

## 2. Repository baseline

| Item | Observed state |
|---|---|
| Branch | `reconcile/wamp-current` |
| HEAD | `c71c130114ca9936e0c856ac30451ae2d0e1df13` |
| Working-tree entries before this report | 606 |
| Tracked changed files | 188 |
| Untracked files | 418 |
| Staged files | 0 |
| Unrelated local changes | Yes; extensive tracked and untracked work predates this audit |

Authentication-related pre-existing changes include `backend/app/Controllers/Api/AuthController.php`, `backend/app/Services/LocalAuthService.php`, `backend/app/Services/LocalTokenService.php`, `backend/app/Services/AuthenticatedActorService.php`, `frontend/src/pages/common/LoginPage.jsx`, `frontend/src/services/authService.js`, and related guards/tests. `.gitignore` was already modified and unstaged. This audit did not alter, clean, stage, reset, or reconcile any of that work.

## 3. Project and runtime structure

| Concern | Current evidence |
|---|---|
| Frontend | React 19.2.7, React Router 7.18.1, Axios 1.18.1, Vite 8.1.1, Tailwind CSS 4.3.3; `frontend/package.json` |
| Frontend tests | Vitest; `frontend/package.json` and `frontend/src/**/*.test.*` |
| Backend | CodeIgniter 4.7.x; `backend/composer.json`, local CLI reports 4.7.4 |
| PHP requirement | `^8.2`; `backend/composer.json` |
| JWT library | `firebase/php-jwt` 7.x; `backend/composer.json`, `LocalTokenService` |
| Package managers | npm and Composer |
| Active local driver | MySQLi on MySQL/WAMP; `backend/app/Config/Database.php` and observed CLI connection metadata |
| Multiple database configurations | Yes. MySQL local/default groups, a development group, and PostgreSQL/Supabase-oriented migration/config artifacts coexist |
| Supabase authentication | No current use confirmed. Supabase-named configuration exists, but local authentication is CodeIgniter/MySQL based |

Environment names observed (values intentionally omitted): `CI_ENVIRONMENT`, `ACHIEVENEST_ENV`, `app.baseURL`, `app.forceGlobalSecureRequests`, `AUTH_MODE`, `LOCAL_AUTH_JWT_SECRET`, `LOCAL_AUTH_ISSUER`, `LOCAL_AUTH_AUDIENCE`, `LOCAL_AUTH_ACCESS_TTL_SECONDS`, `LOCAL_AUTH_REMEMBER_TTL_SECONDS`, database group variables, and Supabase variables. `.env.example` contains a change-me JWT-secret placeholder; runtime code rejects an empty secret, but deployment replacement of the placeholder is operationally required.

## 4. Frontend authentication architecture

### 4.1 Login page and UX

`frontend/src/pages/common/LoginPage.jsx` implements `LoginPage`, routed at `/` and `/login` by `frontend/src/App.jsx`.

- The form has institutional-email and password fields, a password visibility control, a “Keep me signed in” control (initially selected), a forgot-password action, submit loading/disabled behavior, and a spinner.
- It has no pre-authentication role/user-type selector, Google button, or OAuth placeholder.
- Page validation checks required fields; `authenticateUser()` additionally requires an `@ndmu.edu.ph` address.
- Authentication failures appear in an alert-style global message. Field-specific inline authentication errors are not implemented.
- The forgot-password modal validates the institutional address and supports Escape/focus placement. A complete keyboard focus trap was not confirmed.
- The page is responsive and uses Tailwind utility styling. Demo-account shortcuts fill email only and do not determine authorization.

### 4.2 State, persistence, and initialization

`frontend/src/context/AuthContext.jsx` exposes `AuthProvider`/`useAuth`. `frontend/src/services/authService.js` stores:

- user/session projection: `achievenest_current_user`;
- access token: `achievenest_access_token`;
- active Personnel role context inside the stored user projection.

“Keep me signed in” uses `localStorage`; otherwise `sessionStorage` is used. On application initialization, the stored bearer token is revalidated through `GET /api/v1/auth/me`; failure clears client state. A storage listener synchronizes logout across tabs. There is no refresh token or client-side token-expiration metadata.

The stored user projection includes account type, roles, scoped role assignments, affiliations, lifecycle/status, and `must_change_password`; it explicitly removes password and temporary-password properties. Because both token and authorization display data are JavaScript-readable, an XSS defect could expose them. The backend does not accept this client projection as authority when its actor/authorization services are used.

### 4.3 API calls and contracts

`frontend/src/services/apiClient.js` uses Axios with base URL `VITE_API_BASE_URL` or `/api/v1`, JSON, a 15-second timeout, and an `Authorization: Bearer <redacted>` interceptor. `withCredentials` is not enabled.

| Function | Request | Body / behavior | Expected result |
|---|---|---|---|
| `authenticateUser` | `POST /auth/login` | `{ institutional_email, password, remember_me }` | `{ data: { access_token, token_type, expires_in, user } }`; then calls `/auth/me` |
| `getAuthUser` / hydration | `GET /auth/me` | Bearer header | Authoritative user, roles, assignments, affiliations |
| logout | `POST /auth/logout` | Bearer header | Server revocation attempted; client storage clears even on network failure |
| forgot/reset request | `POST /password-reset-requests` | `{ institutional_email, reason }` | Generic acknowledgement |
| first-login password change | `POST /auth/change-password` | current/new/confirmation fields as required by service | Fresh token and rehydrated user |

The response interceptor clears storage on HTTP 401. It recognizes `PASSWORD_CHANGE_REQUIRED` and updates the stored lifecycle. Network/API errors are normalized for the UI; performance logging includes method, URL, status, duration, and response size, not bearer-token values.

### 4.4 Protected routes and redirects

`frontend/src/App.jsx` uses `LayoutShell`; `frontend/src/components/security/PermissionRoute.jsx` and `frontend/src/components/common/ActiveRoleGuard.jsx` add permission/context checks. `frontend/src/controllers/RouteAccessController.js`, `frontend/src/utils/permissionResolver.js`, and `frontend/src/utils/roleContext.js` interpret backend-provided account types, roles, and assignments.

| Account type / active role | Current successful-login destination | Evidence |
|---|---|---|
| Student | `/student/dashboard` | `LoginPage.handleSubmit`, `App.jsx` |
| Personnel base role | `/personnel/dashboard` | same; `ActiveRoleGuard` |
| Program Coordinator | `/personnel/dashboard`, then active-context guarded views | `roleContext.js`, `App.jsx` |
| Organization Moderator | `/personnel/dashboard`; scanner/context routes are guarded separately | `roleContext.js`, `App.jsx` |
| Dean | `/personnel/dashboard`; dean workspace requires active `dean` context | `App.jsx`, `DEAN_ROUTES` |
| Department Head | `/personnel/dashboard`; department routes require active context | `App.jsx` |
| HR Admin | `/hr/dashboard` | `LoginPage.handleSubmit`, `App.jsx` |
| OSAD Admin | `/osad/dashboard` | `LoginPage.handleSubmit`, `App.jsx` |

The explicit login redirect map runs before its fallback lifecycle resolver, but `LayoutShell` forces `must_change_password` users to `/change-password`, and backend `RequiredNextActionFilter` blocks other protected API activity. Redirects are frontend-controlled. Personnel role switching is post-authentication and persists only client-side; it does not rewrite JWT claims. Frontend helpers add implied base roles for display/routing, which must not be treated as backend authority.

Client idle handling warns at 13 minutes and logs out at 15 minutes (`frontend/src/hooks/useIdleSession.js`). If the logout request cannot reach the backend, only local state is cleared; the server-side session remains usable until expiry or later revocation.

## 5. Backend authentication architecture

### 5.1 Routes and protection

Routes are defined under `/api/v1` in `backend/app/Config/Routes.php`.

| Route | Controller method | Access control observed |
|---|---|---|
| `POST /auth/login` | `AuthController::login` | Public |
| `POST /auth/logout` | `AuthController::logout` | Bearer consumed if present; idempotent success |
| `GET /auth/me` | `AuthController::me` | Bearer required in controller/service |
| `POST /auth/change-password` | `AuthController::changePassword` | Bearer required; allowed during pending-first-login |
| `POST /password-reset-requests` | `PasswordResetRequestController::submit` | Public |
| `GET /password-reset-requests` | `PasswordResetRequestController::list` | HR/OSAD admin actor and staff role |
| `POST /password-reset-requests/{id}/reset` | `PasswordResetRequestController::reset` | Office/account-type-specific admin authorization |
| `POST /password-reset-requests/{id}/reject` | `PasswordResetRequestController::reject` | Office/account-type-specific admin authorization |

OPTIONS routes exist for these endpoints. There is no global authentication filter: protected controllers resolve their actors. Consequently, repository-wide authorization coverage is dependent on each controller/service and is **UNVERIFIED** without a complete endpoint-by-endpoint review. The global `RequiredNextActionFilter` does enforce pending-first-login restrictions based on exact route aliases/paths.

### 5.2 Password-login trace

```text
POST /api/v1/auth/login
  -> AuthController::login()
  -> LocalAuthService::login()
  -> normalize and validate institutional email
  -> profiles lookup by normalized email
  -> profiles.status / AccountLifecycleResolver checks
  -> local_auth_credentials active credential lookup
  -> password_verify()
  -> LocalTokenService::issueToken()
  -> JWT plus hashed local_auth_sessions row
  -> AUTH_LOGIN_SUCCESS or AUTH_FIRST_LOGIN_SUCCESS audit event
  -> sanitized token/user response
  -> frontend GET /api/v1/auth/me
  -> AuthenticatedActorService database role/scope resolution
```

Login is email-only, trims/lowercases the identifier, validates the exact institutional suffix, and performs a single `profiles.email` lookup. It does not accept institutional ID, username, or account type. Invalid user/password paths use the generic `INVALID_CREDENTIALS` response. Suspended/archived and lifecycle failures have explicit service codes, while `/auth/me` can collapse non-active-token cases into generic invalid authorization.

### 5.3 Passwords and first login

The canonical credential table is `local_auth_credentials`; `profiles.password_hash` remains a nullable legacy duplicate. Verification uses PHP `password_verify()`. Changes and administrative resets use `password_hash(..., PASSWORD_DEFAULT)` and update both locations. `local_auth_credentials.must_change_password` is the canonical first-login flag after later migrations.

New/seeded local accounts may receive temporary/default credentials and `must_change_password = 1`. The global filter permits only `/auth/me`, `/auth/change-password`, and `/auth/logout` until the password is changed. Password change revokes all prior sessions and returns a fresh session. Seeder credential values were not copied into this report.

### 5.4 JWT and session behavior

`backend/app/Services/LocalTokenService.php` uses `firebase/php-jwt` and HS256. Claims are `iss`, `aud`, `sub`, `iat`, `exp`, and `jti`. Roles, permissions, and account type are deliberately absent. The subject is the local profile UUID.

- Default access lifetime: 3,600 seconds.
- Default remember-me lifetime: 28,800 seconds.
- Signing configuration: `LOCAL_AUTH_JWT_SECRET`; issuer/audience/TTL variables listed above.
- Server storage: only SHA-256 token hash, profile ID, issue/expiry/last-seen/revocation fields, IP, and user-agent hash in `local_auth_sessions`.
- Validation verifies signature, issuer, audience, expiry, matching unrevoked session, and current `profiles.status = active`, then updates `last_seen_at`.
- Logout revokes the matching server session. Password change/reset revokes all sessions for that profile.
- **No refresh-token mechanism confirmed.**

This is a hybrid stateless-token/server-revocation design. A future credential verifier can reuse token issuance, but there is no single reusable “complete authentication from verified profile” method: local password verification, lifecycle handling, issuance, response construction, and auditing are currently coupled in `LocalAuthService::login()`.

### 5.5 Actor and authorization resolution

`backend/app/Services/AuthenticatedActorService.php` verifies the session and reloads the active profile. Generic roles are loaded from active `profile_roles`; specialized roles/scopes come from active dean, department-head, program-coordinator, and organization-moderator assignment tables. `AuthorizationService.php` and policy services provide reusable checks, but controller-level checks also exist. Authorization is therefore partially centralized and partially duplicated.

JWT claims alone do not grant roles. Where protected endpoints use these services, database records are authoritative and changing the frontend role context cannot elevate backend access. Full enforcement by every backend endpoint is **UNVERIFIED**.

## 6. Database and account relationships

### 6.1 Authoritative identity model

The configured restored MySQL database and `backend/database/mysql-defense/migrations/000001_identity_and_institutional.sql` show a single login identity table:

```text
profiles.id (CHAR(36), primary key)
├── student_profiles.profile_id (PK/FK, ON DELETE CASCADE)
├── personnel_profiles.profile_id (PK/FK, ON DELETE CASCADE)
├── local_auth_credentials.profile_id (PK/FK, ON DELETE CASCADE)
├── profile_roles.profile_id (FK, ON DELETE CASCADE)
├── local_auth_sessions.profile_id (FK, ON DELETE CASCADE)
└── specialized assignment tables -> profiles / institutional scopes
```

`profiles` contains globally unique `institutional_id` and `email`, plus `account_type`, name data, status, timestamps, and a nullable legacy password hash. No `deleted_at` field or profile soft-delete behavior was found. Archived access is represented by status and is rejected by login/session verification.

The MySQL migration initially contains `profiles.must_change_password`; the configured database places the canonical flag on `local_auth_credentials` after subsequent migrations. This is documented migration evolution, but dual password columns remain a drift/consistency risk.

### 6.2 Account types and roles

- Student: `profiles.account_type = student` plus one-to-one `student_profiles`; central profile status controls authentication, while enrollment status is profile/domain data and is not consulted by `LocalAuthService::login()`.
- Personnel: `profiles.account_type = personnel` plus one-to-one `personnel_profiles`; employment status is not checked by password login. Thus an active profile with a non-current employment state can authenticate unless another lifecycle process changes `profiles.status`.
- Program Coordinator: active rows in `program_coordinator_assignments`, scoped to an academic program; not a separate login.
- Organization Moderator: active rows in `organization_moderator_assignments`, scoped to an organization; multiple scoped assignments can be returned, while each organization's active-guard constraint governs active occupancy.
- Dean: active `dean_assignments`, scoped to a college; a Personnel authorization context, not a separate account type.
- Department Head: active `department_head_assignments` when the table exists; a Personnel authorization context.
- HR Admin and OSAD Admin: rows in the same `profiles` table with distinct `account_type` values and `hr_staff`/`osad_staff` roles. They are routed to dedicated workspaces and are rejected from the Personnel portal by frontend guards.

`LocalDefenseAuthSeeder.php` also creates `personnel_profiles` subtype rows for `personnel`, `hr_admin`, and `osad_admin`. This means admin identities can carry Personnel-shaped profile data, but current frontend account-type rules do not let an admin identity switch to ordinary Personnel authorization. There is no explicit same-human identity-link table. Because `profiles.email` is globally unique, distinct admin and Personnel login rows cannot share the same email; coexistence for one human would require different institutional emails or a future explicit identity model. Whether the institution actually issues such separate addresses/accounts is **UNVERIFIED**.

### 6.3 Roles and status precedence

Roles are normalized through `roles` and `profile_roles`, with specialized scoped assignment tables. Multiple active roles/scopes can coexist. `AuthenticatedActorService` resolves them after authentication. Current role selection is client-side workspace context only; backend permissions continue to derive from the actor's database assignments.

Authentication precedence is:

1. `profiles.status` must permit authentication (`active`; suspended/archived/inactive are denied).
2. A `local_auth_credentials` row must exist with credential status `active`.
3. Password must verify for password login.
4. `must_change_password` selects pending-first-login versus normal active behavior.
5. Student enrollment and Personnel employment statuses do not independently block login in the traced service.

No failed-attempt counter, timed account lock, CAPTCHA, or administrator unlock workflow was found. Although credential status supports `locked`, no repeated-failure mechanism was found that sets it.

### 6.4 Email determinism and provider storage

Email is database-unique globally in `profiles`, and login normalizes case before querying. Therefore a verified institutional email maps deterministically to at most one current local profile in this schema. However:

- no Google/provider name, provider subject (`sub`), link timestamp, or provider-email snapshot storage exists;
- no immutable external identity can be linked without schema work;
- email-only matching cannot satisfy durable identity or link-preservation rules by itself;
- protected/production database constraint parity is **UNVERIFIED**.

### 6.5 Migration drift

Two database tracks coexist. CodeIgniter application migrations include PostgreSQL/Supabase-oriented constructs (`public`, UUID/auth-user relationships, RLS-oriented artifacts), while `backend/database/mysql-defense/migrations/*.sql` and the configured restore database represent the WAMP/MySQL runtime. `password_reset_requests` is a concrete example whose older application migration shape differs from the current MySQL/controller contract. Phase 3 must first declare the authoritative migration path and reconcile drift planning without running migrations in this phase.

## 7. Reset, logout, throttling, CORS, CSRF, and logging

### 7.1 Password reset/recovery

The reset flow is administrative, not token-based self-service:

```text
public request with institutional email
  -> normalized profile lookup
  -> generic response for missing/inactive/existing-recent request
  -> pending password_reset_requests row
  -> HR handles Personnel; OSAD handles Student
  -> admin reset generates one-time temporary password
  -> hashes credential, sets must_change_password
  -> revokes all sessions
  -> marks request completed
  -> temporary password returned once to authorized admin
```

There is no recovery token/code, expiry/verification endpoint, or automated email delivery. Submission suppresses account existence and limits duplicate pending requests per email to one within 24 hours. That is workflow deduplication, not general login or IP throttling. Handling of admin-account recovery (as opposed to Student/Personnel) is **UNVERIFIED** from the controller branches.

### 7.2 Logout

Frontend logout calls the backend, clears both storage locations, and resets context. The backend hashes the bearer token and revokes its `local_auth_sessions` row. No cookie or refresh token needs clearing. An unreachable backend leaves the token server-valid until expiry even though the browser copy is removed. A dedicated logout audit event was not found; session revocation data records the state change.

### 7.3 Throttling and lockout

**No application-level authentication throttling confirmed.** No login IP/account throttle, failed-attempt counter, progressive delay, CAPTCHA, or automatic lockout was found. Password-reset duplicate suppression is the only auth-adjacent rate control observed. Reverse-proxy/WAF throttling is **UNVERIFIED**.

### 7.4 CORS and CSRF

`backend/app/Config/Cors.php` allows `http://localhost:5173`, methods GET/POST/PUT/PATCH/DELETE/OPTIONS, and headers Accept/Authorization/Content-Type/Origin/X-Requested-With; credentials are false and max age is 7,200 seconds. CORS is applied to `api/*` in `backend/app/Config/Filters.php`.

The API uses bearer tokens rather than authenticated cookies. CodeIgniter's CSRF alias/config exists, but the global CSRF filter is disabled. That is consistent with the current bearer-header contract, although JavaScript-readable token storage increases XSS impact. Deployed frontend/backend origins and Google-hosted script/CSP requirements remain **UNVERIFIED**.

### 7.5 Audit logging and errors

`audit_logs` records actor profile ID, event code/category, target, outcome, IP, user agent, JSON details/safe context, and timestamp. `LocalAuthService` records login success, first-login success, and failure; password change/reset lifecycle events are also recorded. Passwords and full bearer tokens were not found in these auth-event payloads. Google-specific events are absent, as expected.

Login uses generic invalid-credential messaging for unknown email and bad password, reducing enumeration. Password-reset submission also returns a generic message for eligible/ineligible/recent-pending cases. Validation errors (such as a non-institutional domain), explicit suspended/archived codes, and `/auth/me` invalid-token responses remain distinguishable by design. Unhandled exception leakage in production depends on CodeIgniter environment/error configuration and is **UNVERIFIED**.

## 8. Successful login response contract

Sanitized logical contract from `AuthController::login()` / `LocalAuthService::login()`:

```json
{
  "data": {
    "access_token": "<redacted>",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": "<profile-uuid>",
      "institutional_id": "<redacted>",
      "institutional_email": "user@ndmu.edu.ph",
      "account_type": "student|personnel|hr_admin|osad_admin",
      "status": "active",
      "lifecycle_state": "active|pending_first_login",
      "must_change_password": false
    }
  }
}
```

The frontend then obtains roles, assignments, and affiliations from `/auth/me`. No refresh token or backend redirect hint is returned. Exact error-envelope consistency across every authentication failure is **UNVERIFIED**; observed controllers generally use `{ "error": { "code", "message" } }` while success payloads use `data`.

## 9. Phase 1 compatibility matrix

| # | Phase 1 requirement | Current state | Compatibility | Evidence | Required later action |
|---:|---|---|---|---|---|
| 1 | Google authenticates; AchieveNest authorizes | Google absent; local DB authorizes | NOT APPLICABLE YET | `AuthenticatedActorService`, `AuthorizationService` | Preserve DB authorization in Google path |
| 2 | No Google auto-provisioning | No Google path | NOT APPLICABLE YET | repository search | Enforce explicit no-create behavior |
| 3 | Existing eligible account required | Password path requires existing profile | NOT APPLICABLE YET | `LocalAuthService::login` | Apply same rule to Google |
| 4 | Backend verifies Google ID token | Not implemented | GAP | no verifier/dependency found | Design backend verification |
| 5 | Server enforces Google domain | Only password email domain is server-enforced | GAP | `LocalAuthService`, `ValidationHelper` | Validate verified token claims server-side |
| 6 | Google/frontend cannot assign roles | Current roles come from DB | COMPATIBLE | `AuthenticatedActorService` | Preserve |
| 7 | Roles/permissions from AchieveNest | Database lookup after token validation | COMPATIBLE | actor/authorization services | Preserve and test all endpoints |
| 8 | Google `sub` is durable key | No provider storage | GAP | schema/migration inventory | Decide provider-identity storage |
| 9 | Email only bootstraps first link | No link flow exists | GAP | no provider-link code | Specify one-time deterministic linking |
| 10 | Existing links never silently replaced | No links exist to replace | COMPATIBLE | schema inventory | Add uniqueness/conflict guarantees |
| 11 | Local status enforced | Login and session validation recheck profile | COMPATIBLE | lifecycle resolver/token service | Reuse for Google |
| 12 | Google token not authorization token | AchieveNest already issues its own JWT | COMPATIBLE | `LocalTokenService` | Exchange verified identity for local session |
| 13 | AchieveNest issues session/JWT | Implemented with revocable JWT sessions | COMPATIBLE | `LocalTokenService`, `local_auth_sessions` | Reuse issuance safely |
| 14 | Password remains during migration | Full password flow exists | COMPATIBLE | routes/services/frontend | Preserve during rollout |
| 15 | Auth methods converge post-verification | Issuance reusable, completion pipeline coupled to password login | PARTIALLY COMPATIBLE | `LocalAuthService::login` | Extract/design shared completion boundary |
| 16 | Safely audit authentication | Local events exist; Google events do not | COMPATIBLE | `audit_logs`, `LocalAuthService` | Extend event taxonomy without secrets |

Matrix counts: **Compatible 8; Partially compatible 1; Conflicts 0; Gaps 4; Not applicable yet 3; Unverified 0.**

## 10. Classified findings

### AUTH-01 — Provider identity storage
**Category:** Identity linking · **Severity:** HIGH
**Current behavior:** No durable provider identity is stored.
**Evidence:** MySQL schema/migrations and repository search contain no provider/Google subject mapping.
**Phase 1 impact:** Rules 8–10 cannot be implemented with email alone.
**Recommended next-phase action:** Evaluate a dedicated, uniqueness-constrained provider-identity model without changing local profile identity semantics.

### AUTH-02 — First-time account linking
**Category:** Identity linking · **Severity:** HIGH
**Current behavior:** No link/conflict/relink flow exists.
**Evidence:** No Google/OIDC endpoint or linking service found.
**Phase 1 impact:** Eligibility, no-auto-provisioning, and immutable-link behavior need explicit design.
**Recommended next-phase action:** Specify verified-claim validation, eligible-profile lookup, transactional link creation, and conflict responses.

### AUTH-03 — Email uniqueness / ambiguity
**Category:** Database compatibility · **Severity:** MEDIUM
**Current behavior:** `profiles.email` is globally unique, making a normalized email deterministic in the inspected schema; distinct HR/OSAD and Personnel rows cannot share it. Protected-database parity and institutional same-human account policy are **UNVERIFIED**.
**Evidence:** `000001_identity_and_institutional.sql`; configured database metadata.
**Phase 1 impact:** Bootstrap matching is technically deterministic, but administrative/personal identity expectations must be settled.
**Recommended next-phase action:** Confirm authoritative deployed constraints and institutional account-separation policy.

### AUTH-04 — Local account-status enforcement
**Category:** Lifecycle · **Severity:** MEDIUM
**Current behavior:** Central profile and credential states are enforced; enrollment/employment status is not part of login.
**Evidence:** `LocalAuthService`, `LocalTokenService`, `AccountLifecycleResolver`.
**Phase 1 impact:** Google must use identical lifecycle rules; business-status precedence needs an explicit decision.
**Recommended next-phase action:** Define one reusable eligibility check and decide whether subtype status participates.

### AUTH-05 — Role source of truth
**Category:** Authorization · **Severity:** LOW
**Current behavior:** Backend roles/scopes come from local database records; JWT has no role claims. Frontend has cached/implied display roles.
**Evidence:** `AuthenticatedActorService`, `roleContext.js`, `authService.js`.
**Phase 1 impact:** Fundamentally compatible, provided every sensitive endpoint resolves the actor.
**Recommended next-phase action:** Preserve backend authority and inventory endpoint enforcement before implementation.

### AUTH-06 — Multi-role Personnel behavior
**Category:** Authorization · **Severity:** LOW
**Current behavior:** Multiple scoped assignments coexist; role switching is post-auth client context and does not change backend entitlements.
**Evidence:** assignment tables, `roleContext.js`, `ActiveRoleGuard`.
**Phase 1 impact:** Compatible with one authenticated identity and post-auth role choice.
**Recommended next-phase action:** Keep Google outside role selection; test multi-scope responses.

### AUTH-07 — OSAD/HR administrative separation
**Category:** Account modeling · **Severity:** MEDIUM
**Current behavior:** Admin account types/workspaces are separate, but all share `profiles`; seed data gives admins Personnel subtype rows. Same-email dual login rows are impossible.
**Evidence:** `App.jsx`, `roleContext.js`, `LocalDefenseAuthSeeder.php`, unique email constraint.
**Phase 1 impact:** Authorization contexts are separated, but same-human identity policy is not encoded.
**Recommended next-phase action:** Decide whether one human has one profile with contexts or distinct profiles/addresses before linking design.

### AUTH-08 — JWT/session compatibility
**Category:** Session security · **Severity:** LOW
**Current behavior:** Revocable AchieveNest JWT session with database status revalidation; no refresh token.
**Evidence:** `LocalTokenService`, `local_auth_sessions`.
**Phase 1 impact:** Strongly reusable for Google exchange; issuance must follow provider verification and local eligibility.
**Recommended next-phase action:** Design a shared post-verification issuance service and decide whether refresh remains out of scope.

### AUTH-09 — Password migration compatibility
**Category:** Migration · **Severity:** MEDIUM
**Current behavior:** Password login is functional and can coexist, but login completion is coupled to password verification and duplicate password columns remain.
**Evidence:** `LocalAuthService`, `profiles`, `local_auth_credentials`.
**Phase 1 impact:** Coexistence is feasible; convergence needs refactoring design, not removal.
**Recommended next-phase action:** Preserve routes and design a shared completion boundary; identify canonical credential fields.

### AUTH-10 — Audit logging
**Category:** Observability · **Severity:** LOW
**Current behavior:** Local successes/failures and credential lifecycle actions are logged with safe context; no Google events exist.
**Evidence:** `LocalAuthService`, `audit_logs`.
**Phase 1 impact:** Existing facility can likely support Google events.
**Recommended next-phase action:** Define provider event codes and redaction rules; never log ID tokens.

### AUTH-11 — Rate limiting
**Category:** Abuse resistance · **Severity:** HIGH
**Current behavior:** No application-level login throttling or failed-attempt lockout confirmed; reset queue only deduplicates requests for 24 hours.
**Evidence:** auth filters/services/controllers and repository search.
**Phase 1 impact:** Password and future Google endpoints would lack application-layer abuse controls.
**Recommended next-phase action:** Make endpoint/IP/account throttling a prerequisite design decision; verify proxy controls.

### AUTH-12 — Error normalization
**Category:** API contract · **Severity:** MEDIUM
**Current behavior:** Enumeration-sensitive flows are generic, but lifecycle/validation codes vary and complete cross-controller envelope consistency is **UNVERIFIED**.
**Evidence:** `AuthController`, `LocalAuthService`, `PasswordResetRequestController`.
**Phase 1 impact:** Google failures need stable, non-enumerating codes compatible with the frontend.
**Recommended next-phase action:** Define a common auth success/error contract and test it.

### AUTH-13 — Frontend token storage
**Category:** Client security · **Severity:** HIGH
**Current behavior:** Bearer JWT and user/role projection are stored in local/session storage.
**Evidence:** `authService.js`, `AuthContext.jsx`, `apiClient.js`.
**Phase 1 impact:** Google tokens must never be persisted similarly; XSS can expose the AchieveNest token.
**Recommended next-phase action:** Explicitly prohibit storing Google ID tokens and evaluate the local session transport in architecture design.

### AUTH-14 — CORS / CSRF implications
**Category:** Web security · **Severity:** MEDIUM
**Current behavior:** Localhost-only CORS, no credentials, bearer headers, and no global CSRF filter. Deployment origins are **UNVERIFIED**.
**Evidence:** `Cors.php`, `Filters.php`, `apiClient.js`.
**Phase 1 impact:** Current model can accept a Google credential payload, but production origin/CSP/transport policy must be specified.
**Recommended next-phase action:** Define environment-specific origins and revisit CSRF only if cookie sessions are chosen.

### AUTH-15 — Recovery / reset implications
**Category:** Recovery · **Severity:** MEDIUM
**Current behavior:** Admin queue issues a temporary local password; there is no email token flow. Admin-account recovery is **UNVERIFIED**.
**Evidence:** `PasswordResetRequestController`, `LocalAuthService::adminResetPassword`.
**Phase 1 impact:** Google must not silently become local-password recovery or account linking.
**Recommended next-phase action:** Keep recovery and provider linking separate; define behavior for Google-linked users who retain fallback passwords.

## 11. Direct compatibility answers

### Database questions

1. **Single authoritative authentication table?** `profiles` is the central identity table; credentials and sessions are one-to-one/one-to-many supporting tables.
2. **Student and Personnel linked to it?** Yes, by shared-PK foreign keys.
3. **OSAD/HR in it?** Yes, as distinct `account_type` values.
4. **One email to multiple accounts?** Not in the inspected MySQL schema; global unique constraint.
5. **Database uniqueness?** Yes for `profiles.email` and institutional ID.
6. **Multiple roles?** Yes, generic and specialized scoped assignments.
7. **Normalized roles?** Yes, `roles`/`profile_roles`; specialized governance roles use assignment tables.
8. **Admin roles separate?** Separate account types/workspaces, with staff roles; all share central identity storage.
9. **External provider storage?** No.
10. **Stable provider ID without schema change?** No confirmed field can store provider `sub` without overloading identity semantics.
11. **Statuses centralized?** Login status is principally `profiles.status` plus credential status/lifecycle flag; subtype business statuses also exist.
12. **Soft-deleted accounts authenticate?** No soft-delete field found; archived status is rejected.
13. **Lifecycle consistently enforced?** Auth path yes; all repository endpoints **UNVERIFIED**.
14. **Deterministic verified-email match?** Yes in inspected schema; deployed parity remains **UNVERIFIED**.

### Authentication questions

1. Password login produces an AchieveNest JWT plus server-side revocation record.
2. Token issuance can be reused, but should be wrapped by a shared completion service.
3. Post-login actor resolution is centralized in `/auth/me`; login completion itself is not fully centralized.
4. Role checks are partly centralized and partly controller-level.
5. Core authentication status checks are reusable; subtype-status policy is not unified.
6. Redirects are frontend-controlled.
7. Role claims are not trusted because they are absent; token/session/profile are revalidated.
8. Successful backend logout revokes authorization immediately; failed network logout does not.
9. Frontend uses cached role data for UX, but protected backend authority should come from DB resolution.
10. Convergence is feasible after a shared verified-profile completion boundary is designed.

### Google readiness questions

1. A future route logically belongs under `/api/v1/auth` beside `AuthController`, but exact controller design is a Phase 3 decision.
2. Existing token, actor, lifecycle, and audit services are reusable after Google credential verification.
3. No complete reusable post-authentication completion method exists yet.
4. Provider identity storage is missing.
5. Inspected email uniqueness supports controlled bootstrap matching.
6. Admin/Personnel ambiguity is constrained technically by global email uniqueness but unresolved institutionally for same-human separate access.
7. Existing JWT/session issuance can be reused.
8. Audit storage can accommodate new event codes without a demonstrated schema change.
9. Localhost CORS supports current local frontend/backend use; deployed origins are **UNVERIFIED**.
10. Before Google Cloud setup: settle identity-link schema, same-human admin policy, authoritative migration track, shared completion contract, production origins, throttling, and standardized errors.

## 12. Test coverage

Observed backend CodeIgniter feature tests include `Phase8Step2AuthE2ETest.php`, `AuthMeEndpointTest.php`, `PasswordResetRequestTest.php`, `AdminAuthorizationAndIntegrityTest.php`, and `PersonnelRoleEndpointTest.php`. They cover anonymous/invalid bearer rejection, institutional reset validation, password-change access constraints, temporary-password properties, reset-office authorization, and parts of role integrity.

Observed frontend Vitest coverage includes local-defense auth service, password reset, API-client behavior, role context, permission resolution, first-login recovery, and change-password flows.

Confirmed gaps or **UNVERIFIED** coverage:

- no Google/OIDC tests (expected);
- no login throttling/lockout tests because the control was not found;
- no refresh-token tests because no refresh mechanism exists;
- end-to-end tests for successful login, logout revocation, suspended/archived accounts, simultaneous multi-role scopes, and network-failed logout are incomplete or not confirmed across both layers;
- no proof that every protected backend route invokes authoritative actor checks;
- no tests against the protected/deployed database schema were run in this audit.

No test suite was executed because this phase is inspection-only and the working tree contains substantial unfinished changes; test files and contracts were inspected without generating runtime artifacts.

## 13. Evidence appendix

### A. Frontend files inspected

- `frontend/package.json`
- `frontend/src/App.jsx`
- `frontend/src/pages/common/LoginPage.jsx`
- `frontend/src/pages/common/ChangePasswordPage.jsx`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/services/apiClient.js`
- `frontend/src/services/authService.js`
- `frontend/src/components/common/ActiveRoleGuard.jsx`
- `frontend/src/components/security/PermissionRoute.jsx`
- `frontend/src/controllers/RouteAccessController.js`
- `frontend/src/hooks/useIdleSession.js`
- `frontend/src/utils/permissionResolver.js`
- `frontend/src/utils/roleContext.js`
- related frontend auth/role Vitest files

### B. Backend files inspected

- `backend/composer.json`
- `backend/app/Config/Routes.php`
- `backend/app/Config/Filters.php`
- `backend/app/Config/Cors.php`
- `backend/app/Config/Database.php`
- `backend/app/Controllers/Api/AuthController.php`
- `backend/app/Controllers/Api/PasswordResetRequestController.php`
- `backend/app/Filters/RequiredNextActionFilter.php`
- `backend/app/Services/LocalAuthService.php`
- `backend/app/Services/LocalTokenService.php`
- `backend/app/Services/AuthenticatedActorService.php`
- `backend/app/Services/AuthorizationService.php`
- `backend/app/Services/AccountLifecycleResolver.php`
- `backend/app/Database/Seeds/LocalDefenseAuthSeeder.php`
- relevant CodeIgniter migrations and auth feature tests

### C. Database objects inspected

`profiles`, `roles`, `profile_roles`, `student_profiles`, `personnel_profiles`, `local_auth_credentials`, `local_auth_sessions`, `password_reset_requests`, `audit_logs`, `account_lifecycle_events`, `dean_assignments`, `department_head_assignments`, `program_coordinator_assignments`, and `organization_moderator_assignments`.

### D. Authentication routes observed

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/change-password`
- `POST /api/v1/password-reset-requests`
- `GET /api/v1/password-reset-requests`
- `POST /api/v1/password-reset-requests/{id}/reset`
- `POST /api/v1/password-reset-requests/{id}/reject`
- corresponding OPTIONS routes

### E. Authentication/security packages observed

- `firebase/php-jwt` 7.x
- CodeIgniter 4.7.x validation, filters, database, and security facilities
- Axios 1.18.1
- React / React Router
- PHPUnit and Vitest

## 14. Completion checklist

- [x] Repository baseline and unrelated local changes recorded
- [x] Frontend page, state, API calls, storage, guards, and redirects mapped
- [x] Backend routes, login trace, JWT/session, filters, errors, and contract mapped
- [x] User/profile, role, account-type, status, and email relationships documented
- [x] Student, Personnel, Coordinator, Moderator, Dean, HR, and OSAD behavior documented
- [x] Reset, first login, logout, refresh, throttling, CORS, CSRF, and logging reviewed
- [x] Driver/platform, migration drift, seeders, and tests reviewed
- [x] Phase 1 matrix and AUTH-01 through AUTH-15 findings completed
- [x] Unknowns marked **UNVERIFIED**
- [x] No production source, configuration, dependency, data, or schema changed

## 15. Final audit summary

### Current Authentication Architecture

AchieveNest currently uses institutional-email/password verification against MySQL credentials, issues an HS256 AchieveNest JWT, tracks its hash in a revocable server-side session table, and rehydrates authoritative identity/roles through `/auth/me`. Frontend state persists in local/session storage. Backend roles and scoped assignments—not email patterns or JWT role claims—are the intended authorization source.

### Database Compatibility

The inspected MySQL model has one central `profiles` identity, globally unique email, linked Student/Personnel subtypes, normalized/scoped roles, credentials, sessions, lifecycle data, and audit logs. It has no provider-identity storage. MySQL defense SQL and PostgreSQL/Supabase-oriented application migrations coexist, so the authoritative migration track must be settled before schema design.

### Phase 1 Compatibility

```text
Compatible: 8
Partially compatible: 1
Conflicts: 0
Gaps: 4
Not applicable yet: 3
Unverified: 0 (within the 16-row matrix; operational unknowns remain in findings)
```

### Highest-Risk Findings

- **AUTH-01 / AUTH-02:** no durable provider link or safe first-link/conflict mechanism.
- **AUTH-11:** no application-level login throttling or failed-attempt lockout confirmed.
- **AUTH-13:** the AchieveNest bearer token is JavaScript-readable; future Google ID tokens must not be persisted there.
- Migration-track drift and unresolved same-human admin/Personnel policy could cause an incorrect provider-link design.

### Google Readiness

**READY WITH PREREQUISITES**

The existing local authorization, lifecycle, JWT, session-revocation, and audit foundations can support architecture design. This is not approval to configure or implement Google.

### Required Phase 3 Decisions

1. Choose the durable provider-identity/link representation and uniqueness/conflict rules.
2. Confirm one-human admin/Personnel identity policy and authoritative deployed email constraints.
3. Declare the authoritative MySQL/PostgreSQL migration track and schema-change mechanism.
4. Define a shared post-credential-verification eligibility/session/audit pipeline.
5. Standardize auth response/error contracts and provider-safe audit events.
6. Decide application/proxy throttling and failed-attempt controls.
7. Confirm production frontend/backend origins, CSP, and session-token transport policy.
8. Keep password recovery, Google linking, and post-auth role switching separate.

## 16. Next exact phase

After review and acceptance of this audit: **Phase 3 — Authentication Architecture & Database Integration Design**. Any **UNVERIFIED** operational or institutional question above must remain open until evidence or an authorized decision is supplied.
