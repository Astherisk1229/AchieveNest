# AchieveNest Login Modernization
## Phase 3 — Authentication Architecture & Database Integration Design

**Status:** Architecture design proposed for review
**Mode:** Design-only; no production implementation
**Depends on:** `PHASE_01_AUTHENTICATION_POLICY_IMPLEMENTATION_PLAN.md` and `PHASE_02_CURRENT_AUTH_DATABASE_COMPATIBILITY_AUDIT.md`
**Design date:** 2026-09-21
**Production behavior changed:** None
**Source code changed:** None
**Database changed:** None
**Google Cloud configured:** No

---

## 1. Purpose and authority

This document turns the verified Phase 2 baseline into a target authentication architecture. It defines implementation boundaries and contracts; it does not authorize or perform Google configuration, dependency installation, schema migration, backend/frontend implementation, or deployment.

The design preserves:

- `profiles` as the central AchieveNest identity;
- database-authoritative roles and scopes;
- the existing AchieveNest JWT and `local_auth_sessions` revocation model;
- password login during migration;
- `/auth/me` as the authoritative post-login hydration path;
- post-authentication Personnel role/context switching;
- current lifecycle behavior, including `must_change_password`;
- separation between password recovery and external-identity linking.

Where institutional policy or deployment facts are unavailable, this document records an open decision rather than inventing one.

## 2. Architecture decisions at a glance

| ID | Decision | Status |
|---|---|---|
| ADR-01 | Add a dedicated logical `external_auth_identities` table | Proposed—approve before implementation |
| ADR-02 | Use Google OpenID Connect `sub` as the durable provider key | Finalized by Phase 1 policy |
| ADR-03 | Use verified normalized institutional email only for first-link bootstrap | Finalized by Phase 1 policy |
| ADR-04 | Never auto-create, merge, relink, or assign roles from Google | Finalized by Phase 1 policy |
| ADR-05 | Verify Google ID tokens and hosted domain exclusively on the backend | Finalized by Phase 1 policy |
| ADR-06 | Add `POST /api/v1/auth/google` and return the existing AchieveNest session contract | Proposed |
| ADR-07 | Introduce one verified-local-profile completion boundary shared by password and Google | Proposed |
| ADR-08 | Reuse `LocalTokenService`, `local_auth_sessions`, and `/auth/me` | Finalized from verified compatibility evidence |
| ADR-09 | Keep current bearer-token transport for initial integration; treat safer transport as separate hardening | Proposed scope decision |
| ADR-10 | Never persist Google credentials in local/session storage | Finalized security constraint |
| ADR-11 | Preserve current enrollment/employment authentication semantics until policy changes | Proposed compatibility decision |
| ADR-12 | Add reusable application-level throttling before production rollout | Proposed prerequisite |
| ADR-13 | Author schema work only in the confirmed authoritative runtime migration track | Finalized principle; track confirmation remains open |
| ADR-14 | Keep password reset and Google linking independent | Finalized boundary |

## 3. Target architecture

```text
                         React login UI
                    ┌──────────┴──────────┐
                    │                     │
             password fields      transient Google ID token
                    │                     │
                    ▼                     ▼
          Local credential       Google identity verification
             verification       (signature + claims + domain)
                    │                     │
                    │              provider-link resolution
                    │                     │
                    └──────────┬──────────┘
                               ▼
                    verified local profile ID
                               │
                               ▼
                AuthenticationEligibilityService
                               │
                               ▼
                AuthenticationCompletionService
                    ├─ issue AchieveNest JWT/session
                    ├─ write safe success audit event
                    └─ build normalized auth response
                               │
                               ▼
                         GET /auth/me
                               │
                               ▼
             database roles, assignments, and scopes
```

The trust boundary is the **verified local profile ID**. Credential mechanisms may establish that identity, but neither may assign authorization. Google claims never supply an AchieveNest role, account type, permission, institutional ID, department, program, or scope.

## 4. Component boundaries

### 4.1 `LocalAuthService`

Retains password-specific concerns:

- normalize the submitted institutional email;
- resolve the candidate local profile;
- locate the active local credential;
- verify the password;
- safely audit credential-verification failures;
- call the shared completion service with the verified profile ID.

