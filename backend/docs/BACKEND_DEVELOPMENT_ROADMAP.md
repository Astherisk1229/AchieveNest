# AchieveNest Backend and Supabase Development Roadmap

Use this document as the working checklist for developing the AchieveNest backend. Complete phases in order because later modules depend on the identity, authorization, database, and audit foundations established earlier.

## Status legend

- `[x]` Completed and verified in the repository
- `[ ]` Not started or not yet verified
- `[~]` Partially implemented; replace this marker with `[x]` only after the phase exit criteria pass

## Current baseline

- [x] CodeIgniter 4.7.4 AppStarter installed in `backend/`
- [x] Composer dependencies installed and locked
- [x] PostgreSQL configured as the default database driver
- [x] SSL required for the database connection
- [x] Supabase-compatible environment template created
- [x] API route namespace established at `/api/v1`
- [x] Health endpoint created at `GET /api/v1/health`
- [x] CORS and secure response headers enabled
- [x] Initial identity and academic-structure migration created
- [x] Supabase Auth `auth.users` selected as the identity source
- [x] RLS enabled on the initial public tables
- [x] Local PHP wrapper scripts created for required extensions
- [x] Backend tests pass: 6 tests and 9 assertions
- [ ] Live Supabase credentials configured locally
- [ ] Initial migration applied to a live Supabase project

---

## Phase 1 — Prepare the local development environment

### PHP and tools

- [ ] Enable these extensions in the active `php.ini`:
  - [ ] `intl`
  - [ ] `pgsql`
  - [ ] `pdo_pgsql`
  - [ ] `sqlite3`
  - [ ] `pdo_sqlite`
- [ ] Restart terminals and PHP services after editing `php.ini`
- [ ] Confirm the extensions:

```powershell
php -m | Select-String -Pattern 'intl|pgsql|pdo_pgsql|sqlite3|pdo_sqlite'
```

> **Pending administrator action:** Windows denied write access to `C:\Program Files\php\php.ini`. Open PowerShell as Administrator and run `cd C:\Users\Admin\Documents\AchieveNest\backend`, followed by `.\scripts\enable-php-extensions.ps1`. Restart the IDE terminal afterward and run the confirmation command above. The project wrappers already load all five extensions, including child processes started by `spark serve`, so local backend development remains operational. Keep the global `php.ini` items unchecked until the administrator script succeeds.

- [x] Until the extensions are enabled globally, use `scripts/php.ps1` and `scripts/spark.ps1`
- [x] Confirm CodeIgniter starts:

```powershell
cd backend
.\scripts\spark.ps1 routes
.\scripts\php.ps1 vendor\bin\phpunit --no-coverage
```

### Local configuration

- [x] Copy `.env.example` to `.env`
- [x] Confirm `.env` remains ignored by Git
- [x] Set `CI_ENVIRONMENT = development` locally
- [x] Set `app.baseURL = 'http://localhost:8080/'`
- [x] Generate and configure any required encryption or application secrets
- [x] Do not store real passwords, private keys, tokens, or service-role keys in tracked files

### Exit criteria

- [x] `spark routes` succeeds
- [x] All backend tests pass
- [x] `spark serve` starts without framework errors
- [x] `GET /api/v1/health` returns JSON

Verified locally on 2026-08-21: 2 routes registered; 6 tests and 10 assertions passed; the health endpoint returned HTTP 200 with JSON status `ok`.

---

## Phase 2 — Create and configure the Supabase project

### Step-by-step execution guide

Complete these tasks in order. Start with a **development** Supabase project; create staging and production projects only after the development connection and migrations pass.

#### Step 1 — Secure the Supabase owner account

