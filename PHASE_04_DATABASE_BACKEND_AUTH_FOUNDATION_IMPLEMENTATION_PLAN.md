# AchieveNest Login Modernization
## Phase 4 — Database & Backend Authentication Foundation Implementation Plan

**Status:** Implementation plan proposed for approval
**Mode:** Plan-only; no production implementation
**Depends on:** Approved Phase 3 architecture
**Plan date:** 2026-09-21
**Production behavior changed:** None
**Source code changed:** None
**Database changed:** None
**Dependencies changed:** None
**Google Cloud configured:** No

---

## 1. Objective and non-implementation boundary

This plan converts the Phase 3 architecture into an ordered, test-gated backend/database implementation checklist. It does not create a migration, install a package, change configuration, add a route/service, run a write query, or configure Google Cloud.

Implementation must preserve these invariants:

1. Google proves external identity; AchieveNest authorizes from its database.
2. Google sign-in never creates, merges, relinks, or assigns roles to local profiles.
3. Google `sub` is the durable provider key; verified email is first-link bootstrap only.
4. Existing links are never silently replaced.
5. Local lifecycle status gates every authentication method.
6. Google tokens are transient verification credentials, never application sessions.
7. AchieveNest continues issuing its own revocable JWT/session.
8. Password login/reset and `/auth/me` remain available and compatible.
9. Personnel role switching remains post-authentication.
10. Initial rollout retains bearer-token transport while never persisting Google credentials.
11. Application throttling is required before production enablement.

## 2. Hard prerequisites and stop gates

| ID | Required decision/evidence | Blocks | Gate behavior |
|---|---|---|---|
| PREREQ-01 | Explicitly confirm **MySQL/WAMP** and the exact schema-change runner/path as authoritative | Migration authoring and schema tests | **STOP DATABASE IMPLEMENTATION** if unconfirmed |
| PREREQ-02 | Confirm exact approved Google Workspace hosted domain(s) | Production Google configuration/enablement | Test fixtures may use reserved dummy values only if approved |
| PREREQ-03 | Disposition one-human HR/OSAD-admin versus Personnel identity policy | Ambiguous-human linking policy | Never merge; fail closed until resolved |
| PREREQ-04 | Confirm staging/production frontend origins and CSP deployment policy | Deployment configuration and frontend rollout | Local backend work may proceed |
| PREREQ-05 | Approve provider table, uniqueness, and physical-delete behavior | Provider migration | No schema file before approval |
| PREREQ-06 | Approve Google verification package/version after dependency review | Composer change and verifier implementation | No install before approval |
| PREREQ-07 | Approve limiter store, dimensions, thresholds, and trusted-proxy policy | Production enablement | Endpoint must remain disabled until adequate limiter exists |

Current evidence strongly indicates `backend/database/mysql-defense/migrations` is the WAMP/MySQL track, with numbered SQL files through `000034_*`. That evidence is not the required authority confirmation. Do not reserve or author `000035` until the team verifies no concurrent migration claims that number and approves the mechanism.

## 3. Planned implementation sequence

```text
1.  Reconfirm repository/runtime/database baseline
2.  Freeze migration authority and prerequisites
3.  Implement/test external_auth_identities migration
4.  Implement/test provider identity persistence boundary
5.  Implement/test AuthenticationEligibilityService
6.  Implement/test AuthenticationCompletionService
7.  Refactor/test password login through shared completion
8.  Approve/install Google verification dependency and add config
9.  Implement/test GoogleIdentityVerificationService
10. Implement/test ExternalIdentityService and transactional linking
11. Implement/test POST /api/v1/auth/google
12. Implement/test authentication throttling
13. Extend/test safe audit events
14. Run complete backend regression and manual development checks
15. Review scoped diff, rollback, and security evidence
16. Only then plan frontend/Google Cloud integration
```

Each step has a gate below. Do not continue past a failed gate, and do not begin with the frontend button.

