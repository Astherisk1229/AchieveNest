# Railway backend deployment

This runbook deploys the CodeIgniter API from the repository's `/backend`
directory. It deliberately keeps schema migration and production promotion as
separate, observable steps.

## 1. Service settings

- Source branch: the reviewed branch first; change to `main` only after merge.
- Root directory: `/backend`.
- Builder: Railpack (automatic PHP detection from `composer.json`).
- Public directory variable: `RAILPACK_PHP_ROOT_DIR=/app/public`.
- Keep the repository's `/backend/php.ini` in the deployment image. It sets
  `upload_max_filesize=10M` to match the application's evidence policy and
  `post_max_size=12M` to allow multipart overhead. Do not set either directive
  to `0`: CodeIgniter 4.7 treats `post_max_size=0` as a zero-byte request limit,
  which breaks every non-empty JSON request under FrankenPHP.
- Production autodeploy: disabled until staging acceptance is complete. Use
  Railway's **Deploy Latest Commit** action for controlled deployments.
- Healthcheck path: `/api/v1/health`.
- Healthcheck timeout: 300 seconds.
- Restart policy: `ON_FAILURE`, with a finite retry count during rollout.
- Because the `/app/writable` volume replaces the repository's directory tree,
  configure this start command so CodeIgniter's runtime directories and ClamAV
  signatures exist before Railpack starts FrankenPHP:

  ```sh
  mkdir -p /app/writable/cache /app/writable/logs /app/writable/session /app/writable/uploads/evidence /app/writable/debugbar /app/writable/backups /app/writable/restore_test /app/writable/demo-credentials && freshclam --quiet || true; exec /start-container.sh
  ```

  Do not replace `/start-container.sh`; it is supplied by Railpack's PHP
  provider and starts FrankenPHP with Railway's runtime variables.

Railway's legacy `railway.toml`/`railway.json` configuration format is being
retired on 2026-12-01, so this repository does not add a new legacy config file.

## 2. Railway variables

Use `.env.railway.example` as the exact variable-name checklist. Enter values
in Railway; never upload a real `.env` file or commit secrets.

Important details:

- `CI_ENVIRONMENT` and `ACHIEVENEST_ENV` must both be `production`. Otherwise
  the app can select a local/development database group.
- The current authentication path signs local JWTs, so
  `LOCAL_AUTH_JWT_SECRET` is mandatory. Generate at least 32
  cryptographically random bytes and use different values in staging and
  production.
- Provision Railway MySQL in the same project and environment as the backend.
  Add database settings to the backend as Railway reference variables rather
  than copying credential values. The default references are:

  | CodeIgniter setting | Railway reference |
  | --- | --- |
  | `database_default_hostname` | `${{MySQL.MYSQLHOST}}` |
  | `database_default_port` | `${{MySQL.MYSQLPORT}}` |
  | `database_default_username` | `${{MySQL.MYSQLUSER}}` |
  | `database_default_password` | `${{MySQL.MYSQLPASSWORD}}` |
  | `database_default_database` | `${{MySQL.MYSQLDATABASE}}` |

  Replace `MySQL` in the reference namespace if the Railway database service
  has a different name. Keep `database_default_DBDriver=MySQLi`. Railway's
  Railpack builder interprets dotted variable names as build-secret namespaces,
  so use CodeIgniter's supported underscore aliases for config overrides.
- Configure each deployed frontend origin through
  `cors_default_allowedOrigins_N`. Do not use `*` for a production origin.
- Set `app_baseURL` only after a domain exists and retain its trailing slash.
- Railway terminates TLS before the application. Keep
  `app.forceGlobalSecureRequests=false` until CodeIgniter is configured to
  trust Railway's proxy; enabling it prematurely can create a redirect loop.

## 3. Required PHP and operating-system dependencies

`composer.json` declares the PHP extensions Railpack must install, including
`ext-mysqli` for the Railway MySQL connection. The application also has
deployment-owned malware scanning and OCR boundaries:

- ClamAV: `/usr/bin/clamscan` with current signatures in `/var/lib/clamav`.
- Tesseract: `/usr/bin/tesseract`.
- Poppler: `/usr/bin/pdftotext` and `/usr/bin/pdftoppm`.
- The student PaddleOCR bridge is currently packaged for the Windows local
  runtime and remains unavailable on Railway until a Linux Python runtime and
  models are explicitly provisioned. Its failure is advisory; manual entry
  remains available.

Railpack can install runtime packages with:

```text
RAILPACK_DEPLOY_APT_PACKAGES="... default-mysql-client clamav clamav-freshclam tesseract-ocr poppler-utils"
```

Do not enable evidence submission in production until `freshclam` has populated
the signature directory and the scanner health check reports ready. A missing
scanner intentionally leaves evidence in `pending` status.

## 4. Persistent uploads

Attach a Railway Volume to the backend service and mount it at `/app/writable`
before accepting any evidence, logos, signatures, imports, or generated
certificate assets. The application writes these assets under `writable/`;
without the volume, a redeploy can permanently lose files while database rows
still reference them.