It must stop issuing sessions/building final login responses directly after the shared boundary is introduced. Password hashes and password-reset logic remain local-auth concerns.

### 4.2 `GoogleIdentityVerificationService`

Accepts the raw Google ID token only long enough to verify it. It must:

- verify the signature against trusted Google signing keys through the approved server library;
- validate `iss`, configured `aud`, `exp`, and any required time constraints;
- require `email_verified = true`;
- require `hd` to match a backend-configured allowed Workspace domain;
- normalize the verified email consistently with local email lookup;
- return a sanitized immutable DTO containing only `subject`, `email`, and `hostedDomain`.

It must not query roles, create links or profiles, issue AchieveNest sessions, update profile data, or retain/log the raw token. The exact Google verification dependency is a Phase 4 implementation decision and must be chosen from Google's supported server-verification approach.

### 4.3 `ExternalIdentityService`

Owns provider-link lookup and mutation:

```text
findByProviderSubject(provider, subject)
findLinkForProfile(profileId, provider)
resolveOrLinkVerifiedIdentity(verifiedIdentity)
touchLastAuthenticatedAt(identityId)
```

It may resolve a profile or create a first link transactionally. It must never create profiles, assign roles, change account types/passwords, clear lifecycle flags, merge identities, silently replace links, or bypass eligibility checks.

### 4.4 `AuthenticationEligibilityService`

Provides one method-independent decision for a profile:

```text
evaluate(profileId, authMethod) ->
  eligible
  pending_first_login
  inactive
  suspended
  archived
  credential_ineligible (password-specific when applicable)
  unavailable
```

Core account eligibility derives from `profiles.status` and the existing lifecycle resolver. Password authentication additionally requires an active `local_auth_credentials` row. Google authentication must not require a usable local password merely to prove identity, but it must preserve `must_change_password` and the existing restricted-next-action behavior.

Student enrollment and Personnel employment status do not currently block login. Initial Google integration preserves that behavior. Making either a login gate requires a later institutional decision applied consistently to every authentication method.

### 4.5 `AuthenticationCompletionService`

Begins only after a credential mechanism has securely established a local profile ID:

```php
completeAuthentication(
    string $profileId,
    string $authMethod,
    bool $rememberMe,
    RequestContext $requestContext
): AuthenticationResult
```

Responsibilities:

1. load the canonical profile;
2. call the eligibility service and fail closed;
3. derive lifecycle state without clearing `must_change_password`;
4. issue an AchieveNest JWT/session through `LocalTokenService`;
5. write a safe method-specific success audit event;
6. return the normalized login response.

It must not verify passwords or Google tokens, create provider links, resolve roles/scopes, or accept frontend-provided account/role values. Roles continue to be resolved through `/auth/me` and `AuthenticatedActorService`.

### 4.6 Existing services retained

- `LocalTokenService`: issuer, JWT lifetime, server-side session hash, validation, and revocation.
- `AuthenticatedActorService`: authoritative profile/role/scope resolution.
- `AuthorizationService` and policy services: backend authorization.
- `AccountLifecycleResolver`: lifecycle semantics, used or wrapped by the new eligibility service.

## 5. Authentication flows

### 5.1 Password flow

```text
POST /api/v1/auth/login
  -> normalize institutional email
  -> rate-limit by endpoint + IP + normalized account key
  -> resolve existing profile
  -> verify active local credential and password
  -> AuthenticationCompletionService(profileId, password, rememberMe, context)
  -> return AchieveNest session contract
  -> frontend GET /api/v1/auth/me
```

Invalid email/password remains enumeration-resistant. Existing password credentials, reset workflow, remember-me TTLs, forced password change, logout, and session revocation remain available.

### 5.2 Google flow

```text
POST /api/v1/auth/google
  -> rate-limit endpoint + IP
  -> GoogleIdentityVerificationService verifies token and claims
  -> apply verified-subject throttling dimension where safe
  -> ExternalIdentityService looks up (google, sub)
     ├─ link exists: resolve its profile; never rematch by email
     └─ no link: controlled first-time link transaction
  -> AuthenticationCompletionService(profileId, google, rememberMe, context)
  -> after success, update last_authenticated_at
  -> return normal AchieveNest session contract
  -> discard Google credential
  -> frontend GET /api/v1/auth/me
```

