# AchieveNest Login Modernization

## Phase 1 — Authentication Policy and Google Sign-In Rules

**Status:** Policy baseline for review and approval
**Scope:** Architecture and policy only
**Production behavior changed by this phase:** None
**Next phase:** Phase 2 — Current Authentication and Database Compatibility Audit

## 1. Purpose

This document freezes the security and product rules that must govern a future Google Sign-In implementation in AchieveNest. It intentionally does not prescribe database structures, endpoint payloads, token libraries, domain values, or migration dates that have not yet been verified against the current application and institutional requirements.

The governing boundary is:

> **Google authenticates identity. AchieveNest authorizes access.**

Google may establish that a person controls a valid Google identity. It does not determine whether that person may use AchieveNest, which account they may use, or which roles and permissions they hold.

## 2. Frozen policy decisions

The following decisions are authoritative for later design and implementation phases:

1. Google Sign-In never creates an AchieveNest account automatically.
2. A verified Google identity does not itself grant AchieveNest access.
3. AchieveNest accounts must be created through existing authorized institutional provisioning workflows.
4. The backend independently verifies every Google ID token before trusting any claim.
5. Institutional Google-domain restrictions are enforced by the backend.
6. Google roles, profile attributes, email patterns, and frontend input never assign or infer AchieveNest roles.
7. AchieveNest resolves account type, roles, permissions, and interface access from its own authoritative records.
8. The Google OpenID Connect `sub` claim is the durable provider identity key.
9. Verified institutional email may be used only for controlled first-time linking to an existing eligible account.
10. An existing Google identity link is never silently overwritten or reassigned.
11. Inactive, suspended, archived, or otherwise ineligible local accounts are denied access even after successful Google authentication.
12. A Google ID token is never used as an AchieveNest authorization token.
13. AchieveNest issues its own normal session or JWT after identity verification and local authorization.
14. Password authentication remains available during the initial migration.
15. Password and Google authentication must converge on one post-authentication authorization pipeline.
16. Authentication activity is audit logged without recording credentials, raw Google ID tokens, application tokens, or secrets.

## 3. Responsibility boundary

### Google Identity Services

Google Sign-In, using Google Identity Services and OpenID Connect/OAuth 2.0-based authentication, is responsible for:

- authenticating the Google user;
- issuing a signed Google ID token;
- providing identity claims such as `sub`, verified email, issuer, audience, expiration, and hosted domain when applicable.

The login interface should describe this action simply as **Continue with Google**.

### AchieveNest React frontend

The frontend is responsible for:

- rendering the Google Sign-In control;
- receiving the credential response;
- sending the Google credential to the backend;
- displaying loading, cancellation, and normalized failure states;
- redirecting only after a successful AchieveNest authentication response.

The frontend must not:

- treat decoded Google claims as authorization;
- decide whether an institutional domain is allowed;
- report or select a trusted account type or role;
- create or link accounts directly;
- declare authentication successful before the backend responds.

### AchieveNest CodeIgniter backend

The backend is responsible for:

- cryptographically verifying the Google ID token;
- enforcing issuer, audience, expiration, verified-email, and hosted-domain rules;
- resolving or creating a controlled provider identity link;
- resolving the existing local AchieveNest account;
- enforcing local account status;
- loading authoritative account type, roles, and permissions;
- issuing the AchieveNest session or JWT;
- recording a safe authentication audit event;
- returning normalized authentication results and errors.

## 4. Target authentication sequence

```text
User selects Continue with Google
        ↓
Google authenticates the user
        ↓
React receives a Google ID token
        ↓
React sends the ID token to CodeIgniter
        ↓
CodeIgniter verifies the token and required claims
        ↓
AchieveNest resolves an existing provider link or performs controlled first-time linking
        ↓
AchieveNest resolves and validates the local account
        ↓
AchieveNest loads account type, roles, and permissions
        ↓
AchieveNest issues its own session or JWT and records the audit event
        ↓
React enters the existing post-authentication routing flow
```

The Google ID token and AchieveNest authorization token are distinct credentials with distinct purposes.

## 5. Account eligibility and creation

Google authentication must never bypass institutional account provisioning. If a verified Google identity cannot be resolved to exactly one eligible existing AchieveNest account, access is denied.

Student accounts remain controlled by OSAD or other currently authorized workflows. Personnel accounts remain controlled by HR or other currently authorized workflows. Administrative accounts remain controlled by their existing institutional processes.

No Google callback or backend Google-authentication endpoint may synthesize a Student, Personnel, OSAD Admin, HR Admin, role assignment, profile, or enrollment record merely because Google authentication succeeded.