Enable Railway volume backups and verify a restore before production launch.
Railway Hobby currently reports a zero-backup plan limit, so a Hobby deployment
must use the off-platform procedure below instead of treating the volume itself
as a backup. One mounted volume also limits the backend service to a single
replica; moving uploads to object storage is required before horizontal scaling.

### Hobby backup and restore procedure

Create both artifacts from the running backend, using its existing Railway
reference variables. Never print or copy the database password:

```sh
set -eu
backup_dir=/app/writable/backups/achievenest-$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p "$backup_dir"

MYSQL_PWD="$database_default_password" mysqldump \
  --host="$database_default_hostname" \
  --port="$database_default_port" \
  --user="$database_default_username" \
  --single-transaction --quick --routines --triggers --events --hex-blob \
  --no-tablespaces --databases "$database_default_database" \
  | gzip -9 > "$backup_dir/database.sql.gz"

tar --exclude='./backups' -czf "$backup_dir/writable.tar.gz" \
  -C /app/writable .
sha256sum "$backup_dir/database.sql.gz" "$backup_dir/writable.tar.gz" \
  > "$backup_dir/SHA256SUMS"
```

Download all three files to encrypted storage outside Railway. Confirm their
local SHA-256 values match `SHA256SUMS`; a copy left only on `/app/writable`
does not satisfy the backup gate.

Before migrations, restore `database.sql.gz` into a new disposable MySQL 8.4
service and extract `writable.tar.gz` into an empty temporary directory. Verify
the expected schema/table counts, reference-data fingerprint, file count, and
file checksums. Delete the disposable database, temporary credentials, SSH
keys, and extraction directory after the test, but retain the off-platform
artifacts according to the project's retention policy.

The staging baseline was exercised on 2026-10-04: both artifact hashes matched,
the SQL dump completed, the empty pre-migration schema restored into isolated
MySQL 8.4, and the writable archive restored its ten-directory baseline. Repeat
the entire procedure after migrations when tables and application data exist;
the empty baseline is not a substitute for a production-data restore drill.

## 5. Database release gate

Never point automated tests at production. Do not use `migrate --all`: the
legacy `App` namespace is a quarantined PostgreSQL history and is not part of
the canonical MySQL release path. Before applying the first canonical baseline
to a persistent Railway database, temporarily configure all three exact target
authorizations:

```text
CANONICAL_MIGRATION_APPROVAL=APPLY_CANONICAL_MYSQL_BASELINE
CANONICAL_MIGRATION_APPROVED_DATABASE=${{MySQL.MYSQLDATABASE}}
CANONICAL_MIGRATION_APPROVED_ENVIRONMENT=staging
```

The approved environment must exactly equal Railway's
`RAILWAY_ENVIRONMENT_NAME`; use `production` only during a separately approved
production release. Apply the two canonical namespaces from a controlled
Railway shell or one-off job, after backing up any non-empty target database:

```sh
php spark migrate:status
php spark migrate -n Phase17Canonical
php spark migrate -n Phase2
php spark migrate:status
```

Inspect command output for exceptions because remote shell wrappers may not
preserve CodeIgniter's failure status. Verify the expected migration ledger and
schema sentinels, then remove all three `CANONICAL_MIGRATION_*` authorization
variables. Their absence is the normal runtime state.

Run this first against a separate, disposable Railway staging MySQL service.
Repeat the fresh migration replay and confirm the resulting schema and
reference-data fingerprints are identical before production promotion. Do not
seed demo or local-defense data in staging or production.

### Phase 4 staging replay record (2026-10-04)

The compatibility actor was reclassified as a neutral, non-login system actor
in PR #29 (merge commit `71f2853`). Two independent, disposable MySQL 8.4
databases were then migrated with `php spark verify:phase17m-fresh-replay`
from that exact commit. Both runs reached the latest `Phase17Canonical` and
`Phase2` namespaces and produced:

- 165 business tables;
- schema SHA-256
  `d8f6ba787c1faf95aa8a3075a09f950a3a028ba4dc04f3c009aa6b7eebec4ff9`;
- reference-data SHA-256
  `4b086ddbeea0d570b42003e192e2f5229a4722d40df7f0c7982e50f4c3a5c7ca`.

The two schema and reference-data fingerprints matched exactly. A read-only
audit of each replay found zero demo identities, exactly one neutral bridge
actor, zero embedded passwords, and zero `local_auth_credentials` rows for that
actor. Phase 4 is accepted. The persistent staging database remains unmigrated;
apply its migrations only as part of the controlled Phase 5 deployment and
health verification.

## 6. Deployment verification

1. Deploy the reviewed branch and wait for the healthcheck to pass.
2. Confirm `GET /api/v1/health` returns HTTP 200 and reports the database as
   connected with `driver: MySQLi`. A 503 is a real database/configuration
   failure.
3. Inspect startup/runtime logs for configuration, database, and writable-path
   errors; production responses should not expose stack traces.