## 4. Step 1 — Baseline verification

Before any Phase 5 write, record without cleaning or resetting:

```text
git branch --show-current
git rev-parse HEAD
git status --short
git diff --cached
php --version
php spark --version
```

Also record the effective CodeIgniter environment, database group, driver, host class, database name, and migration mechanism without printing secrets. Confirm the active database is disposable before any migration test. Record every pre-existing changed/untracked auth file so later diffs can distinguish Phase 5 work.

**Gate 1:** staging state and dirty-worktree baseline are documented; no protected database is selected.

## 5. Step 2 — Freeze migration authority

Obtain an explicit decision in this form:

```text
AUTHORITATIVE CURRENT RUNTIME: MySQL / WAMP
AUTHORITATIVE SCHEMA-CHANGE MECHANISM: <exact runner and path>
NEXT AVAILABLE MIGRATION IDENTIFIER: <confirmed value>
TEST DATABASE: <disposable database name>
```

Do not create parallel MySQL and PostgreSQL/Supabase migrations. Document how apply, status, and rollback are performed by the authoritative mechanism.

**Gate 2:** if any line is unknown, stop database implementation. Service interfaces may be reviewed, but no persistence implementation should merge.

## 6. Step 3 — Provider identity migration

After Gate 2 and schema approval, create exactly one authoritative migration, tentatively named with the then-current next number, for `external_auth_identities`.

### Required logical schema

| Column | MySQL shape | Null | Default/meaning |
|---|---|---:|---|
| `id` | `CHAR(36)` | No | Primary key; project UUID convention |
| `profile_id` | `CHAR(36)` | No | Local identity FK |
| `provider` | `VARCHAR(30)` | No | Stable key, initially `google` |
| `provider_subject` | `VARCHAR(255)` | No | Durable provider `sub` |
| `provider_email_snapshot` | `VARCHAR(255)` | No | Verified email snapshot, not identity authority |
| `provider_hosted_domain_snapshot` | `VARCHAR(255)` | Yes | Operational snapshot |
| `link_method` | `VARCHAR(30)` | No | Initially `verified_email_bootstrap` |
| `linked_at` | `DATETIME(6)` | No | Link time |
| `last_authenticated_at` | `DATETIME(6)` | Yes | Successful provider authentication only |
| `created_at` | `DATETIME(6)` | No | Creation time |
| `updated_at` | `DATETIME(6)` | No | Update time |

Required constraints:

```sql
PRIMARY KEY (id)
UNIQUE (provider, provider_subject)
UNIQUE (profile_id, provider)
FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
```

Do not add token/access-token/refresh-token/client-secret columns, modify `profiles`, `local_auth_credentials`, or `local_auth_sessions`, or seed provider links.

### Rollback and verification

Rollback drops only `external_auth_identities`. On a disposable database, verify table/column metadata, nullability, microsecond timestamp support, PK/FK, both composite unique constraints, physical-delete behavior, apply/rollback/reapply, and migration-status accuracy. Never rollback against protected data.

**Gate 3:** migration tests pass and the rollback changes no pre-existing table.

## 7. Step 4 — Persistence boundary

The current auth stack uses services plus CodeIgniter Query Builder; `backend/app/Models` has no established auth model convention. Choose the smallest consistent boundary during Phase 5:

- preferred: `backend/app/Services/ExternalAuthIdentityRepository.php`, isolating Query Builder calls; or
- `backend/app/Models/ExternalAuthIdentityModel.php` only if the team deliberately adopts CodeIgniter Model conventions and tests its UUID/timestamp behavior.

Required operations:

```php
findByProviderSubject(string $provider, string $subject): ?array
findByProfileAndProvider(string $profileId, string $provider): ?array
insertLink(ExternalIdentityData $identity): string
updateLastAuthenticatedAt(string $identityId, DateTimeInterface $at): void
```