## 6. Provider identity and first-time linking

The durable identity-link concept is:

```text
provider = google
provider_subject = verified Google sub
local_account = existing eligible AchieveNest account
```

First-time linking follows this policy:

1. Verify the Google ID token and required claims.
2. Search for an existing Google link by provider and provider subject.
3. If a link exists, resolve only the linked local account.
4. If no link exists, search for an existing eligible local account using the verified institutional email.
5. Create a link only when exactly one eligible account matches and no conflicting link exists.
6. If zero or multiple eligible accounts match, deny automatic linking and require administrative resolution.
7. Record the successful link or conflict through the approved audit mechanism.

Email is a controlled bootstrap match, not the long-term provider identity key.

### Link-conflict rule

If a local account is already linked to Google subject A, an attempt involving Google subject B must not replace that linkage. Likewise, one provider identity must not be silently reassigned from one local account to another. The backend rejects the operation with a safe identity-conflict result and requires controlled recovery or administrator intervention.

## 7. Google token-verification requirements

Before using any Google claim, the backend must verify at least:

- signature against trusted Google signing keys;
- expected audience against the configured Google Client ID;
- accepted issuer;
- token expiration and other relevant time constraints;
- verified email when email matching is used;
- configured allowed hosted domain or domains when institutional restriction is enabled.

The exact verification library, key-cache policy, clock-skew tolerance, nonce policy, and Google Client ID configuration remain implementation decisions for later evidence-based phases.

Frontend domain hints or string checks may improve usability but have no security authority.

## 8. Local account status policy

Successful Google authentication is followed by local account validation. The normalized policy is:

| Local state | Result |
|---|---|
| Active and otherwise eligible | Continue |
| Inactive | Deny |
| Suspended | Deny |
| Archived | Deny |
| Unknown or unsupported | Fail closed |

The exact stored status names and lifecycle rules must be mapped from the current database during Phase 2. User-facing errors must not expose private administrative notes or unnecessary account details.

## 9. Roles, permissions, and account separation

Roles and permissions are loaded exclusively from AchieveNest records after the local account is resolved.

For multi-role Personnel, authentication resolves the normal Personnel account. Program Coordinator, Organization Moderator, Dean, or other authorized contexts remain available through the existing post-login role-selection or role-switching mechanism. The login page does not ask the user which role they want to use.

OSAD Admin and HR Admin remain administrative authorization contexts and must not be collapsed into Personnel access merely because an email address or human identity appears related. Any relationship between administrative and personal Personnel accounts must be explicitly supported and verified by the existing architecture before it can affect authentication.

## 10. Converged post-authentication pipeline

Password and Google authentication should have different credential-verification entry points but share the same authorization completion path:

```text
Password verification ─┐
                       ├─→ Resolve local account
Google verification ───┘          ↓
                         Check account status
                                  ↓
                         Resolve roles and permissions
                                  ↓
                         Issue AchieveNest session/JWT
                                  ↓
                         Write authentication audit event
                                  ↓
                         Return normalized response
```

The shared path should prevent drift in account-status checks, role resolution, token issuance, auditing, and response semantics.

## 11. Password migration policy

Password login remains functional while Google Sign-In is introduced and validated.

1. Introduce Google Sign-In alongside password login for controlled testing.
2. Make Google the preferred institutional method only after reliability and account coverage are demonstrated.
3. Retain password fallback through institutional acceptance and recovery testing.
4. Decide separately whether password login remains permanent and whether protected administrator or recovery access must remain password-based.

No later phase may remove password authentication without an explicit, approved migration decision.

## 12. Normalized outcomes

### Successful authentication

Both authentication methods should eventually produce the same application-level result containing the existing application's normalized user projection, authoritative account type and roles, AchieveNest access token or session information, and expiration metadata where applicable.

The precise response shape remains TBD until the current API contract is audited.

### Safe failure behavior

| Condition | User-facing policy |
|---|---|
| Invalid or unverifiable Google token | “We couldn't complete sign-in. Please try again.” |
| Wrong or disallowed Google domain | “Please use your institutional Google account.” |
| Verified identity with no registered AchieveNest account | Explain that the account is not registered and direct the user to the appropriate administrator. |
| Inactive local account | Explain that the AchieveNest account is inactive and direct the user to an administrator. |
| Suspended local account | Use an institution-approved neutral message without exposing internal notes. |
| Identity-link conflict | Deny automatic linking and direct the user to controlled support or administrative resolution. |
| User cancels Google Sign-In | Treat as a normal cancellation, not a system authentication error. |

Backend logs may retain safe reason codes, but responses must avoid account enumeration, internal database details, or sensitive administrative context.

