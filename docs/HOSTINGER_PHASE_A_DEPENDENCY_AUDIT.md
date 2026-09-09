# AchieveNest Hostinger Migration — Phase A Dependency Audit

Audit date: 2026-09-10 (Asia/Singapore)  
Branch: `deployment/hostinger-readiness`  
Frozen starting commit: `8b8c120a2acdbc960d259bf9b4efb05d63ff8b90`  
Relationship to `origin/main`: 0 commits behind, 6 commits ahead at freeze time

## Conclusion

Phase A's repository inventory is complete for the selected branch. The branch is not Hostinger-ready: Supabase Auth is an active frontend and backend runtime dependency, the default CodeIgniter connection is PostgreSQL, all 13 application migrations contain PostgreSQL/Supabase-specific assumptions, and upload endpoints currently accept client-supplied storage references instead of persisting validated files through CodeIgniter.

No Supabase Realtime application subscription was found. The only Supabase Realtime package references are transitive lockfile entries. Application methods named `subscribe` are local observer callbacks, not Supabase Realtime.

## Frontend Supabase inventory

| Component | Verified dependency | Required replacement |
|---|---|---|
| `frontend/package.json` and lockfile | Direct `@supabase/supabase-js` dependency | Remove after all imports are migrated |
| `src/config/supabase.js` | Creates client and contains fallback project URL/key | Remove; retain only application API configuration |
| `src/services/authService.js` | Password sign-in and sign-out through Supabase | CodeIgniter login/logout/session API |
| `src/services/apiClient.js` | Reads Supabase session token for requests | Application JWT/session token source |
| `src/context/AuthContext.jsx` | Session restoration and auth-state subscription | Restore session through `/api/v1/auth/me`; local session lifecycle |
| `src/pages/common/ResetPasswordPage.jsx` | Recovery session, password update, sign-out | AchieveNest-owned reset endpoint and token flow |
| `src/pages/common/AccountPage.jsx` | Direct `supabase.auth.updateUser()` | Authenticated backend password-change endpoint |
| `src/services/__tests__/authServicePasswordReset.test.js` | Tests current Supabase behavior | Replace with application-auth tests |

## Backend Supabase inventory

| Component | Verified dependency | Required replacement |
|---|---|---|
| `SupabaseAuthService.php` | Validates Supabase access tokens | Application JWT validation service |
| `SupabaseAdminAuthService.php` | Supabase administrative user/password operations | Local credential/provisioning service using password hashes |
| `AuthenticatedActorService.php` | Depends on `SupabaseAuthService` | Resolve actor from validated application JWT and MySQL identity |
| `AuthController.php` | Token verification and password administration | Login/me/logout/change/reset endpoints backed by local credentials |
| `AchievementController.php` | Direct bearer validation | Central authenticated actor service |
| `EventController.php` | Direct bearer validation | Central authenticated actor service |
| `VerificationQueueController.php` | Direct bearer validation | Central authenticated actor service |
| `PasswordResetRequestController.php` | Supabase admin reset | Local password reset service |
| `ProvisioningController.php` | Supabase admin provisioning | Transactional MySQL identity/profile/role provisioning |
| `TargetProvisioningController.php` | Supabase admin provisioning | Transactional MySQL identity/profile/role provisioning |

The `backend/development` Node scripts and duplicated verification scripts also depend on Supabase administrative APIs. They are development utilities, but remain active repository dependencies until removed or replaced.

## PostgreSQL and schema inventory

`backend/app/Config/Database.php` selects `Postgre` for default and development, uses schema `public`, port 5432, and PostgreSQL connection options.

All application migrations from `2026-08-21-000001` through `2026-08-26-000013` require deliberate review. Verified constructs include:

- `uuid`, `gen_random_uuid()`, and the `pgcrypto` extension;
- `timestamptz`, `jsonb`, PostgreSQL casts, and PostgreSQL functions;
- `public.*` and `auth.users` relationships;
- PL/pgSQL functions and triggers;
- row-level security policies and Supabase `anon`/`authenticated` grants;
- PostgreSQL regex/trim expressions;
- `NULLS NOT DISTINCT` and PostgreSQL-specific index syntax.

Controllers and services also contain PostgreSQL-specific query syntax or assumptions and must be tested after schema conversion. The affected runtime classes include account lifecycle, authentication, achievements, awards, events, HR evaluation/personnel, personnel accomplishments/roles, provisioning, student portfolio, verification queue, authenticated-actor resolution, and reviewer resolution.

## Identity and lifecycle coupling

The canonical profile identity is currently coupled to `auth.users(id)` by the foundation migration. Supabase administrative identity operations are used by provisioning and password reset. The replacement must preserve:

- institutional email uniqueness and validation;
- account types and lifecycle states;
- assigned roles and active-role authorization;
- `must_change_password` behavior where represented;
- suspended and archived account rejection;
- provisioning, activation, password change, reset, admin reset, and logout flows.

## Storage and upload inventory

No direct `supabase.storage` runtime call was found. However, storage is not complete or Hostinger-safe:

- achievement creation accepts a client-supplied `evidence_url`;
- student portfolio evidence accepts client-supplied `storage_path` and `original_filename`;
- personnel accomplishment evidence accepts client-supplied `storage_path`;
- report and evaluation migrations store file path/URL fields;
- no application call to CodeIgniter `getFile()`, `UploadedFile::move()`, or equivalent persistent upload implementation was found.

Phase D must therefore implement server-controlled persistence, metadata, authorization, MIME/extension/size validation, randomized filenames, traversal prevention, protected downloads, and non-executable storage. It is not merely a Supabase Storage removal.

## Runtime versus documentation

Runtime findings above exclude `docs/**`, dependency directories, and vendor code. Historical documentation contains many Supabase/PostgreSQL references and must be labeled or reconciled later, but it does not itself constitute runtime coupling. Lockfile-only Realtime references are transitive package metadata, not evidence of Realtime use.

## Phase A exit-gate mapping

| Active dependency | Hostinger-compatible replacement | Status entering Phase B/C/D |
|---|---|---|
| Supabase user identity | Local MySQL identity/credential tables | Required |
| Supabase password/auth session | PHP password hashing + application JWT | Required |
| Supabase bearer verification | Central CodeIgniter JWT/actor service | Required |
| Supabase admin provisioning/reset | Transactional backend provisioning/reset services | Required |
| PostgreSQL schema/migrations | MySQLi-compatible migrations and constraints | Required |
| PostgreSQL RLS/grants | CodeIgniter authorization plus least-privilege MySQL user | Required |
| Client-supplied file references | CodeIgniter-controlled protected file storage | Required |
| Supabase Realtime | No replacement required; no runtime use found | Verified absent |

No bulk conversion should begin without preserving these mapped behaviors and their tests.

