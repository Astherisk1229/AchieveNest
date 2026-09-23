# AchieveNest Personnel Login Usability Audit Report

Audit date: 2026-09-11
Scope: Arthur Pendelton, Cynthia Ramos, David Villanueva, and Demo Coordinator A (BSA)
Method: read-only repository, schema, seeder, fixture, frontend, routing, and runtime-connectivity audit

## 1. Executive Summary

All four named personas are explicitly intended to be login-capable seeded accounts. The active implementation is MySQL-backed local authentication; Supabase/PostgreSQL artifacts in old migrations are not on the active login path.

The repository proves that the relevant seeders are designed to create every required layer: a `profiles` authentication identity, `local_auth_credentials`, a `personnel_profiles` subtype row, a base `personnel` role, and the applicable governance assignment. It does **not** prove that those rows currently exist or remain consistent in the live MySQL database.

The most important verified usability defect is architectural: HR Personnel Directory can display a person even when the canonical credential row is missing. Its active query joins `profiles` to `personnel_profiles`, but left-joins `local_auth_credentials`. The green **Active** badge represents `profiles.status`; it does not prove that `local_auth_credentials` exists, is active, contains a usable hash, or has a valid lifecycle flag.

No per-account live root cause can be confirmed in this environment because runtime MySQL inspection is unavailable: no MySQL client is installed and CodeIgniter reports a missing PHP `mysqli` capability. No password guesses, resets, inserts, role changes, or login attempts were performed.

The three non-demo accounts also have an identifier discrepancy requiring live verification: the supplied IDs (`900000008`, `900000009`, `900000011`) are not the IDs defined by `LocalDefenseAuthSeeder` (`9000000008`, `9000000009`, `9000000011`). Their names and emails match the seeded personas, but the employee IDs do not.

## 2. Accounts Audited

| Account | Intended capability | Creation origin | Live state |
|---|---|---|---|
| `dean.cet01@ndmu.edu.ph` | `SEEDED_LOGIN_ACCOUNT` | `LocalDefenseAuthSeeder` | Unknown |
| `coord.bscs01@ndmu.edu.ph` | `SEEDED_LOGIN_ACCOUNT` | `LocalDefenseAuthSeeder` | Unknown |
| `mod.css01@ndmu.edu.ph` | `SEEDED_LOGIN_ACCOUNT` | `LocalDefenseAuthSeeder` | Unknown |
| `demo.coordinator.a@ndmu.edu.ph` | `SEEDED_LOGIN_ACCOUNT` | `DefenseDemoPersonaSeeder` | Unknown |

## 3. System Authentication Architecture

The active authentication chain is:

```text
LoginPage
  -> authService.authenticateUser()
  -> POST /api/v1/auth/login
  -> Api\AuthController::login()
  -> LocalAuthService::login()
  -> profiles lookup by normalized institutional email
  -> profiles.status check
  -> local_auth_credentials lookup by profile_id
  -> credential status and password_verify()
  -> LocalTokenService::issueToken()
  -> GET /api/v1/auth/me
  -> AuthenticatedActorService::resolveActor()
  -> generic profile_roles + scoped governance assignments
  -> frontend session construction and default role context
  -> /personnel/dashboard
  -> LayoutShell requires account_type=personnel and role=personnel
```

Active route evidence:

- `backend/app/Config/Routes.php:10` registers `POST auth/login` to `Api\AuthController::login`.
- `backend/app/Services/LocalAuthService.php:28` lowercases and trims the email.
- `LocalAuthService.php:55` reads `profiles`; line 99 reads `local_auth_credentials`; line 130 uses `password_verify`; line 163 issues the token.
- `frontend/src/services/authService.js:42` calls `/auth/login`, line 71 calls `/auth/me`, and line 114 selects a default active role.
- `frontend/src/App.jsx:112` forces accounts with `must_change_password` to `/change-password`.

Authentication uses an opaque bearer access token backed by the server-side local session registry. No token or secret value was inspected or recorded.

## 4. Current Personnel Account Creation Workflow

The active HR provisioning and import paths create a complete login account transactionally:

- `TargetProvisioningController` hashes an initial credential, creates `profiles`, creates `personnel_profiles`, assigns the base role in `profile_roles`, and creates `local_auth_credentials`.
- `PersonnelImportService` performs the same essential identity/profile/role/credential creation for batch imports.
- The administrator reset path updates the canonical `local_auth_credentials` row, sets `must_change_password = 1`, and revokes existing sessions. It also maintains the compatibility hash on `profiles`, but login reads only `local_auth_credentials`.

Consequently, an account produced by the current workflow should be structurally login-capable. A directory row without credentials indicates legacy/manual data, an incomplete seeder run, failed historical provisioning, or later data damage.

## 5. Seeder / Demo Account Findings

| Seeder / persona | Auth profile | Canonical credential | Personnel profile | Base role | Governance assignment |
|---|---:|---:|---:|---:|---:|
| LocalDefenseAuthSeeder / Arthur | Yes | Yes | Yes | `personnel` | Active Dean assignment |
| LocalDefenseAuthSeeder / Cynthia | Yes | Yes | Yes | `personnel` | Active Program Coordinator assignment |
| LocalDefenseAuthSeeder / David | Yes | Yes | Yes | `personnel` | Active Organization Moderator assignment |
| DefenseDemoPersonaSeeder / Demo Coordinator A | Yes | Yes | Yes | `personnel` | Active Program Coordinator assignment |

The demo coordinator is not display-only. `docs/Phase_12_Demo_Persona_Manifest.md:14` defines the persona, base and coordinator roles, and BSA scope. `docs/Phase_17_Offline_Defense_Startup_Runbook.md:110` explicitly assigns it to the Personnel Portal.

Seeder evidence establishes intended output, not present runtime state. Historical SQL backups also contain matching authentication-shaped rows, but they are snapshots and were not treated as the live database.

## 6. Cross-Account Status Matrix

`DESIGN` means the layer is created by the named canonical seeder and accepted by active code. `UNKNOWN` means it could not be verified in the current MySQL database.

| Account | Profile | Auth user | Credential | Link | Base role | Role context | Login | Root cause |
|---|---|---|---|---|---|---|---|---|
| Arthur | DESIGN / live UNKNOWN | DESIGN / live UNKNOWN | DESIGN / live UNKNOWN | DESIGN / live UNKNOWN | DESIGN / live UNKNOWN | DESIGN / live UNKNOWN | Not tested | `UNKNOWN`; likely runtime/seeder divergence must be tested |
| Cynthia | DESIGN / live UNKNOWN | DESIGN / live UNKNOWN | DESIGN / live UNKNOWN | DESIGN / live UNKNOWN | DESIGN / live UNKNOWN | DESIGN / live UNKNOWN | Not tested | `UNKNOWN`; likely runtime/seeder divergence must be tested |
| David | DESIGN / live UNKNOWN | DESIGN / live UNKNOWN | DESIGN / live UNKNOWN | DESIGN / live UNKNOWN | DESIGN / live UNKNOWN | DESIGN / live UNKNOWN | Not tested | `UNKNOWN`; likely runtime/seeder divergence must be tested |
| Demo Coordinator A | DESIGN / live UNKNOWN | DESIGN / live UNKNOWN | DESIGN / live UNKNOWN | DESIGN / live UNKNOWN | DESIGN / live UNKNOWN | DESIGN / live UNKNOWN | Not tested | `UNKNOWN`; demo seeder execution/current credential must be verified |

## 7. Per-Account Detailed Findings

### Arthur Pendelton