## 13. Audit policy

Later implementation should support consistent events such as:

- `LOGIN_SUCCESS`
- `LOGIN_FAILURE`
- `GOOGLE_LOGIN_SUCCESS`
- `GOOGLE_LOGIN_FAILURE`
- `GOOGLE_LOGIN_UNREGISTERED`
- `GOOGLE_LOGIN_DOMAIN_REJECTED`
- `GOOGLE_IDENTITY_CONFLICT`
- `INACTIVE_ACCOUNT_LOGIN_ATTEMPT`
- `SUSPENDED_ACCOUNT_LOGIN_ATTEMPT`
- `LOGOUT`

Approved audit metadata may include resolved local user ID, authentication method, event code, timestamp, IP address subject to institutional privacy policy, appropriate user-agent information, outcome, and a safe reason code.

Audit records must never contain plaintext passwords, raw Google ID tokens, AchieveNest session/JWT values, OAuth client secrets, or unnecessary profile information.

## 14. Security invariants

Implementation reviews and tests must demonstrate that:

- identity verification and authorization remain separate;
- all security-sensitive Google claims are verified server-side;
- unregistered identities fail closed;
- local account state is enforced consistently across authentication methods;
- roles cannot be injected through frontend input or inferred from Google data;
- identity-link uniqueness and conflict handling prevent silent takeover;
- tokens and secrets do not enter logs or persistent storage unnecessarily;
- Google authentication cannot bypass provisioning, role assignment, or account recovery controls;
- password authentication remains intact until a later approved migration decision.

## 15. Explicitly unresolved items

The following remain **TBD** and must not be guessed:

### Current database and identity model

- where provider identities should be stored;
- whether a dedicated identity-link table is required;
- current account-status columns and accepted values;
- global or account-type-specific email uniqueness;
- whether administrative and Personnel identities use shared or separate account rows;
- constraints required to enforce one-to-one or otherwise approved provider linkage.

### Current authentication implementation

- current login request and response contracts;
- session/JWT creation, verification, expiry, and refresh behavior;
- logout and revocation behavior;
- password reset and first-login behavior;
- throttling and rate-limiting controls;
- existing authentication audit events and storage.

### Institutional Google policy

- exact approved NDMU Workspace domain or domains;
- whether Students and Personnel share a domain;
- Google eligibility for OSAD and HR administrative accounts;
- whether all intended users are guaranteed institutional Google identities;
- approved recovery and administrator-access rules.

### Migration decisions

- whether password authentication remains permanently;
- whether every account type may use Google Sign-In;
- whether dedicated administrator or emergency access remains password-based;
- rollout, testing, rollback, and support procedures.

## 16. Phase 1 acceptance record

Phase 1 may be marked accepted only when authorized stakeholders approve the following policy statements:

- [ ] Google authenticates identity only; AchieveNest authorizes access.
- [ ] Google Sign-In never auto-creates AchieveNest accounts.
- [ ] Existing eligible accounts are required.
- [ ] Google `sub` is the durable provider identity key.
- [ ] First-time email matching is verified, controlled, and ambiguity-safe.
- [ ] Existing identity links cannot be silently replaced.
- [ ] The backend verifies tokens and institutional-domain eligibility.
- [ ] Local account status is checked after Google authentication.
- [ ] Roles and permissions come exclusively from AchieveNest.
- [ ] Multi-role Personnel selection remains post-authentication.
- [ ] Administrative access remains distinct from Personnel access.
- [ ] AchieveNest issues its own session/JWT.
- [ ] Password login remains during initial migration.
- [ ] Authentication failures are safe and normalized.
- [ ] Authentication events are audit logged without secrets or raw tokens.
- [ ] Unresolved implementation and institutional details remain TBD pending evidence.

## 17. Phase 2 audit mandate

No Google authentication schema or production code should be proposed until Phase 2 inspects the real application. The audit must cover:

- React login page and authentication state/context;
- frontend authentication service and redirect behavior;
- current CodeIgniter login endpoint, controller, services, and models;
- application session/JWT issuance and verification;
- password login, reset, first-login, refresh, logout, and revocation flows;
- account/profile tables for Student, Personnel, OSAD Admin, and HR Admin;
- email uniqueness and account-status constraints;
- role and permission relationships, including multi-role Personnel;
- current audit logging and authentication failure handling;
- current throttling or rate-limiting safeguards;
- development, administrator, and recovery-access requirements.

Phase 2 findings must cite concrete files, routes, schema objects, and observed contracts. Conflicts between this policy and current implementation must be reported explicitly rather than silently resolved.