The persistence boundary never creates profiles, changes roles/passwords/lifecycle flags, merges identities, issues sessions, or accepts raw Google tokens. Normalize data before persistence and return no token fields.

Tests cover lookup misses/hits, insert mapping, snapshot update, timestamp behavior, and database exception propagation for unique conflicts.

**Gate 4:** persistence tests pass against the disposable MySQL schema.

## 8. Step 5 — `AuthenticationEligibilityService`

Create `backend/app/Services/AuthenticationEligibilityService.php`, reusing/wrapping `AccountLifecycleResolver` rather than duplicating lifecycle rules.

```php
evaluate(string $profileId, string $authMethod): EligibilityResult
```

Result states:

```text
eligible
pending_first_login
inactive
suspended
archived
unavailable
```

Rules:

- `profiles.status` remains the central access gate.
- Password verification must establish an active `local_auth_credentials` row before completion.
- Google authentication does not require a usable local password.
- Neither method clears `must_change_password`.
- Student enrollment and Personnel employment status are not newly enforced.
- Missing/inconsistent records fail closed as `unavailable` and produce safe internal diagnostics.

Tests cover every profile status, missing profile, missing credential/lifecycle combinations, both auth methods, and pending-first-login behavior.

**Gate 5:** method-independent lifecycle outcomes match existing password behavior.

## 9. Step 6 — `AuthenticationCompletionService`

Create `backend/app/Services/AuthenticationCompletionService.php` with a small request-context/result type under the existing project convention (plain immutable arrays/value objects are acceptable; do not add a framework solely for DTOs).

```php
completeAuthentication(
    string $profileId,
    string $authMethod,
    bool $rememberMe,
    RequestContext $requestContext
): AuthenticationResult
```

Ordered behavior:

1. load canonical profile;
2. evaluate eligibility;
3. derive lifecycle state;
4. issue through existing `LocalTokenService` with current TTL semantics;
5. write the method-specific success event;
6. return the existing auth response payload.

It must not verify credentials, create provider links, query Google, assign roles, or trust client account/role/profile input. Roles remain hydrated by `/auth/me`.

Tests assert identical response fields, remember-me TTL choice, lifecycle errors, safe audit metadata, and one session row per successful completion for `password` and `google` methods.

**Gate 6:** both methods produce the same AchieveNest session contract and no roles enter JWT claims.

## 10. Step 7 — Password-login refactor

Change only the post-password-verification portion of `backend/app/Services/LocalAuthService.php` to call the completion service. Keep `backend/app/Controllers/Api/AuthController.php::login()` request behavior unchanged.

Preserve:

- email trimming/lowercasing and institutional suffix validation;
- existing profile/credential lookup and `password_verify()`;
- generic invalid-credential response;
- `remember_me` TTL behavior;
- account-state and `must_change_password` semantics;
- success/failure audit semantics without double logging;
- response shape expected by `frontend/src/services/authService.js`;
- password change/reset and session revocation.

Run password regression tests before adding Google functionality: valid login, malformed/non-institutional/unknown email, wrong password, credential disabled/locked, inactive/suspended/archived profile, pending first login, both remember modes, `/auth/me`, logout, password change, and administrative reset.

**Gate 7:** all existing and new password tests pass. On failure: **STOP—do not implement the Google endpoint.**

## 11. Step 8 — Dependency and configuration approval

### Dependency selection gate

Evaluate a supported Google server-side ID-token verification approach compatible with PHP `^8.2`, CodeIgniter 4.7.x, Composer, signing-key rotation, issuer/audience/expiry verification, and minimal scopes/dependencies. Review exact version, license, maintenance/release status, security advisories, transitive dependencies, cache/network behavior, and testability.

Do not select a generic JWT decoder that leaves Google key discovery/rotation or required claim validation to ad hoc code. Do not install until the package/version and lockfile diff are approved. Record the decision in the Phase 5 change record.

### Configuration names