Google token lifetime and AchieveNest session lifetime are independent. The Google token is not reused for application authorization or continuous session validation.

### 5.3 First-time linking state machine

```text
VERIFIED_GOOGLE_IDENTITY
  |
  +-- link found by (provider, subject)
  |     |
  |     +-- linked profile eligible --> COMPLETE_AUTH
  |     +-- linked profile ineligible -> DENY account-state result
  |
  +-- no subject link
        |
        +-- normalize verified email
        +-- query profiles by exact email
              |
              +-- zero matches -----> GOOGLE_ACCOUNT_NOT_REGISTERED
              +-- multiple matches -> GOOGLE_ACCOUNT_AMBIGUOUS
              +-- exactly one
                    |
                    +-- profile ineligible -> account-state denial; no link
                    +-- profile/provider already linked to another sub
                    |      -> GOOGLE_IDENTITY_CONFLICT
                    +-- eligible and unlinked
                           -> transactional link creation
                           -> COMPLETE_AUTH
```

No path creates a profile. Once a subject link exists, email changes cannot move it to another profile. An email snapshot may be refreshed only after successful authentication and never changes `profile_id` or `provider_subject`.

## 6. Provider identity data model

Proposed logical table: `external_auth_identities`.

| Column | Proposed MySQL shape | Null | Purpose |
|---|---|---:|---|
| `id` | `CHAR(36)` | No | Primary key, matching project UUID convention |
| `profile_id` | `CHAR(36)` | No | FK to `profiles.id` |
| `provider` | `VARCHAR(30)` | No | Stable machine key; initial value `google` |
| `provider_subject` | `VARCHAR(255)` | No | Durable provider identity (`sub`) |
| `provider_email_snapshot` | `VARCHAR(255)` | No | Verified email observed at successful link/auth time; not identity authority |
| `provider_hosted_domain_snapshot` | `VARCHAR(255)` | Yes | Operational snapshot, never authorization authority by itself |
| `link_method` | `VARCHAR(30)` | No | Initial value such as `verified_email_bootstrap` |
| `linked_at` | `DATETIME(6)` | No | Link creation time |
| `last_authenticated_at` | `DATETIME(6)` | Yes | Updated only after successful provider authentication |
| `created_at` | `DATETIME(6)` | No | Row creation time |
| `updated_at` | `DATETIME(6)` | No | Row update time |

Required constraints:

```text
PRIMARY KEY (id)
UNIQUE (provider, provider_subject)
UNIQUE (profile_id, provider)
FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
CHECK/provider application validation: provider = stable supported machine value
```

`UNIQUE(profile_id, provider)` is approved as the safe initial rule: one AchieveNest profile may have at most one Google subject. Supporting multiple identities for one provider requires an explicit future policy and migration.

`ON DELETE CASCADE` is appropriate for physical profile deletion because current normal lifecycle uses status/archive rather than deletion; archival therefore preserves links. A physical-delete policy must still be reviewed before migration approval.

Never store Google/AchieveNest raw tokens, Google access/refresh tokens, passwords, or OAuth secrets in this table. No seed or mass data migration is required; rows arise only from verified first-time linking.

## 7. Linking transaction and concurrency

First-link creation must run in one database transaction on the authoritative runtime database:

```text
BEGIN
  1. Re-query/lock candidate profile and verify exact normalized email.
  2. Re-evaluate local profile eligibility.
  3. Re-query provider+subject and profile+provider links.
  4. If either conflicts, fail closed and roll back.
  5. Insert external_auth_identities row.
  6. Insert GOOGLE_IDENTITY_LINK_CREATED audit event without raw token.
COMMIT
```

The database unique constraints are the final race-condition defense. Duplicate-key outcomes must map to the same safe conflict result after re-reading link state; they must not leak SQL details. Session issuance occurs only after the link transaction commits. If completion subsequently fails, retain the valid identity link but do not update `last_authenticated_at`; audit the controlled failure. This avoids coupling a durable verified link to session-row success while keeping authentication metadata truthful.

## 8. Conflict and account-state behavior