- Email: `dean.cet01@ndmu.edu.ph`
- Supplied employee ID: `900000008`
- Seeder employee ID: `9000000008`
- Expected login capability: `SEEDED_LOGIN_ACCOUNT`
- A. Personnel profile: DESIGN PASS; live UNKNOWN. Seeder creates an academic personnel profile and college affiliation.
- B. Authentication user: DESIGN PASS; live UNKNOWN. Seeder creates the `profiles` identity with `account_type = personnel`.
- C. Credential: DESIGN PASS; live UNKNOWN. Seeder creates an active canonical credential with a recognized PHP password hash.
- D. Link: DESIGN PASS; live UNKNOWN. `profiles.id`, `personnel_profiles.profile_id`, and credential `profile_id` share the same canonical UUID.
- E. Base role: DESIGN PASS; live UNKNOWN. Seeder assigns `personnel`.
- F. Governance role: DESIGN PASS; live UNKNOWN. Seeder creates an active Dean assignment; the active resolver derives `dean` from that assignment rather than requiring a governance `profile_roles` row.
- G. Active role context: DESIGN PASS; live UNKNOWN. Personnel remains the valid default context; Dean is switchable when the assignment resolves.
- H. Login endpoint: PASS at code level.
- I. Session/token: Not tested.
- J. Routing: PASS at code level; personnel routes to `/personnel/dashboard`.
- Root cause: `UNKNOWN`. The employee-ID mismatch strongly indicates the visible row must be compared to the seeded UUID and current credential row.
- Required fix: no mutation until joined runtime identity is verified. Likely fix category is `DATA_REPAIR` or `SEEDER_FIX`, depending on the live trace.
- Risk: High if repaired by email alone; two near-matching employee identities could be conflated.
- Confidence: Incomplete evidence.

### Cynthia Ramos

- Email: `coord.bscs01@ndmu.edu.ph`
- Supplied employee ID: `900000009`
- Seeder employee ID: `9000000009`
- Expected login capability: `SEEDED_LOGIN_ACCOUNT`
- A–E: DESIGN PASS; live UNKNOWN. Seeder creates identity, credential, academic personnel subtype, linkage, and base `personnel` role.
- F. Governance role: DESIGN PASS; live UNKNOWN. Active BSCS coordinator assignment is created and is the authoritative source of coordinator context.
- G. Active role context: DESIGN PASS; live UNKNOWN. Default is Personnel; Program Coordinator is switchable.
- H. Login endpoint: PASS at code level.
- I. Session/token: Not tested.
- J. Routing: PASS at code level.
- Root cause: `UNKNOWN`; current UUID/employee-ID/credential consistency must be inspected.
- Required fix: determine whether the current row is an incomplete duplicate or a modified seeded row before any credential reset.
- Risk: High.
- Confidence: Incomplete evidence.

### David Villanueva

- Email: `mod.css01@ndmu.edu.ph`
- Supplied employee ID: `900000011`
- Seeder employee ID: `9000000011`
- Expected login capability: `SEEDED_LOGIN_ACCOUNT`
- A–E: DESIGN PASS; live UNKNOWN.
- F. Governance role: DESIGN PASS; live UNKNOWN. Seeder creates an active organization moderator assignment; the resolver derives `organization_moderator` from it.
- G. Active role context: DESIGN PASS; live UNKNOWN. Default is Personnel; Organization Moderator is switchable.
- H. Login endpoint: PASS at code level.
- I. Session/token: Not tested.
- J. Routing: PASS at code level.
- Root cause: `UNKNOWN`; current UUID/employee-ID/credential consistency must be inspected.
- Required fix: verify and repair the canonical linked identity only after excluding a duplicate profile.
- Risk: High.
- Confidence: Incomplete evidence.

### Demo Coordinator A (BSA)

- Email: `demo.coordinator.a@ndmu.edu.ph`
- Employee ID: `2026-DEMO-008`
- Expected login capability: `SEEDED_LOGIN_ACCOUNT`
- A. Personnel profile: DESIGN PASS; live UNKNOWN.
- B. Authentication user: DESIGN PASS; live UNKNOWN.
- C. Credential: DESIGN PASS; live UNKNOWN. The demo seeder upserts an active canonical credential.
- D. Link: DESIGN PASS; live UNKNOWN. The deterministic persona UUID is shared by all subtype and assignment rows.
- E. Base role: DESIGN PASS; live UNKNOWN. Seeder assigns `personnel`.
- F. Governance role: DESIGN PASS; live UNKNOWN. Seeder assigns active BSA coordinator scope.
- G. Active role context: DESIGN PASS; live UNKNOWN. Personnel is the safe default; Program Coordinator is available after `/auth/me` resolves the assignment.
- H. Login endpoint: PASS at code level.
- I. Session/token: Not tested.
- J. Routing: PASS at code and documentation level.
- Root cause: `UNKNOWN`. Most plausible categories are `SEEDER_INCOMPLETE`, missing/changed canonical credential, or live data drift; none is confirmed.
- Required fix: run the read-only joined trace below, then use the guarded demo seeding workflow only if missing rows are confirmed and reseeding is acceptable.
- Risk: Medium because the persona is deterministic demo data, but reseeding may overwrite demo state.
- Confidence: Incomplete evidence.