Plan backend variables:

```text
GOOGLE_AUTH_ENABLED=false
GOOGLE_CLIENT_ID=
GOOGLE_ALLOWED_HOSTED_DOMAINS=
```

`VITE_GOOGLE_CLIENT_ID` belongs to the later frontend phase. Never commit live values. When disabled, password login must start normally and `/auth/google` must return a controlled unavailable response. When enabled, missing/malformed client/domain configuration must fail the Google path closed without disabling password authentication.

**Gate 8:** package/version and config parser/feature-flag behavior are approved before Composer/config writes.

## 12. Step 9 — `GoogleIdentityVerificationService`

Create `backend/app/Services/GoogleIdentityVerificationService.php` and a sanitized `VerifiedGoogleIdentity` representation.

Input: raw ID token. Output: subject, normalized verified email, hosted domain only.

The service verifies:

- cryptographic signature using trusted rotating Google keys;
- issuer;
- configured audience;
- expiration and required time constraints;
- non-empty `sub` and email;
- `email_verified = true`;
- exact allowed `hd` membership.

All signature/issuer/audience/time/missing-claim/email-verification failures map publicly to `GOOGLE_TOKEN_INVALID`; hosted-domain failure maps to `GOOGLE_DOMAIN_NOT_ALLOWED`. Detailed cryptographic errors stay out of responses, logs, exception context, and audit JSON.

Unit tests use a verifier adapter/mock or deterministic fixtures; they do not call live Google. Test valid claims, signature failure, key rotation adapter behavior, wrong issuer/audience, expiry/time failures, false/missing `email_verified`, missing `sub`/email/`hd`, wrong domain, email normalization, and safe exceptions.

**Gate 9:** raw tokens cannot be observed in logs, persistence, returned DTOs, or thrown public errors.

## 13. Step 10 — `ExternalIdentityService`

Create `backend/app/Services/ExternalIdentityService.php` using the persistence and eligibility boundaries.

Suggested operations:

```php
resolveOrLinkVerifiedGoogleIdentity(VerifiedGoogleIdentity $identity): ResolutionResult
markSuccessfulAuthentication(string $externalIdentityId): void
```

### Existing-link path

Look up `(google, sub)`, resolve its `profile_id`, and never rematch by email. Evaluate that profile's lifecycle before completion. A changed provider email may update the snapshot only after successful authentication and never changes the link target.

### First-link path

Use exact normalized verified email to query `profiles`:

- 0 matches: `GOOGLE_ACCOUNT_NOT_REGISTERED`;
- 1 match: continue;
- more than 1: `GOOGLE_ACCOUNT_AMBIGUOUS` and fail closed.

Inside one DB transaction: re-query/lock the profile, re-evaluate eligibility, recheck `(provider, subject)`, recheck `(profile_id, provider)`, insert the link, and insert `GOOGLE_IDENTITY_LINK_CREATED`. Commit before issuing a session. Normalize duplicate-key races to a safe `GOOGLE_IDENTITY_CONFLICT` after re-reading state; never expose SQL details.

If session completion fails after commit, preserve the valid link, do not update `last_authenticated_at`, and write a safe failure event. Update that timestamp only after successful Google completion.

Tests cover existing link, new link, no/ambiguous email match, both conflicts, lifecycle denial before link, duplicate concurrent attempts, rollback, changed email with stable subject, audit atomicity, and the unresolved admin/Personnel scenario.

**Gate 10:** concurrency tests demonstrate exactly one durable link and no silent reassignment.

## 14. Step 11 — Google endpoint

Add to `backend/app/Config/Routes.php`:

```text
POST /api/v1/auth/google -> AuthController::google
OPTIONS /api/v1/auth/google -> AuthController::options
```

Add a thin `google()` method to `backend/app/Controllers/Api/AuthController.php`:

```text
validate feature flag and request shape
-> pre-verification throttle
-> verify Google credential
-> post-verification subject throttle
-> resolve/link local profile
-> shared completion
-> mark successful external authentication
-> normalized response
```

Accepted JSON fields only:

```json
{
  "credential": "<transient-google-id-token>",
  "remember_me": true
}
```

Ignore/reject `role`, `account_type`, `profile_id`, `email_override`, or authorization hints. Enforce a conservative request-size limit. Never return the Google token.

### Public contract

Success matches password login and is followed by `/auth/me`. Error envelope:

```json
{
  "error": {
    "code": "GOOGLE_TOKEN_INVALID",
    "message": "Authentication could not be completed."
  }
}
```

Codes: `GOOGLE_TOKEN_INVALID`, `GOOGLE_DOMAIN_NOT_ALLOWED`, `GOOGLE_ACCOUNT_NOT_REGISTERED`, `GOOGLE_ACCOUNT_AMBIGUOUS`, `GOOGLE_IDENTITY_CONFLICT`, `ACCOUNT_INACTIVE`, `ACCOUNT_SUSPENDED`, `ACCOUNT_ARCHIVED`, `PASSWORD_CHANGE_REQUIRED`, `AUTH_RATE_LIMITED`, and `AUTHENTICATION_FAILED`.

**Gate 11:** feature-disabled/misconfigured behavior is safe, password login remains operational, and endpoint tests prove no authorization comes from Google/frontend fields.

## 15. Step 12 — Authentication throttling

CodeIgniter's `service('throttler')` is already used by `TargetProvisioningController`, but its default file-cache characteristics must be assessed before reusing it for authentication. Choose a store with atomic increments and expiry for the actual deployment topology. Process-local counters are development-only; file cache requires explicit concurrency/multi-instance review.

Protect at minimum:

| Endpoint/stage | Key dimensions (keyed/digested) |
|---|---|
| `/auth/login` | endpoint + source IP; endpoint + normalized email |
| `/auth/google` pre-verify | endpoint + source IP |
| `/auth/google` post-verify | endpoint + provider + subject |
| `/password-reset-requests` | endpoint + source IP; endpoint + normalized email |
| link conflicts | IP + verified subject/profile indicators where safe |

Do not key on raw passwords/tokens. Define a server-only keyed-digest strategy for identifiers, trustworthy proxy/IP extraction, configurable capacities/windows, expiry, success-counter policy, and reliable `Retry-After`. Prefer progressive throttling over permanent account lockout.

Planning ranges such as 5–10 password attempts or 10–20 invalid Google exchanges per short window are not approved thresholds. Select values using tests and operational constraints.

Return HTTP 429 with `AUTH_RATE_LIMITED`; audit threshold events without credential data. Tests cover below/at/above threshold, expiry, independent IP/account/subject keys, concurrent increments, success policy, proxy handling, response body/header, and feature-disabled Google behavior.

**Gate 12:** limiter behavior is deterministic and production-capable; otherwise Google stays disabled.

## 16. Step 13 — Audit events and data safety

Reuse `audit_logs` and the current direct Query Builder convention unless an approved audit helper refactor is independently justified.

Add/test:

```text
GOOGLE_LOGIN_SUCCESS
GOOGLE_LOGIN_FAILURE
GOOGLE_DOMAIN_REJECTED
GOOGLE_ACCOUNT_UNREGISTERED
GOOGLE_IDENTITY_LINK_CREATED
GOOGLE_IDENTITY_CONFLICT
GOOGLE_TOKEN_INVALID
AUTH_RATE_LIMITED
```

Allowed context: known profile ID, auth method, provider, safe reason, IP, user-agent metadata, and timestamp. Prefer a keyed digest over raw email/subject when direct identity is unnecessary.

Forbidden everywhere—including test failure output—are raw Google tokens, local JWTs, passwords, Google access/refresh tokens, OAuth secrets, signing material, and full decoded claim payloads.