| Condition | Public code | HTTP design | Required behavior |
|---|---|---:|---|
| Invalid signature/issuer/audience/expiry/claim set | `GOOGLE_TOKEN_INVALID` | 401 | Deny; generic text; audit safely |
| `email_verified` false | `GOOGLE_TOKEN_INVALID` | 401 | Deny before lookup |
| Hosted domain not allowed | `GOOGLE_DOMAIN_NOT_ALLOWED` | 403 | Deny before local email lookup |
| No local email match | `GOOGLE_ACCOUNT_NOT_REGISTERED` | 403 | Deny; never provision |
| Multiple local matches | `GOOGLE_ACCOUNT_AMBIGUOUS` | 409 | Deny and require administrator review |
| Subject linked to another profile | `GOOGLE_IDENTITY_CONFLICT` | 409 | Deny; never relink |
| Profile linked to another subject | `GOOGLE_IDENTITY_CONFLICT` | 409 | Deny; never replace |
| Inactive/suspended/archived local profile | matching account-state code | 403 | Deny both methods consistently |
| Throttle exceeded | `AUTH_RATE_LIMITED` | 429 | Generic text; include safe retry guidance |
| Unexpected internal failure | `AUTHENTICATION_FAILED` | 500 | No stack/SQL details |

An authenticated Google identity may be told that no AchieveNest account is registered, but responses must not disclose profile IDs, collision details, roles, admin/Personnel relationships, internal notes, or database errors.

## 9. API contract

### 9.1 Google request

Proposed route:

```http
POST /api/v1/auth/google
Content-Type: application/json

{
  "credential": "<transient-google-id-token>",
  "remember_me": true
}
```

The credential is required and bounded by a conservative request-size limit. `remember_me` affects only the AchieveNest session TTL.

### 9.2 Shared success response

Both password and Google routes should return the current normalized shape:

```json
{
  "data": {
    "access_token": "<achievenest-token>",
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

Roles, permissions, and assignments remain absent from the authentication token contract and are hydrated by `GET /api/v1/auth/me`.

### 9.3 Shared error envelope

```json
{
  "error": {
    "code": "GOOGLE_TOKEN_INVALID",
    "message": "Authentication could not be completed."
  }
}
```

Approved taxonomy for implementation planning:

- `INVALID_CREDENTIALS`
- `GOOGLE_TOKEN_INVALID`
- `GOOGLE_DOMAIN_NOT_ALLOWED`
- `GOOGLE_ACCOUNT_NOT_REGISTERED`
- `GOOGLE_ACCOUNT_AMBIGUOUS`
- `GOOGLE_IDENTITY_CONFLICT`
- `ACCOUNT_INACTIVE`
- `ACCOUNT_SUSPENDED`
- `ACCOUNT_ARCHIVED`
- `PASSWORD_CHANGE_REQUIRED`
- `AUTH_RATE_LIMITED`
- `AUTHENTICATION_FAILED`

User-facing copy remains a UI/UX implementation decision; internal audit reasons may be more specific but must be safe.

## 10. Lifecycle, authorization, and first-login rules

1. Google identity proof does not bypass `profiles.status` or current lifecycle checks.
2. Google authentication does not clear `must_change_password`.
3. A pending-first-login Google user receives the standard session/lifecycle state and remains restricted by `RequiredNextActionFilter` to `/auth/me`, `/auth/change-password`, and `/auth/logout`.
4. Whether Google-authenticated users should eventually be exempt from local-password setup is explicitly out of scope and requires a migration policy.
5. Roles and scopes come only from AchieveNest database records after authentication.
6. Active frontend context is never accepted as an entitlement by the Google endpoint or completion service.
7. HR/OSAD account types retain their current separate workspace behavior; Google does not merge them with Personnel access.

## 11. Same-human admin/Personnel policy

Phase 2 verified globally unique `profiles.email`, distinct admin account types, and Personnel subtype rows for seeded admins. The repository does not encode an institutional answer for a human who legitimately needs both a personal Personnel login and a separate administrative login.

**Open institutional decision—blocking final link policy approval:**

- **Option A:** one human has one profile and multiple approved authorization contexts. This would require validating/changing current account-type and frontend/backend assumptions.
- **Option B:** separate login profiles remain required, each using a distinct institutional email/Google identity because current email and provider uniqueness rules prevent sharing.

Phase 3 recommendation: preserve the current authorization separation, do not merge accounts, and do not let Google infer a model. If this decision is not resolved before initial rollout, only profiles that are unambiguous under the existing one-email/one-profile schema may link; any identified same-human conflict must be denied and handled administratively outside the sign-in flow.

## 12. Throttling and abuse architecture

A reusable rate-limiting component/filter is a production prerequisite. Storage must support atomic counters and expiry in the actual deployment topology; the exact store and thresholds belong to Phase 4 planning.

| Endpoint/event | Dimensions | Behavior |
|---|---|---|
| `POST /auth/login` | endpoint + IP; normalized email keyed through a non-reversible keyed digest | progressive throttle; 429 when exceeded |
| `POST /auth/google` before verification | endpoint + IP | constrain invalid-token floods |
| Google after verification | endpoint + provider + subject keyed digest | constrain replay/conflict probing |
| `POST /password-reset-requests` | endpoint + IP + normalized email digest | supplement existing 24-hour duplicate suppression |
| Identity conflicts | IP + verified subject digest + profile/email digest where safe | prevent conflict probing |

Requirements:

- never store raw passwords/tokens in limiter keys;
- avoid permanent lockout as the initial response, because it enables account denial of service;
- return 429 with generic safe text and, if reliable, `Retry-After`;
- audit threshold events without logging credentials;
- apply limits before expensive verification where possible and after verification for subject-specific abuse;
- define trusted-proxy/client-IP handling before production;
- verify whether an upstream proxy/WAF adds complementary limits; never assume it replaces application controls.

## 13. Session transport and browser security

For the initial Google integration, retain the current AchieveNest bearer JWT in local/session storage to avoid combining Google integration with a system-wide cookie migration. Record this as a **KNOWN SECURITY HARDENING ITEM**, not a claim that JavaScript-readable tokens are ideal.

Hard requirements:

- the Google credential exists only in transient callback/request memory;
- post it once to `/auth/google`, then discard it;
- never place it in localStorage, sessionStorage, cookies managed by application code, URL/query strings, logs, analytics, error objects, or persisted state;
- store only the normal AchieveNest session/user projection after successful exchange;
- preserve current bearer-header CORS/CSRF behavior during this scope.

A separate hardening track should evaluate secure HttpOnly cookie/session transport. If adopted, it must include CSRF, SameSite, Secure, CORS credentials, logout, refresh/expiry, and deployment-origin redesign rather than being slipped into Google implementation.

## 14. Configuration, CORS, CSP, and secrets

Proposed variable names only:

```text
GOOGLE_CLIENT_ID
GOOGLE_ALLOWED_HOSTED_DOMAINS
VITE_GOOGLE_CLIENT_ID
```

- The backend audience value and frontend client ID must refer to the approved browser client, but no live value is committed.
- Allowed domains should be parsed from a backend-configured list and compared exactly after normalization. The actual institutional domain list remains open for verification.
- Development may retain `http://localhost:5173`; staging and production require explicit origins. No authenticated production wildcard.
- Current bearer requests do not require a cookie-CSRF redesign.
- The later UI phase must add only the Google Identity Services CSP origins required by the chosen official integration. Do not broadly weaken CSP.
- No client secret is needed for the basic browser ID-token exchange design; if a later authorization-code flow is chosen, it requires a separate secret/storage/threat-model decision.

## 15. Audit-event architecture

Reuse `audit_logs` and existing safe-context conventions.

| Event | When |
|---|---|
| `GOOGLE_LOGIN_SUCCESS` | AchieveNest session successfully issued after verified link resolution |
| `GOOGLE_LOGIN_FAILURE` | Controlled provider-auth failure not represented by a more specific event |
| `GOOGLE_DOMAIN_REJECTED` | Verified/parsed claim set fails configured hosted-domain policy |
| `GOOGLE_ACCOUNT_UNREGISTERED` | Verified identity has no eligible local profile match |
| `GOOGLE_IDENTITY_LINK_CREATED` | First provider link transaction commits |
| `GOOGLE_IDENTITY_CONFLICT` | Existing subject/profile link prevents safe resolution |
| `GOOGLE_TOKEN_INVALID` | Token verification/claim validation fails |
| `AUTH_RATE_LIMITED` | Any protected auth endpoint exceeds policy |