4. Exercise login, one authenticated read, one authorized write, and logout.
5. Upload, scan, preview, and delete a disposable evidence file; verify it
   survives a redeploy before allowing real uploads.
6. Generate the Railway domain only after the service is healthy, set
   `app_baseURL`, redeploy, and repeat the health check over the public domain.
7. Merge the reviewed branch into `main` only after staging acceptance, then
   switch Railway to `main` for the production promotion.

Before step 4, verify the running container reports finite request limits:

```sh
php -i | grep -E '^(post_max_size|upload_max_filesize) =>'
```

Expected values are `post_max_size => 12M` and
`upload_max_filesize => 10M`. A login request containing valid JSON must return
an application response (for example 422 for missing credentials), never a
JSON parse exception or HTTP 500.

### Phase 5 staging rollout record (2026-10-04)

The persistent Railway staging MySQL database was migrated from merge commit
`242f2e4` by applying only the `Phase17Canonical` and `Phase2` namespaces. The
post-migration checks reported:

- 165 business tables;
- 40 `Phase17Canonical` ledger rows through `2026-09-20-000004`;
- 28 `Phase2` ledger rows through `2026-10-03-000027`;
- all six application schema sentinels and `ranking_cycles.coverage_start`;
- zero demo identities, exactly one neutral bridge actor, and no embedded or
  local credentials for that actor.

The three temporary `CANONICAL_MIGRATION_*` authorizations were removed after
verification. The generated staging endpoint is
`https://achievenest-staging-staging.up.railway.app/`; its public
`/api/v1/health` response returned HTTP 200 with `status: ok`, a connected
database, and `driver: MySQLi`.

Standalone ClamAV 1.4.3 loaded current signature databases and completed a
harmless scan with zero infections. `freshclam` may log a `NotifyClamd` warning
because this service intentionally uses standalone `clamscan` and does not run
the optional `clamd` daemon; scanner readiness must be judged by the signature
inventory and successful `clamscan` execution.

### Phase 6 staging smoke record (2026-10-04)

The public staging API was exercised with a disposable student account and a
harmless JPEG fixture. Before the smoke flow could proceed, the test exposed
Railpack's PHP defaults of `post_max_size=0` and `upload_max_filesize=0`.
CodeIgniter 4.7 interpreted the former as a zero-byte request ceiling and
treated the literal string `php://input` as each non-empty JSON body. PR #33
(merge commit `9c33623`) added the bounded repository `php.ini`; the running
container then reported `12M` and `10M`, respectively, and an empty valid JSON
login request returned the expected HTTP 422 validation response instead of
HTTP 500.

The complete staging smoke flow then passed:

- login and `GET /api/v1/auth/me`: HTTP 200;
- creation of an owned draft: HTTP 201;
- evidence upload: HTTP 201;
- standalone ClamAV scan: `clean`;
- authenticated metadata and download: HTTP 200, with an exact SHA-256 match;
- configured `http://localhost:5173` CORS preflight: allowed;
- `https://unauthorized.example` CORS preflight: no allow-origin header;
- redeployment `6d104144-a150-4998-8efe-37c32ff98239` of commit `9c33623`:
  successful;
- session, database record, evidence metadata, and evidence bytes after that
  redeployment: preserved, with the same SHA-256;
- evidence soft deletion and logout: HTTP 200;
- reuse of the logged-out token: HTTP 401.

After acceptance, the disposable physical file, evidence, portfolio record,
student profile, enrollment, role, credentials, session, and audit rows were
removed. Database verification reported zero remaining profile, record,
evidence, and session rows for the fixture. The temporary Railway SSH key and
local private/public keypair were also removed.

## 7. Production preparation and promotion

Use [`PHASE_7_PRODUCTION_READINESS.md`](PHASE_7_PRODUCTION_READINESS.md) as the
tracked go/no-go checklist. Preparation does not authorize production changes.
Keep the production service on its existing commit until the permanent
frontend origin, production API URL, rollback commit, infrastructure gates,
and maintenance window are recorded.

The frontend production deployment must supply `VITE_API_BASE_URL` as an
absolute HTTPS URL ending in `/api/v1`. The frontend prebuild guard rejects a
missing value, a relative URL, localhost, or a staging hostname when Vercel
reports `VERCEL_ENV=production`. This prevents a production frontend from
silently using the repository's same-origin development fallback or the
accepted staging backend.

Production promotion is a separately authorized operation. Provisioning the
database or volumes, setting variables or secrets, running migrations,
generating domains, and deploying a new commit all belong to that later
operation.

## Release blockers

The backend is not production-ready while any of these remain unresolved:

- production database credentials or migrations are missing;
- `LOCAL_AUTH_JWT_SECRET` is absent or reused from development;
- no `/app/writable` volume and tested backup/restore exists;
- ClamAV signatures/scanner health have not been verified;
- production CORS origins are not exact;
- the health endpoint is not returning 200 through the generated domain.
