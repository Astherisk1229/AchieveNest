# AchieveNest — Hostinger-Only Deployment & Migration Plan

## Status

Target production stack requested by the team:

- Hostinger Web/Cloud hosting
- PHP 8.2+ / CodeIgniter 4 backend
- Hostinger MySQL database
- React + Vite frontend served from Hostinger
- GitHub as source control and deployment source
- No Supabase dependency in the final production architecture

> IMPORTANT: The current repository is not yet Hostinger/MySQL-only. It actively uses Supabase Auth and PostgreSQL-specific schema/migrations. Do not deploy the current `main` branch as a MySQL application until the migration phases below are completed and verified.

---

## Ground-Truth Blockers Found

1. `backend/app/Config/Database.php` currently uses the CodeIgniter `Postgre` driver and PostgreSQL defaults.
2. The first database migration uses PostgreSQL-specific features including `pgcrypto`, `uuid`, `timestamptz`, `public.*`, `auth.users`, PL/pgSQL functions/triggers, RLS, and Supabase roles.
3. `frontend/src/services/authService.js` authenticates directly through Supabase Auth and then sends the Supabase access token to the CodeIgniter API.
4. Backend services such as `SupabaseAuthService.php` and `SupabaseAdminAuthService.php` validate/manage Supabase authentication.
5. The frontend currently includes `@supabase/supabase-js`.
6. Production CORS previously allowed only `http://localhost:5173`; the deployment branch now makes the allowed origins environment-driven.
7. Frontend `.env` files are now excluded from Git on the deployment branch and a safe `.env.example` exists.

---

# Phase A — Deployment Freeze and Audit

## Goal
Create a complete inventory before replacing infrastructure-specific behavior.

## Tasks

- [x] Create isolated branch: `deployment/hostinger-readiness`
- [x] Protect frontend environment files from accidental Git commits.
- [x] Add frontend environment template.
- [x] Make backend CORS production-origin configurable.
- [x] Confirm CodeIgniter requires PHP `^8.2`.
- [x] Confirm React/Vite production build command is `npm run build`.
- [x] Confirm current database configuration is PostgreSQL.
- [x] Confirm current authentication is Supabase-based.
- [x] Confirm database migrations contain PostgreSQL/Supabase-specific SQL.
- [x] Inventory all Supabase frontend calls. See `docs/HOSTINGER_PHASE_A_DEPENDENCY_AUDIT.md`.
- [x] Inventory all Supabase backend services.
- [x] Inventory all PostgreSQL-specific SQL in migrations/services/models/controllers.
- [x] Inventory Storage usage and uploaded-file persistence.
- [x] Inventory Realtime usage, if any. No active Supabase Realtime use was found.
- [x] Inventory password reset / provisioning / admin account workflows that currently depend on Supabase Auth.

## Exit Gate
No MySQL conversion begins until all active Supabase/PostgreSQL dependencies are mapped to replacement components.

---

# Phase B — Authentication Migration: Supabase Auth → CodeIgniter + MySQL

## Target
Hostinger-only authentication controlled by the PHP backend.

## Proposed target flow

1. User enters institutional email + password in React.
2. React calls `POST /api/v1/auth/login`.
3. CodeIgniter looks up the user in MySQL.
4. Password is verified server-side using PHP password hashing.
5. CodeIgniter issues the application's signed JWT.
6. React stores/uses that JWT for protected API calls.
7. Backend authorization remains authoritative through account type, assigned roles, status, and active role context.

## Required work

- [ ] Add/verify a password hash field suitable for PHP `password_hash()` / `password_verify()`.
- [ ] Add CodeIgniter login endpoint.
- [ ] Replace Supabase token validation with application JWT validation.
- [ ] Replace Supabase admin account provisioning with MySQL + backend account provisioning.
- [ ] Replace Supabase password changes with backend password update logic.
- [ ] Replace Supabase sign-out/session calls in React.
- [ ] Replace/reset the current password-reset workflow without exposing passwords.
- [ ] Preserve institutional-email restrictions and current account lifecycle rules.
- [ ] Preserve role-switching authorization rules.
- [ ] Add brute-force/rate-limit controls to login/reset endpoints.
- [ ] Add tests for login, suspended account, archived account, first-login password change, role assignment, role switching, and logout.