Safe context may include profile ID when known, `auth_method`, provider key, outcome, safe reason code, IP, user-agent metadata, and timestamp. Never log raw Google or AchieveNest tokens, passwords, OAuth secrets, signing keys, or full decoded token payloads. Minimize email/subject exposure; prefer existing IDs or keyed digests when direct values are unnecessary.

`last_authenticated_at` is operational metadata only and updates after successful Google authentication—not merely token verification or link creation.

## 16. Frontend integration contract

The future UI implementation extends the existing `AuthContext` and `authService`; it must not create a parallel authorization context.

```text
authenticateUser(email, password, rememberMe)
authenticateWithGoogle(credential, rememberMe)
getAuthUser()
logout()
```

Both successful methods store the normal AchieveNest result and call `/auth/me`. The login UI has no role selector. The target visual hierarchy is Google first, a clear “or” divider, then the existing institutional email/password flow.

Required Google UI states:

```text
idle -> opening_google -> verifying_google -> creating_session -> success
  \-> cancelled -> idle
  \-> error -> idle/retry
```

Duplicate submissions are disabled during exchange. Cancellation leaves the user on the login page without a destructive global error. Detailed accessible copy and visual design belong to the UI phase.

## 17. Migration authority and rollout

### 17.1 Authoritative track prerequisite

Phase 2 evidence identifies the current operational runtime as **MySQL/WAMP** and the matching schema artifacts under `backend/database/mysql-defense/migrations`. PostgreSQL/Supabase-oriented CodeIgniter migrations also exist.

**Required team confirmation before Phase 4 authors any migration:**

```text
AUTHORITATIVE CURRENT RUNTIME AND SCHEMA-CHANGE TRACK: MySQL / WAMP
```

Until confirmed, no provider migration should be written. After confirmation, author one migration/rollback in that authoritative mechanism; do not blindly duplicate incompatible migrations into both tracks. The migration must create the table, constraints/indexes/FK/timestamps, and a rollback path. It needs no provider-link seed data or mass backfill.

### 17.2 Rollout order

1. Confirm institutional and migration decisions.
2. Approve Phase 4 implementation plan and threat/test plan.
3. Add backend configuration validation and verification dependency.
4. Add schema/model and concurrency tests.
5. Implement eligibility/completion boundaries while preserving password tests.
6. Implement Google verifier, identity service, endpoint, throttling, and audit events.
7. Stabilize backend contract before adding the frontend button.
8. Pilot with approved accounts, monitor safe metrics, and retain password fallback.

### 17.3 Rollback

Disable/hide Google UI and endpoint while preserving password login, local accounts, passwords, and existing provider links. Do not automatically delete links or rewrite credentials. Provider outage must degrade to the existing password path. Before password login is ever retired, separately approve emergency admin access, provider/Workspace outage handling, recovery, and institutional suspension behavior.

## 18. Required implementation tests

### Google verification and resolution

- valid token; invalid signature; wrong issuer/audience; expired token; invalid time claims;
- `email_verified = false`; missing/wrong `hd`; unapproved domain;
- registered and unregistered account;
- existing subject link; changed provider email with stable subject;
- subject-to-other-profile and profile-to-other-subject conflicts;
- artificial multiple-email-match fail-closed behavior;
- inactive, suspended, archived, and pending-first-login profiles;
- Student, multi-role Personnel, HR Admin, and OSAD Admin;
- remember-me true/false and correct AchieveNest TTL;
- Google credential absent from browser persistence, logs, audit context, and error output.

### Database and concurrency

- unique `(provider, provider_subject)`;
- unique `(profile_id, provider)`;
- foreign-key/deletion behavior;
- two concurrent first-link requests for the same subject/profile;
- duplicate-key normalization to safe conflict response;
- transaction rollback and audit consistency;
- provider lookup and `last_authenticated_at` update only after success.

### Abuse and contracts

- IP/account/subject limiter dimensions and expiry;
- 429 envelope and retry behavior;
- invalid-token flood does not trigger expensive unbounded work;
- error responses do not reveal profile/collision/SQL details;
- audit events contain required safe fields and no secrets.