- [x] Sign in at [Supabase](https://supabase.com/dashboard)
- [x] Open account settings and enable TOTP multi-factor authentication
- [x] Register a backup TOTP factor and store it separately from the primary factor
- [x] Create or select the organization that will own AchieveNest
- [x] Invite only maintainers who require dashboard access

#### Step 2 — Create the development project

- [x] Select **New project** and name it `AchieveNest Development`
- [x] Select the organization created for AchieveNest
- [x] Choose the region closest to the future backend deployment server
- [x] Generate a unique database password of at least 20 characters
- [x] Store the password in the team password manager; do not put it in documentation
- [x] Create the project and wait until provisioning finishes
- [x] Record the project reference ID and region in the password manager

#### Step 3 — Collect API values securely

- [x] In the project dashboard, open **Project Settings → API**
- [x] Copy the project URL into `supabase.url` in the ignored `backend/.env`
- [x] Copy the publishable key (or legacy `anon` key) into `supabase.anonKey`
- [x] Copy the secret key (or legacy `service_role` key) into `supabase.serviceRoleKey`
- [x] Confirm the secret/service-role key appears only in `backend/.env`
- [x] Never send the secret/service-role key to the browser or include it in screenshots, logs, or commits

#### Step 4 — Select the PostgreSQL connection

- [x] Select **Connect** at the top of the project dashboard
- [x] Test whether the deployment server supports IPv6
- [x] For a persistent IPv6-capable CodeIgniter server, choose **Direct connection** on port `5432`
- [x] For a persistent IPv4-only CodeIgniter server, choose **Shared Pooler → Session mode** on port `5432`
- [x] Do not choose transaction mode for this persistent CodeIgniter deployment; reserve port `6543` for serverless or short-lived clients
- [x] Copy the displayed host, database, username, and port exactly; pooler usernames normally include the project reference

Reference: [Supabase database connection modes](https://supabase.com/docs/guides/database/connecting-to-postgres).

#### Step 5 — Configure the local CodeIgniter environment

- [x] Open the ignored `backend/.env`; do not edit `.env.example` with real values
- [ ] Add the values copied from Supabase:

```dotenv
database.default.hostname = 'VALUE_FROM_SUPABASE_CONNECT'
database.default.database = 'postgres'
database.default.username = 'VALUE_FROM_SUPABASE_CONNECT'
database.default.password = 'VALUE_FROM_PASSWORD_MANAGER'
database.default.DBDriver = 'Postgre'
database.default.port = 5432
database.default.connect_timeout = 5
database.default.schema = 'public'
database.default.sslmode = 'require'

supabase.url = 'https://PROJECT_REF.supabase.co'
supabase.anonKey = 'PUBLISHABLE_OR_ANON_KEY'
supabase.serviceRoleKey = 'SECRET_OR_SERVICE_ROLE_KEY'
```

- [x] Run `git check-ignore -v backend/.env` and confirm Git reports that `.env` is ignored
- [x] Run `git diff -- backend/.env` and confirm no credential is displayed
- [x] Restart the CodeIgniter development server after changing `.env`

#### Step 6 — Verify the database connection before migrating

- [x] From `backend/`, start the API with `.\scripts\spark.ps1 serve`
- [x] Open `http://localhost:8080/api/v1/health`
- [x] Confirm the response reports `configured: true`
- [x] Confirm the response reports `connected: true`
- [x] If connection fails, recheck the connection mode, hostname, pooler username, password, port, and SSL setting
- [x] Stop the development server with `Ctrl+C`

#### Step 7 — Apply and verify the schema

- [x] Review the migration in `app/Database/Migrations/` before applying it
- [x] Run `.\scripts\spark.ps1 migrate --all`
- [x] Run `.\scripts\spark.ps1 migrate:status` and confirm every expected migration is applied
- [x] In **Table Editor**, confirm the identity and academic-structure tables exist in `public`
- [x] In **Authentication → Policies**, confirm Row Level Security is enabled on every exposed public table
- [x] Do not make untracked production schema changes in Table Editor; add future changes as migrations

#### Step 8 — Configure authentication

- [ ] Open **Authentication → Providers → Email** and keep email/password enabled
- [ ] Decide the account policy: administrator-created accounts or public self-registration
- [ ] If accounts are administrator-created, disable **Allow new users to sign up**
- [ ] Require email confirmation for production unless the approved account workflow explicitly verifies users another way
- [ ] Open **Authentication → URL Configuration**
- [ ] Set the development Site URL to the actual React development URL, such as `http://localhost:5173`
- [ ] Add the exact local authentication callback URL used by the React application
- [ ] Add staging and production URLs only when those deployments exist
- [ ] Disable unused social and passwordless providers
- [ ] Configure password policy, CAPTCHA/rate-limit protections, and session duration
- [ ] Configure custom SMTP and test confirmation and password-reset emails before production

References: [password authentication](https://supabase.com/docs/guides/auth/passwords), [Auth configuration](https://supabase.com/docs/guides/auth/general-configuration), and [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

#### Step 9 — Harden the platform

- [ ] Review project API keys and rotate any value that was exposed
- [ ] Confirm PostgreSQL connections require SSL
- [ ] Configure database network restrictions for the known backend IP ranges when the hosting plan and deployment IPs permit it
- [ ] Confirm allowed IP ranges include the deployment path before enabling restrictions
- [ ] Review daily backup availability and decide whether production requires point-in-time recovery
- [ ] Write the database-password and API-key rotation procedure before production launch

References: [platform security](https://supabase.com/docs/guides/security/platform-security) and [network restrictions](https://supabase.com/docs/guides/platform/network-restrictions).

#### Step 10 — Create staging and production safely

- [ ] Create separate `AchieveNest Staging` and `AchieveNest Production` projects
- [ ] Use a unique database password and API keys for each environment
- [ ] Store deployed secrets in the hosting provider's secret manager
- [ ] Apply tested migrations to staging before production
- [ ] Never point automated tests at production
- [ ] Run the health check in each environment without logging credentials
- [ ] Complete the Phase 2 exit criteria below

### Create the project

- [x] Sign in to Supabase and create a project for AchieveNest
- [x] Choose the region closest to the deployment server and primary users
- [ ] Generate and securely store a strong database password
- [ ] Record the project reference ID in the team password manager
- [ ] Separate development, staging, and production into different Supabase projects
- [ ] Never use the production project for automated tests

### Collect connection values

- [x] Open the Supabase project dashboard
- [x] Select **Connect**
- [ ] Choose the connection type for the backend host:
  - [ ] Direct connection on port `5432` for a persistent IPv6-capable server
  - [x] Shared Pooler session mode on port `5432` for a persistent IPv4-only server
  - [ ] Transaction pooler on port `6543` only for serverless/transient runtimes
- [x] Copy the exact host, port, database, and username displayed by Supabase
- [ ] Add the following values to `backend/.env`:

```dotenv
database.default.hostname = 'YOUR_SUPABASE_HOST'
database.default.database = 'postgres'
database.default.username = 'YOUR_SUPABASE_USERNAME'
database.default.password = 'YOUR_DATABASE_PASSWORD'
database.default.DBDriver = 'Postgre'
database.default.port = 5432
database.default.schema = 'public'
database.default.sslmode = 'require'

supabase.url = 'https://YOUR_PROJECT_REF.supabase.co'
supabase.anonKey = 'YOUR_PUBLISHABLE_OR_ANON_KEY'
supabase.serviceRoleKey = 'YOUR_SERVICE_ROLE_KEY'
```

- [x] Keep `supabase.serviceRoleKey` on the backend only
- [x] Never place the database password or service-role key in the React frontend
- [ ] Prefer a deployment secret manager over plaintext production environment files

### Configure Supabase Auth

- [ ] Enable email/password authentication
- [ ] Decide whether email confirmation is required
- [ ] Configure the application site URL
- [ ] Add local, staging, and production redirect URLs
- [ ] Configure password strength and session duration
- [ ] Configure SMTP before production email verification or password recovery
- [ ] Disable unused social providers
- [ ] Document whether administrators create accounts or self-registration is permitted
- [x] Do not store passwords in `public.profiles`; Supabase Auth owns credentials

### Configure Supabase platform security

- [ ] Enable multi-factor authentication for project administrators
- [ ] Restrict dashboard membership to authorized maintainers
- [ ] Review API keys and rotate any key exposed during development
- [ ] Configure database network restrictions if the plan supports them
- [ ] Review backup availability and point-in-time recovery requirements
- [ ] Create a documented database-password and API-key rotation procedure

### Exit criteria

- [ ] Backend health endpoint reports `configured: true`
- [ ] Backend health endpoint reports `connected: true`
- [ ] No credential appears in `git diff`, Git history, frontend code, logs, or screenshots

> **Phase 2 audit — 2026-08-21:** Repository-level credential boundaries and the `public.profiles` identity design are implemented. Live Supabase values are not present in `backend/.env`, and the health endpoint therefore still reports `configured: false`. Project creation, dashboard configuration, secret-manager setup, and connectivity checks require a Supabase project and remain unchecked.

---

## Phase 3 — Apply and verify the database foundation

### Run the initial migration

- [ ] Review `app/Database/Migrations/2026-08-21-000001_CreateIdentityAndAcademicFoundation.php`
- [ ] Confirm the target is the development Supabase project
- [ ] Run:

```powershell
.\scripts\spark.ps1 migrate
.\scripts\spark.ps1 migrate:status
```

- [ ] Confirm these tables exist in the `public` schema:
  - [ ] `roles`
  - [ ] `profiles`
  - [ ] `profile_roles`
  - [ ] `colleges`
  - [ ] `departments`
  - [ ] `degree_programs`
- [ ] Confirm all seven baseline roles were seeded
- [ ] Confirm primary keys, foreign keys, unique constraints, checks, and indexes exist
- [ ] Confirm RLS is enabled on every public table
- [ ] Confirm no permissive anonymous policy was accidentally created

### Establish migration rules

- [ ] Treat CodeIgniter migrations as the source of truth for the public application schema
- [ ] Never edit a migration after it has been applied outside local development
- [ ] Create a new migration for every schema change
- [ ] Give destructive migrations a reviewed data-migration and rollback plan
- [ ] Test migrations from an empty database
- [ ] Test upgrades from the previous released schema
- [ ] Store seed data separately from production operational data

### Exit criteria

- [ ] A clean development database can migrate from zero without manual SQL
- [ ] Migration status is consistent across two consecutive runs
- [ ] Rollback behavior has been tested on a disposable project or local database

---

## Phase 4 — Implement authentication and identity

### JWT verification

- [ ] Add a CodeIgniter authentication filter for protected API routes
- [ ] Read bearer tokens from the `Authorization` header
- [ ] Verify Supabase JWT signatures using the project JWKS endpoint
- [ ] Validate issuer, audience, expiration, subject, and required claims
- [ ] Cache JWKS keys safely and support key rotation
- [ ] Reject missing, expired, malformed, incorrectly signed, or wrong-project tokens
- [ ] Never trust a user ID sent in a request body when the authenticated subject is available

### Profile provisioning

- [ ] Decide how `public.profiles` is created after a new `auth.users` record:
  - [ ] Database trigger with minimal trusted metadata, or
  - [ ] Backend administrative provisioning service
- [ ] Require institutional identifiers to be unique
- [ ] Validate account type and academic assignment
- [ ] Prevent users from granting roles to themselves
- [ ] Add account disable/archive behavior
- [ ] Add profile update audit events

### Password and account workflows

- [ ] Implement account invitation or controlled account creation
- [ ] Implement password recovery through Supabase Auth
- [ ] Implement email confirmation behavior
- [ ] Implement account suspension and session revocation procedures
- [ ] Rate-limit authentication-sensitive endpoints
- [ ] Return generic authentication errors that do not reveal whether an account exists

### Exit criteria

- [ ] Public endpoints work without a token
- [ ] Protected endpoints reject invalid tokens
- [ ] Valid Supabase users can access only their permitted API surface
- [ ] Authentication integration tests pass

---

## Phase 5 — Implement authorization and scoped roles

- [ ] Create a centralized permission catalog
- [ ] Map each role to explicit actions instead of checking role names throughout controllers
- [ ] Support university, college, department, degree-program, and organization scopes
- [ ] Build authorization policies for each aggregate/resource
- [ ] Check authorization in application services before database mutation
- [ ] Enforce object ownership for student and personnel records
- [ ] Enforce department scope for department secretaries
- [ ] Enforce program scope for program coordinators
- [ ] Enforce organization scope for organization moderators
- [ ] Enforce HR and OSAD administrative boundaries
- [ ] Add start/end dates and revocation for temporary assignments
- [ ] Record role grants, changes, and revocations in the audit log
- [ ] Add a complete role-permission test matrix

### Exit criteria

- [ ] Every non-public route has an authentication requirement
- [ ] Every sensitive operation has a named authorization policy
- [ ] Cross-scope access tests prove data isolation
- [ ] No controller relies only on frontend route guards

---

## Phase 6 — Build the shared backend architecture

- [ ] Define folder conventions for Controllers, Services, Policies, Models, Entities, Validation, and DTOs
- [ ] Keep controllers thin: parse input, call services, return responses
- [ ] Put workflow and business rules in domain/application services
- [ ] Put authorization rules in policies
- [ ] Put database access in Models or repositories
- [ ] Create consistent JSON response envelopes
- [ ] Create centralized API exception handling
- [ ] Define error codes for validation, authentication, authorization, conflict, and not-found errors
- [ ] Add request IDs/correlation IDs
- [ ] Add pagination, filtering, sorting, and search conventions
- [ ] Add optimistic concurrency with version fields where concurrent reviews are possible
- [ ] Add idempotency-key handling for important state-changing requests
- [ ] Use transactions for multi-table changes
- [ ] Add immutable audit events for sensitive operations
- [ ] Add OpenAPI documentation and keep it synchronized with routes

### Exit criteria

- [ ] One example module demonstrates the complete architecture
- [ ] API response and error formats are documented and tested
- [ ] Transaction, concurrency, idempotency, and audit patterns are reusable

---

## Phase 7 — Academic structure and administration APIs

- [ ] College CRUD with archive behavior
- [ ] Department CRUD with college validation
- [ ] Degree-program CRUD with department validation
- [ ] Program-coordinator assignment API
- [ ] Organization-moderator assignment API
- [ ] Student-organization CRUD and recognition states
- [ ] Personnel directory and assignment management
- [ ] Student account provisioning and roster import
- [ ] Duplicate-code and duplicate-identifier handling
- [ ] Audit every administrative mutation
- [ ] Add pagination and search
- [ ] Add unit, feature, authorization, and database tests

### Exit criteria

- [ ] OSAD and HR frontend seed data can be replaced by API responses
- [ ] Administrative scope rules pass automated tests

---

## Phase 8 — Achievement and evidence APIs

### Schema

- [ ] Add `achievement_categories`
- [ ] Add `achievements`
- [ ] Add `achievement_evidence`
- [ ] Add category hierarchy and audience constraints
- [ ] Add workflow statuses and transition constraints
- [ ] Add optimistic concurrency/version fields

### API and business rules

- [ ] Student achievement create/read/update/delete endpoints
- [ ] Personnel achievement create/read/update/delete endpoints
- [ ] Submission and withdrawal actions
- [ ] Category-specific validation
- [ ] Ownership and reviewer-scope checks
- [ ] Verified records become immutable except through controlled correction workflows
- [ ] Search, filters, pagination, and sorting

### Evidence storage

- [ ] Create a private Supabase Storage bucket for evidence
- [ ] Upload through the backend or narrowly scoped signed URLs
- [ ] Validate size, MIME type, extension, and file signature
- [ ] Generate checksums
- [ ] Scan uploads for malware before approval
- [ ] Use opaque storage paths
- [ ] Create expiring download URLs only after authorization
- [ ] Define replacement, deletion, quarantine, and retention rules

### Exit criteria

- [ ] Frontend achievement controllers can be replaced by API calls
- [ ] Unauthorized users cannot enumerate or download evidence
- [ ] Evidence integrity and lifecycle tests pass

---

## Phase 9 — Portfolio APIs

- [ ] Add `portfolios` and `portfolio_items`
- [ ] Support student and personnel portfolio types
- [ ] Implement draft, submitted, returned, verified, evaluated, and finalized states as applicable
- [ ] Validate portfolio eligibility before submission
- [ ] Preserve item order and section placement
- [ ] Add portfolio versioning and revision history
- [ ] Add portfolio preview API
- [ ] Add server-controlled export data endpoint
- [ ] Ensure exports use authorized, current data
- [ ] Add submission idempotency
- [ ] Add concurrency conflict responses
- [ ] Add full workflow tests

### Exit criteria

- [ ] Browser `localStorage` is no longer authoritative for portfolios
- [ ] Portfolio history is reproducible and auditable

---

## Phase 10 — Verification and review workflows

- [ ] Add `verification_decisions`
- [ ] Create reviewer queues derived from role and scope
- [ ] Implement verify, return-for-revision, reject, and resubmit transitions
- [ ] Require remarks for return/rejection
- [ ] Record previous and resulting statuses
- [ ] Record reviewer identity and decision time
- [ ] Prevent duplicate decisions using idempotency keys
- [ ] Prevent stale decisions using optimistic concurrency
- [ ] Add notification events
- [ ] Add immutable audit records
- [ ] Test every permitted and prohibited transition

### Exit criteria

- [ ] Department secretary, coordinator, and HR workflows use authoritative server state
- [ ] Concurrent reviewer conflicts are handled predictably

---

## Phase 11 — Evaluation, scoring, and ranking

### Versioned rules

- [ ] Add `rubric_versions`
- [ ] Add `rubric_criteria`
- [ ] Add `evaluations`
- [ ] Add `evaluation_scores`
- [ ] Add `award_categories`
- [ ] Add `award_cycles`
- [ ] Add `award_candidacies`
- [ ] Make published rubric versions immutable
- [ ] Store effective periods
- [ ] Store the exact rubric version on every evaluation

### Rule engine boundaries

- [ ] Separate validation, authorization, workflow, eligibility, and scoring rules
- [ ] Define approved condition fields and operators
- [ ] Validate JSON-configured rules against a formal schema
- [ ] Never evaluate arbitrary stored PHP or JavaScript
- [ ] Produce human-readable explanations for calculated results
- [ ] Preserve inputs, rule version, output, actor, and timestamp
- [ ] Define deterministic tie-breaking rules
- [ ] Add override approval and reason requirements

### Exit criteria

- [ ] Historical evaluations can be reproduced exactly
- [ ] Boundary, tie, override, and rule-version tests pass
- [ ] The frontend rating engine is no longer authoritative

---

## Phase 12 — Events, attendance, and scanner security

- [ ] Add organizations and events schema if not completed earlier
- [ ] Add event rosters and attendance records
- [ ] Implement event create/update/cancel flows
- [ ] Implement roster import and eligibility validation
- [ ] Generate short-lived signed scanner tokens
- [ ] Add nonce/replay tracking
- [ ] Enforce one attendance record per event and attendee
- [ ] Make check-in idempotent
- [ ] Record scanner identity, method, and timestamp
- [ ] Handle offline/poor-network retry safely
- [ ] Add correction workflow with audit history
- [ ] Add rate limiting and abuse monitoring
- [ ] Test duplicated, expired, forged, and replayed scans

### Exit criteria

- [ ] Attendance is server-authoritative and replay-resistant
- [ ] Scanner links can expire and be revoked

---

## Phase 13 — OCR processing

- [ ] Decide whether OCR runs synchronously or through a background job
- [ ] Create OCR job and result tables
- [ ] Store original evidence separately from extracted values
- [ ] Validate file type and size before processing
- [ ] Record OCR provider, model/version, confidence, and processing status
- [ ] Require user confirmation before extracted data becomes authoritative
- [ ] Prevent OCR output from bypassing normal validation
- [ ] Define retention and deletion rules for OCR artifacts
- [ ] Handle provider failures, timeouts, retries, and duplicate jobs
- [ ] Add privacy review and audit events

### Exit criteria

- [ ] OCR is an assistive input mechanism, not an approval authority
- [ ] Failed and low-confidence extractions are handled safely

---

## Phase 14 — Certificate templates, issuance, and public verification

- [ ] Add certificate template families and immutable versions
- [ ] Restrict template administration to OSAD
- [ ] Enforce allowed template contexts
- [ ] Add signatory role and approval records
- [ ] Validate all placeholders before publication
- [ ] Add issuance batches with unique idempotency keys
- [ ] Bind every issued certificate to an exact template version
- [ ] Store an immutable render snapshot
- [ ] Generate unique serial numbers and public IDs server-side
- [ ] Generate a verification hash or digital signature
- [ ] Implement revocation with reason and timestamp
- [ ] Implement privacy-safe public verification
- [ ] Rate-limit the public verification endpoint
- [ ] Test template immutability, duplicate issuance, revocation, and verification

### Exit criteria

- [ ] Later template edits cannot change historical certificates
- [ ] Public verification is based on server-authoritative issuance records

---

## Phase 15 — Notifications and audit logging

### Notifications

- [ ] Add notification records and read state
- [ ] Generate notifications from domain events
- [ ] Add in-app notification endpoints
- [ ] Add optional email delivery through queued jobs
- [ ] Add user notification preferences
- [ ] Prevent sensitive data from appearing in notification previews

### Audit

- [ ] Add append-only audit log schema
- [ ] Record actor, action, entity, entity ID, timestamp, request ID, and result
- [ ] Record sanitized before/after state for sensitive mutations
- [ ] Exclude passwords, tokens, secrets, and unnecessary personal data
- [ ] Restrict audit access by role and scope
- [ ] Add retention and export procedures
- [ ] Add alerts for authentication, permission, and integrity anomalies

### Exit criteria

- [ ] Every privileged mutation produces a durable audit event
- [ ] Audit records cannot be modified through normal application APIs

---

## Phase 16 — Replace frontend mock and browser persistence

- [ ] Point the Axios client to the CodeIgniter API base URL
- [ ] Add Supabase Auth sign-in and token refresh to the frontend
- [ ] Attach the access token to API requests
- [ ] Replace seeded controllers one module at a time
- [ ] Replace authoritative `localStorage` records with API state
- [ ] Retain local storage only for non-sensitive preferences or recoverable drafts
- [ ] Add loading, empty, offline, validation, conflict, and retry states
- [ ] Handle `401`, `403`, `404`, `409`, `422`, `429`, and `5xx` consistently
- [ ] Remove duplicate frontend business rules after backend equivalents are verified
- [ ] Add end-to-end tests for every role workflow

### Recommended integration order

- [ ] Authentication and profile
- [ ] Academic hierarchy and role assignments
- [ ] Student achievements
- [ ] Personnel achievements and portfolios
- [ ] Verification queues
- [ ] Evaluation and ranking
- [ ] Events and attendance
- [ ] Certificates
- [ ] Notifications and audit views

### Exit criteria

- [ ] No production-critical workflow depends on seeded or browser-authoritative data
- [ ] Frontend and backend validation produce consistent results

---

## Phase 17 — Testing and quality gates

- [ ] Unit tests for domain rules and policies
- [ ] Feature tests for controllers and response contracts
- [ ] PostgreSQL integration tests
- [ ] Migration tests from empty and previous schemas
- [ ] Authentication token tests
- [ ] Role/scope authorization matrix tests
- [ ] Workflow-transition tests
- [ ] Concurrency and idempotency tests
- [ ] File upload and evidence authorization tests
- [ ] Ranking reproducibility tests
- [ ] Scanner replay tests
- [ ] Certificate verification and revocation tests
- [ ] End-to-end tests for each user role
- [ ] Performance tests for queues, rankings, and reports
- [ ] Accessibility tests for integrated frontend workflows
- [ ] Static analysis and coding-standard checks
- [ ] Dependency and vulnerability scanning

### Release gate

- [ ] All tests pass in CI
- [ ] No critical/high vulnerability remains without approved mitigation
- [ ] Database migration and rollback were rehearsed on staging
- [ ] API documentation matches implemented routes

---

## Phase 18 — Deployment and operations

### Environments

- [ ] Create independent development, staging, and production configurations
- [ ] Use separate Supabase projects for staging and production
- [ ] Store secrets in the hosting platform's secret manager
- [ ] Point the web server document root to `backend/public`
- [ ] Enable HTTPS and `app.forceGlobalSecureRequests` in production
- [ ] Restrict CORS to exact production frontend origins
- [ ] Disable debug toolbar and detailed production errors

### CI/CD

- [ ] Install dependencies with `composer install --no-dev` for production
- [ ] Run linting, static analysis, and tests before deployment
- [ ] Validate pending migrations before release
- [ ] Back up the database before destructive migrations
- [ ] Apply migrations as a controlled deployment step
- [ ] Add health checks and automated rollback criteria
- [ ] Keep application deployment and schema deployment observable

### Monitoring and recovery

- [ ] Centralize application logs
- [ ] Monitor error rate, latency, database saturation, and failed jobs
- [ ] Alert on authentication abuse and repeated authorization failures
- [ ] Configure uptime monitoring for `/api/v1/health`
- [ ] Document backup, restore, rollback, and disaster-recovery procedures
- [ ] Perform a restore drill
- [ ] Define retention for logs, audit records, evidence, OCR data, and certificates
- [ ] Create incident-response contacts and escalation procedures

### Exit criteria

- [ ] Staging deployment passes acceptance tests
- [ ] Production secrets and data are isolated
- [ ] Monitoring, backup, restore, and rollback have been demonstrated

---

## Phase 19 — Final production-readiness review

- [ ] Approved requirements map to implemented APIs and tests
- [ ] All role and scope rules are server-enforced
- [ ] All production data is durable and validated
- [ ] Sensitive files are private and authorization-controlled
- [ ] Scoring and ranking are versioned and reproducible
- [ ] Certificates are immutable, revocable, and verifiable
- [ ] Audit records are durable and appropriately restricted
- [ ] Privacy, retention, and deletion policies are approved
- [ ] Security review and penetration testing are complete
- [ ] Performance targets are met
- [ ] Accessibility and end-to-end acceptance tests pass
- [ ] Deployment and recovery runbooks are approved
- [ ] Documentation matches the released implementation
- [ ] Stakeholders approve production release

---

## Routine commands

```powershell
cd backend

# Routes
.\scripts\spark.ps1 routes

# Tests
.\scripts\php.ps1 vendor\bin\phpunit --no-coverage

# Database status and migrations
.\scripts\spark.ps1 migrate:status
.\scripts\spark.ps1 migrate
.\scripts\spark.ps1 migrate:rollback

# Development server
.\scripts\spark.ps1 serve
```

## Official references

- CodeIgniter installation: <https://codeigniter.com/user_guide/installation/installing_composer.html>
- CodeIgniter database configuration: <https://codeigniter.com/user_guide/database/configuration.html>
- CodeIgniter migrations: <https://codeigniter.com/user_guide/dbmgmt/migration.html>
- Supabase database connections: <https://supabase.com/docs/guides/database/connecting-to-postgres>
- Supabase Auth: <https://supabase.com/docs/guides/auth>
- Supabase Row Level Security: <https://supabase.com/docs/guides/database/postgres/row-level-security>
- Supabase Storage security: <https://supabase.com/docs/guides/storage/security/access-control>