## Exit Gate
No runtime code imports Supabase Auth and all authentication tests pass locally against MySQL.

---

# Phase C — Database Migration: PostgreSQL → Hostinger MySQL

## Goal
Produce a MySQL schema equivalent to the verified application model, without copying PostgreSQL syntax blindly.

## Conversion areas already identified

- PostgreSQL `uuid` → MySQL-compatible UUID storage strategy.
- `gen_random_uuid()` → application-generated or MySQL-compatible UUID generation.
- `timestamptz` → MySQL datetime/timestamp strategy.
- `public.table` schema qualification → Hostinger MySQL database tables.
- `auth.users` foreign key → local application user/profile identity model.
- PostgreSQL regex/check syntax → MySQL-compatible constraints and/or backend validation.
- `btrim()` and PostgreSQL-specific functions → MySQL equivalents or application validation.
- PL/pgSQL update triggers → MySQL-compatible update timestamps or application-managed timestamps.
- PostgreSQL `NULLS NOT DISTINCT` indexes → equivalent uniqueness strategy.
- Supabase RLS / `anon` / `authenticated` grants → CodeIgniter authorization and MySQL permissions.

## Tasks

- [ ] Convert migrations one-by-one to MySQL-compatible CodeIgniter migrations.
- [ ] Preserve every verified table/column/constraint relationship where MySQL supports it.
- [ ] Move authorization guarantees that previously relied on RLS to server-side authorization where required.
- [ ] Ensure foreign keys and cascading behavior remain equivalent.
- [ ] Ensure indexes required by search/filter/reporting remain present.
- [ ] Create deterministic seed/dev data only where the repo already defines it.
- [ ] Run all migrations on an empty local MySQL database.
- [ ] Run migration rollback/forward tests.
- [ ] Compare resulting schema against the mapped PostgreSQL schema.

## Exit Gate
A clean WAMP MySQL instance can build the complete schema from migrations without manual SQL edits.

---

# Phase D — Storage / Upload Migration

## Goal
Remove production dependence on Supabase Storage if it is active.

## Tasks

- [ ] Identify all current certificate, portfolio, evidence, avatar, and attachment upload paths.
- [ ] Move uploads behind CodeIgniter-controlled endpoints.
- [ ] Store files in a non-executable upload area.
- [ ] Generate randomized server filenames.
- [ ] Validate extension, MIME type, content size, and allowed file categories.
- [ ] Prevent PHP/script execution inside upload directories.
- [ ] Store file metadata/path in MySQL.
- [ ] Add authorized download/view endpoints for non-public evidence where required.
- [ ] Test upload, replace, delete, unauthorized access, oversized files, and invalid MIME types.

## Exit Gate
All application file operations work without Supabase Storage.

---

# Phase E — Local WAMP Production Simulation

## Goal
Prove the Hostinger-only architecture locally before touching the live host.

## Local target

- Apache
- PHP version compatible with Hostinger and CodeIgniter
- MySQL
- React production build
- CodeIgniter production-like environment

## Tasks

- [ ] Create local MySQL database.
- [ ] Apply all converted migrations.
- [ ] Configure backend `.env` with local MySQL credentials.
- [ ] Build frontend with `npm ci && npm run build`.
- [ ] Serve built frontend through Apache.
- [ ] Configure production-like API URL.
- [ ] Test direct browser refresh on React routes.
- [ ] Test login/logout/password reset/change-password.
- [ ] Test every user role and role switching.
- [ ] Test uploads and downloads.
- [ ] Test event/achievement/verification/recognition flows supported by the current repo.
- [ ] Run backend tests and frontend tests.
- [ ] Run smoke tests using a fresh browser session.

## Exit Gate
No localhost-only dependency, Supabase runtime dependency, PostgreSQL driver, or development-only route is required for the tested flows.