### Backward compatibility

- valid/invalid password login;
- inactive/suspended/archived password profile;
- `must_change_password` and `RequiredNextActionFilter` behavior;
- remember-me TTL, logout revocation, and `/auth/me` hydration;
- multi-role database resolution and role switching;
- password reset remains independent and unchanged.

## 19. Non-goals

This phase does not implement or approve:

- Google Cloud/client creation or live IDs;
- frontend Google button or script;
- Google verification library installation;
- route/controller/service changes;
- database migration or data backfill;
- rate-limiter implementation;
- cookie-auth conversion;
- provider unlinking/self-service relinking;
- account auto-provisioning or merging;
- Google profile-data synchronization;
- role/account-type inference from Google;
- password removal;
- step-up authentication for sensitive actions.

## 20. Decision record before implementation

### Architecture decisions finalized by policy/evidence

- [x] Google authenticates external identity; AchieveNest authorizes.
- [x] No automatic profile creation, role inference, merging, or silent relinking.
- [x] Google `sub` is the durable key; verified email is bootstrap-only.
- [x] Backend verification and hosted-domain enforcement are authoritative.
- [x] Google tokens never become AchieveNest authorization tokens or persisted frontend state.
- [x] Existing AchieveNest JWT/session and `/auth/me` role resolution are reused.
- [x] Password login and reset remain available and separate.
- [x] `must_change_password` remains enforced during initial coexistence.
- [x] Personnel role switching remains post-authentication.
- [x] Application throttling and safe Google audit events are required before production.

### Proposed technical decisions requiring review approval

- [ ] `external_auth_identities` model, column set, and cascade semantics.
- [ ] Both database uniqueness constraints.
- [ ] Transaction and post-commit session-issuance behavior.
- [ ] `GoogleIdentityVerificationService`, `ExternalIdentityService`, `AuthenticationEligibilityService`, and `AuthenticationCompletionService` boundaries.
- [ ] `POST /api/v1/auth/google` request/response/error contract.
- [ ] Preserve bearer-token transport during initial integration.
- [ ] Preserve current enrollment/employment login semantics.
- [ ] Rate-limiter store, dimensions, thresholds, and trusted-proxy policy.
- [ ] Audit taxonomy and data-minimization rules.

### Institutional/deployment decisions still open

- [ ] Confirm MySQL/WAMP and its migration mechanism as schema-change authority.
- [ ] Confirm approved Google Workspace hosted domain(s).
- [ ] Confirm one-human HR/OSAD-admin versus Personnel account policy.
- [ ] Confirm production/staging frontend origins and CSP deployment policy.
- [ ] Confirm physical profile-deletion/provider-link retention policy.
- [ ] Confirm provider outage, emergency admin access, and long-term password-retirement policy.
- [ ] Decide whether enrollment/employment state should ever become an authentication gate; default is no change.

## 21. Completion criteria

- [x] Target architecture and trust boundaries documented
- [x] Provider model, keys, constraints, and transaction designed
- [x] First-link and conflict behavior defined without auto-provisioning
- [x] Backend token/domain verification boundary defined
- [x] Shared eligibility/completion pipeline defined
- [x] Database-authoritative role behavior preserved
- [x] Password coexistence, reset separation, and first-login behavior preserved
- [x] Throttling, session-transport scope, CORS/CSRF/CSP boundaries documented
- [x] Migration-track prerequisite and rollback documented
- [x] API errors, audit events, frontend contract, and tests defined
- [x] Open institutional decisions explicitly identified
- [x] No source, schema, environment, dependency, Google Cloud, staging, commit, or push change made

## 22. Recommended next phase

After this architecture and its proposed decisions are reviewed—and the migration authority, hosted domains, and same-human admin/Personnel policy are either confirmed or explicitly dispositioned—proceed to:

**Phase 4 — Database & Backend Authentication Foundation Implementation Plan**

Phase 4 should produce a precise, reviewable plan for the authoritative MySQL migration, provider model, Google verification dependency/configuration, service refactor, `/auth/google`, throttling, audit events, and backend tests. Frontend Google UI implementation should wait until the backend contract is stable.