Avoid duplicate success events when the password flow moves to completion. Ensure link-created audit insertion is transactional with the link. Add capture-based tests that scan log/audit/exception/response output for fixture secrets.

**Gate 13:** secret-canary tests pass for success and every failure branch.

## 17. Step 14 — Test plan and regression gate

Use existing `backend/tests/Feature`, `backend/tests/unit`, `backend/tests/integration`, and `backend/tests/database` conventions. Add only the fixtures/adapters necessary to isolate Google verification from live network calls.

### Migration/persistence

- table, columns, PK/FK, both unique constraints, nullability, timestamps;
- apply/rollback/reapply on disposable MySQL;
- repository lookups, snapshot update, deletion semantics;
- concurrent first-link and duplicate-key normalization.

### Verification/linking

- valid token and every cryptographic/claim/domain failure;
- existing/new link, no/ambiguous local match, both conflict directions;
- inactive/suspended/archived/pending-first-login profiles;
- Student, multi-role Personnel, HR Admin, and OSAD Admin;
- no live Google requests and no token persistence/logging.

### Completion/contracts

- password and Google share issuance/lifecycle/response logic;
- remember false/true TTL;
- `/auth/me` compatibility and absence of role claims;
- safe error/status mapping and disabled/misconfigured feature behavior.

### Password regression

- valid/invalid password login and credential states;
- account lifecycle and first-login restriction;
- password change/reset, logout revocation, `/auth/me` hydration;
- current auth feature tests remain green.

### Throttling/audit

- limiter boundaries, expiry/concurrency/key separation, 429/Retry-After;
- correct safe event per outcome;
- raw-token/local-JWT/password/secret canaries absent.

**Regression gate:** all existing password tests plus all new completion, provider, Google endpoint, limiter, and audit-safety tests must pass before frontend work. Any password regression means **STOP AND FIX BACKEND**.

## 18. Step 15 — Manual development verification

Using only a disposable/local database and non-production credentials:

1. verify password login and `/auth/me`;
2. verify logout revokes the session;
3. verify pending-first-login restrictions;
4. verify disabled/missing-config Google path returns a safe controlled response;
5. after approved test client configuration exists in the later boundary, verify successful exchange and link once;
6. verify replay resolves the same link and does not insert another;
7. verify wrong domain/unregistered/conflict/rate-limit results reveal no internals;
8. inspect database and logs for constraint/audit correctness and absence of raw tokens.

Do not use production accounts or secrets. Google Cloud setup is not part of this phase and should occur only after backend code/contracts/tests are ready.

## 19. Expected Phase 5 file scope

Exact files depend on approvals and conventions, but the intended scope is:

### New, likely

- `backend/database/mysql-defense/migrations/<confirmed-next>_external_auth_identities.sql`
- `backend/app/Services/AuthenticationEligibilityService.php`
- `backend/app/Services/AuthenticationCompletionService.php`
- `backend/app/Services/GoogleIdentityVerificationService.php`
- `backend/app/Services/ExternalIdentityService.php`
- `backend/app/Services/ExternalAuthIdentityRepository.php` **or** an approved model alternative
- focused backend test/fixture/adapter files

### Existing, likely modified

- `backend/app/Services/LocalAuthService.php`
- `backend/app/Controllers/Api/AuthController.php`
- `backend/app/Config/Routes.php`
- minimal auth/config/service registration files required by the chosen implementation
- `backend/composer.json` and `backend/composer.lock` only after dependency approval
- existing auth tests where regression expectations need extension

`Filters.php` should change only if the approved throttling design is filter-based. No frontend file belongs in Phase 5.

## 20. Rollback plan

Rollback must be layered and preserve password access:

1. set `GOOGLE_AUTH_ENABLED=false` or remove the route from deployment exposure;
2. leave password login, reset, `/auth/me`, and local sessions intact;
3. revert Google service/controller/config/dependency changes only through reviewed code rollback;
4. preserve provider-link rows by default for safe re-enable/forensics;
5. drop `external_auth_identities` only through the explicit migration rollback on a confirmed target and only when data loss is accepted;
6. never delete profiles, rewrite passwords, or invalidate local credentials as part of Google rollback.

Verify password regression after each rollback layer. Document whether Composer removal is safe given transitive consumers.

## 21. Diff, security, and acceptance review

Before any Phase 5 commit:

- compare status/diff with the Step 1 baseline;
- confirm only approved backend auth/migration/test/dependency files changed;
- inspect for secrets, tokens, fixture private material, raw claim dumps, and debug logging;
- inspect SQL constraints and rollback;
- inspect request-size, timeout/key-fetch, and exception behavior;
- verify password and new test evidence;
- keep unrelated dirty-worktree changes unstaged;
- stage and commit only after separate user approval.

Suggested future commit decomposition (not authorization to commit):

```text
feat(auth): add external identity schema
refactor(auth): add shared authentication completion
feat(auth): add google identity verification and linking
feat(auth): add google auth endpoint
feat(auth): add authentication throttling
test(auth): add google and regression coverage
```

## 22. Pre-implementation approval checklist

- [ ] Phase 4 plan approved
- [ ] MySQL/WAMP migration path, runner, and next identifier confirmed
- [ ] Disposable migration-test database confirmed
- [ ] Exact Workspace hosted domain(s) confirmed or a test-only dummy policy approved
- [ ] Same-human admin/Personnel case dispositioned or explicit fail-closed deferral approved
- [ ] Provider table/constraints/cascade behavior approved
- [ ] Google verifier package/version and dependency review approved
- [ ] Google feature-flag/config behavior approved
- [ ] Limiter store/dimensions/thresholds/proxy policy approved
- [ ] Audit taxonomy and data-minimization tests approved
- [ ] Rollback/data-retention plan accepted
- [ ] No cookie/refresh/UI/profile-sync/account-merge scope added

## 23. Phase 5 acceptance criteria

Backend foundation is complete only when:

- [ ] provider migration exists in the confirmed authoritative mechanism;
- [ ] PK/FK/unique constraints and rollback pass on disposable MySQL;
- [ ] provider persistence and transactional conflict handling work;
- [ ] eligibility and completion services pass isolated tests;
- [ ] password login uses shared completion without regression;
- [ ] Google verifier validates signature, issuer, audience, time, email verification, and domain;
- [ ] raw Google tokens are neither persisted nor logged;
- [ ] first link is transactional and concurrent attempts fail safely;
- [ ] `/auth/google` returns an AchieveNest session and no Google token;
- [ ] roles remain outside Google/JWT trust and `/auth/me` stays authoritative;
- [ ] lifecycle denials and `must_change_password` are consistent;
- [ ] production-capable throttling protects login, Google exchange, and reset;
- [ ] Google and limiter audit events are safe;
- [ ] password login/reset/logout remain available;
- [ ] full backend tests and rollback verification pass;
- [ ] no frontend Google UI was added;
- [ ] implementation diff contains only approved files.

## 24. Explicit non-goals

Do not combine Phase 5 with cookie-auth migration, refresh tokens, account auto-provisioning/merging, Google Drive/Gmail/Calendar scopes, profile/name/photo sync, role sync, password removal, self-service unlink/relink, broad audit refactoring, frontend Google UI, or Google Cloud production setup.

## 25. Recommended next phases

After this plan and all blocking prerequisites are approved:

1. **Phase 5 — Backend Authentication Foundation Implementation**
2. **Phase 6 — Google Cloud Configuration & Development Credential Setup** only after backend contracts/tests are ready
3. **Phase 7 — React Google Sign-In Integration** after backend stability
4. **Phase 8 — Impeccable Login UI/UX Redesign & Polish**

Phase 5 must stop at every failed gate and must not stage, commit, or push without explicit approval.