---

# Phase F — Prepare Hostinger Account

These are account-side actions and require the team's Hostinger access.

## F1. Hosting plan

Use a Hostinger plan that supports the required PHP version and, preferably, SSH/Git deployment. Hostinger documentation states SSH is available on Premium Web or higher. Business or higher may provide more convenient automatic redeployment features depending on the current plan/features.

## F2. Add the production website/domain

In hPanel:

1. Go to **Websites**.
2. Add/select the AchieveNest website.
3. Attach the final domain or use a temporary Hostinger domain during staging.
4. Keep SSL enabled.

Record:

- `PRODUCTION_ORIGIN=https://...`
- `APP_BASE_URL=https://...`

Do not commit private credentials to Git.

## F3. PHP

In hPanel:

1. **Websites → Dashboard → PHP Configuration**.
2. Select a version supported by the repository (`PHP 8.2+`; prefer a currently supported version after compatibility testing).
3. Verify required extensions used by CodeIgniter and the application.

## F4. Create MySQL database

In hPanel:

1. **Websites → Dashboard → Databases → Management**.
2. Create the AchieveNest MySQL database and database user.
3. Generate a strong unique password.
4. Record the exact Hostinger-generated database name, username, hostname, and port.

Required private environment values:

```env
CI_ENVIRONMENT = production
app.baseURL = 'https://YOUR_DOMAIN/'
app.forceGlobalSecureRequests = true

database.default.hostname = 'HOSTINGER_DB_HOST'
database.default.database = 'HOSTINGER_DB_NAME'
database.default.username = 'HOSTINGER_DB_USER'
database.default.password = 'HOSTINGER_DB_PASSWORD'
database.default.DBDriver = 'MySQLi'
database.default.port = 3306
```

These values belong in the server `.env`, never in GitHub.

---

# Phase G — GitHub → Hostinger Deployment

## Preferred source

Deploy only after the Hostinger-ready branch passes all Phase E gates. Do not point production at an unverified development branch.

## Hostinger Git deployment flow

1. hPanel → **Websites**.
2. Open the AchieveNest website **Dashboard**.
3. **Advanced → Git**.
4. Click **Continue with GitHub**.
5. Authorize Hostinger for the AchieveNest repository.
6. Select `Astherisk1229/AchieveNest`.
7. Select the verified deployment branch.
8. Configure deployment root carefully; Hostinger normally serves `public_html`.
9. Deploy.

## Important monorepo note

The current repository contains separate `frontend/` and `backend/` directories. A final deployment layout must be created deliberately so CodeIgniter's non-public files are not exposed and the React build is served from the web root.

The final packaging step will be implemented only after the MySQL/Auth/Storage migration is complete and tested.

---

# Phase H — Production Build & Dependencies

On Hostinger (SSH where supported), verify the actual deployed paths first with `pwd`.

Backend dependency install target:

```bash
cd <backend-project-directory>
composer install --no-dev --optimize-autoloader
```

Frontend production build should normally be produced in CI/local deployment packaging:

```bash
cd frontend
npm ci
npm run build
```

Do not run a Vite development server in production.

---

# Phase I — Apache / CodeIgniter / React Routing

## Goals

- Only intended public files are web-accessible.
- CodeIgniter front-controller routing works.
- React BrowserRouter routes survive direct refreshes.
- API paths do not get rewritten to React `index.html`.

## Required verification

- [ ] Confirm final `public_html` layout.
- [ ] Confirm `.htaccess` rewrite order.
- [ ] Confirm `/api/...` reaches CodeIgniter.
- [ ] Confirm `/login`, `/portfolio`, etc. reach the React SPA when appropriate.
- [ ] Confirm backend `app/`, `writable/`, `.env`, tests, and vendor metadata are not publicly downloadable.
- [ ] Force HTTPS.

No `.htaccess` rule should be finalized until the deployed folder layout is finalized.

---

# Phase J — Production Environment Configuration

## Backend