## 8. Login Pipeline Findings

Identifier matching is consistent across frontend and backend: both trim and lowercase institutional email. Employee ID is not a login identifier. Only `@ndmu.edu.ph` email addresses pass validation. Case and surrounding whitespace should not explain failure for the supplied addresses.

The backend returns an access token from `/auth/login`; the frontend accepts both wrapped and unwrapped response shapes, stores the token, then requires `/auth/me` to resolve a user. There is no identified response-shape mismatch.

A successful password check can still be followed by frontend-visible failure if `/auth/me` cannot resolve the server session, active profile, canonical credential lifecycle, or required role information. No evidence currently shows that happening for the four accounts.

## 9. Role Context Findings

Organizational position, login role, and active context are correctly separated:

- Base portal access comes from active `profile_roles` membership in `personnel`.
- Dean, Program Coordinator, and Organization Moderator contexts come from their active scoped assignment tables.
- A governance user is expected to enter in Personnel context and may switch to a governance context.
- The Personnel route guard requires both `account_type = personnel` and assigned role `personnel`.

Therefore, a governance assignment alone cannot make a profile login-capable. Missing base `personnel` membership would allow authentication but cause Personnel portal rejection.

## 10. Password / Reset Findings

`local_auth_credentials.password_hash` is the canonical password source. The compatibility hash in `profiles.password_hash` is not used by login.

The reset implementation updates both locations, creates a missing canonical credential if necessary, marks the password temporary, and revokes existing sessions. This means the current reset workflow writes to the same canonical row that login reads. No reset-table mismatch was found.

A reset is still not the safe first action: it can conceal an orphan, duplicate, wrong-profile link, or incomplete seed while issuing a credential to the wrong identity.

## 11. Data Integrity Findings

The canonical identity relationship uses a shared primary key rather than a separate user foreign key:

```text
profiles.id
  = personnel_profiles.profile_id
  = local_auth_credentials.profile_id
  = profile_roles.profile_id
  = governance_assignment.personnel_profile_id
```

The active directory's inner join proves `profiles` plus `personnel_profiles` for a visible row, but the left credential join allows missing credentials. The UI currently maps `profiles.status` to both `status` and `account_status`; therefore the green badge means administrative profile status is active. It does not mean credential integrity is valid.

Current duplicate email, duplicate employee ID, orphan, foreign-key, and credential-state results remain unknown without live MySQL access.

## 12. Root Causes

Confirmed system-level cause of misleading directory readiness:

- Category: `INVALID_PASSWORD_STATE` visibility gap / incomplete readiness projection.
- Cause: directory visibility and Active status do not require or display a valid active canonical credential.

Per-account root causes:

- Arthur: `UNKNOWN`; identifier divergence is confirmed, live failing layer is not.
- Cynthia: `UNKNOWN`; identifier divergence is confirmed, live failing layer is not.
- David: `UNKNOWN`; identifier divergence is confirmed, live failing layer is not.
- Demo Coordinator A: `UNKNOWN`; login-capable seeded intent is confirmed, live failing layer is not.

## 13. Required Fixes

First run a read-only joined audit against the active database, returning booleans rather than hashes:

```sql
SELECT
  p.id,
  p.institutional_id,
  LOWER(TRIM(p.email)) AS normalized_email,
  p.full_name,
  p.account_type,
  p.status AS profile_status,
  (pp.profile_id IS NOT NULL) AS has_personnel_profile,
  pp.personnel_classification,
  pp.employment_status,
  (lac.profile_id IS NOT NULL) AS has_credential,
  (COALESCE(lac.password_hash, '') <> '') AS has_password_hash,
  lac.status AS credential_status,
  lac.must_change_password,
  SUM(CASE WHEN r.role_key = 'personnel' AND pr.is_active = 1 THEN 1 ELSE 0 END) AS active_personnel_roles,
  (SELECT COUNT(*) FROM dean_assignments da WHERE da.personnel_profile_id = p.id AND da.is_active = 1) AS active_dean_assignments,
  (SELECT COUNT(*) FROM program_coordinator_assignments ca WHERE ca.personnel_profile_id = p.id AND ca.is_active = 1) AS active_coordinator_assignments,
  (SELECT COUNT(*) FROM organization_moderator_assignments ma WHERE ma.personnel_profile_id = p.id AND ma.is_active = 1) AS active_moderator_assignments
FROM profiles p
LEFT JOIN personnel_profiles pp ON pp.profile_id = p.id
LEFT JOIN local_auth_credentials lac ON lac.profile_id = p.id
LEFT JOIN profile_roles pr ON pr.profile_id = p.id
LEFT JOIN roles r ON r.id = pr.role_id
WHERE LOWER(TRIM(p.email)) IN (
  'dean.cet01@ndmu.edu.ph',
  'coord.bscs01@ndmu.edu.ph',
  'mod.css01@ndmu.edu.ph',
  'demo.coordinator.a@ndmu.edu.ph'
)
GROUP BY p.id, p.institutional_id, p.email, p.full_name, p.account_type,
         p.status, pp.profile_id, pp.personnel_classification,
         pp.employment_status, lac.profile_id, lac.password_hash,
         lac.status, lac.must_change_password;
```

Also run duplicate checks for normalized email and institutional ID before repair. Then classify the fix:

- Missing credential only: `DATA_REPAIR` through the canonical account/reset workflow.
- Missing base role: `DATA_REPAIR` after validating the intended profile.
- Duplicate/near-duplicate seeded profile: manual identity reconciliation; do not merely reset.
- Missing demo rows: `SEEDER_FIX` or guarded demo reseed.
- Correct rows but `/auth/me` failure: `AUTHENTICATION_LOGIC_FIX` or `ROLE_RESOLUTION_FIX`, based on safe runtime error codes.

Product hardening recommendation: display credential readiness separately in HR Directory and prevent **Active** from being interpreted as **Can sign in**.

## 14. Risks

- Resetting by email before resolving the employee-ID mismatch may credential the wrong row.
- Rerunning a broad seeder can overwrite current profile, password, assignment, or demo state.
- Adding governance roles to `profile_roles` would conflict with the active resolver's scoped-assignment authority.
- Testing unknown passwords would generate failures and provides less evidence than structural inspection.

## 15. Missing Evidence / Unknowns

- Current rows from the active MySQL database.
- Current canonical credential presence/status/hash validity for the four accounts.
- Current profile-role and governance assignment rows.
- Duplicate normalized emails or institutional IDs.
- Recent safe authentication failure codes from `audit_logs`.
- An authorized known credential for an end-to-end login test.

Runtime access attempt result: MySQL CLI unavailable; CodeIgniter database verification failed because PHP `mysqli` support was unavailable. This is an audit-environment limitation, not evidence that the application database itself is down.

## 16. Recommended Implementation Order

1. Restore read-only MySQL inspection capability in the audit environment.
2. Run the joined trace and duplicate checks for all four emails and both supplied/seeded employee-ID forms.
3. Identify the first failing layer per account.
4. Inspect safe `AUTH_LOGIN_FAILED` codes without exposing hashes or tokens.
5. Apply the narrowest canonical repair only after identity is unambiguous.
6. Test one authorized credential per repaired account end-to-end.
7. Add an HR Directory **Login readiness** field driven by credential integrity, base role, and profile linkage.
8. Add regression coverage for a visible active personnel profile with a missing credential so it cannot be mistaken for a usable account.