- `CI_ENVIRONMENT=production`
- correct `app.baseURL`
- `app.forceGlobalSecureRequests=true`
- MySQL connection values
- application JWT signing secret/key
- production CORS allowed origin
- production logging level
- upload limits/paths
- no development debug output

## Frontend

At build time:

```env
VITE_API_BASE_URL=https://YOUR_DOMAIN/api/v1
```

Any Supabase-specific variables must be absent after Phase B/D if Hostinger-only migration is complete.

---

# Phase K — First Live Database Deployment

Preferred method after migrations are MySQL-safe:

```bash
php spark migrate --all
```

If the final deployment uses an exported `.sql` file instead, Hostinger provides phpMyAdmin import. Do not import PostgreSQL/Supabase SQL into MySQL.

Before any production import/migration:

- take/export a backup if the DB contains data;
- ensure migration SQL requires no SUPER privileges;
- verify the database selected is the intended AchieveNest production database.

---

# Phase L — Live Smoke Test

Immediately after deployment verify:

- [ ] HTTPS works.
- [ ] Landing/login page loads.
- [ ] Browser refresh on SPA routes works.
- [ ] Login succeeds for valid dummy/test account.
- [ ] Invalid login fails safely.
- [ ] Suspended/archived accounts remain blocked.
- [ ] JWT/API authorization works.
- [ ] Student access works.
- [ ] Personnel access works.
- [ ] Program Coordinator role works.
- [ ] Organization Moderator role works.
- [ ] Dean/departmental role behavior matches the current verified implementation.
- [ ] OSAD admin access works.
- [ ] HR admin access works.
- [ ] Role switching cannot elevate permissions.
- [ ] Achievement/event/verification flows work.
- [ ] Upload/download works.
- [ ] PDF/certificate generation works if implemented in the current branch.
- [ ] API errors do not expose stack traces/secrets.
- [ ] Logs are writable and useful.

---

# Phase M — Security Test (Staging/Test Data First)

Do not run destructive penetration tests against production records.

- [ ] Run OWASP ZAP baseline/passive scan against staging/test environment.
- [ ] Test broken access control across roles.
- [ ] Test IDOR/resource ownership checks.
- [ ] Test authentication/session expiration.
- [ ] Test SQL injection inputs.
- [ ] Test reflected/stored XSS inputs.
- [ ] Test file upload restrictions.
- [ ] Test direct access to `.env`, app/config, logs, backups, source maps, and hidden files.
- [ ] Test CORS.
- [ ] Test rate limiting.
- [ ] Test password reset abuse.
- [ ] Verify no debug endpoints are exposed.

Fix findings before production acceptance.

---

# Phase N — Monitoring and Backup

Hostinger-only infrastructure can use Hostinger's logs/backups as the core operational source. Optional external uptime/error monitoring can be added later, but is not required for the requested Hostinger-only hosting architecture.

Verify:

- [ ] Hostinger backups enabled for the selected plan.
- [ ] Database backup/export procedure documented.
- [ ] CodeIgniter logs are writable but not web-accessible.
- [ ] Storage usage monitored.
- [ ] PHP errors logged, not displayed publicly.
- [ ] Deployment rollback procedure documented.

---

# Required Information From Hostinger Later

Only request these values when the migration is ready to deploy:

1. Final domain or temporary Hostinger test domain.
2. Hostinger plan/tier.
3. Hostinger-generated MySQL hostname.
4. Hostinger-generated MySQL database name.
5. Hostinger-generated MySQL username.
6. Database password (enter directly into Hostinger/server environment; do not send or commit it unless a secure credential channel explicitly requires it).
7. Whether SSH is enabled on the plan.
8. Whether Git auto-deployment is available on the plan.

---

# Current Execution State

Branch: `deployment/hostinger-readiness`

Completed repository changes before the MySQL migration begins:

- environment-driven backend CORS preparation;
- frontend `.env` secret protection;
- frontend environment template;
- Hostinger-only deployment/migration plan.

Next implementation action:

**Complete the Supabase/PostgreSQL dependency inventory, then convert the identity/authentication foundation and database migrations to MySQL in small testable phases.**
