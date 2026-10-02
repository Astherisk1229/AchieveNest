# Railway backend deployment

This runbook deploys the CodeIgniter API from the repository's `/backend`
directory. It deliberately keeps schema migration and production promotion as
separate, observable steps.

## 1. Service settings

- Source branch: the reviewed branch first; change to `main` only after merge.
- Root directory: `/backend`.
- Builder: Railpack (automatic PHP detection from `composer.json`).
- Public directory variable: `RAILPACK_PHP_ROOT_DIR=/app/public`.
- Healthcheck path: `/api/v1/health`.
- Healthcheck timeout: 300 seconds.
- Restart policy: `ON_FAILURE`, with a finite retry count during rollout.
- Do not add a custom start command unless Railpack detection fails. Railpack's
  PHP provider supplies FrankenPHP and expands Railway variables at runtime.

Railway's legacy `railway.toml`/`railway.json` configuration format is being
retired on 2026-12-01, so this repository does not add a new legacy config file.

## 2. Production variables

Use `.env.railway.example` as the exact variable-name checklist. Enter values
in Railway; never upload a real `.env` file or commit secrets.

Important details:

- `CI_ENVIRONMENT` and `ACHIEVENEST_ENV` must both be `production`. Otherwise
  the app can select a local/development database group.
- The current authentication path signs local JWTs, so
  `LOCAL_AUTH_JWT_SECRET` is mandatory even when PostgreSQL is hosted by
  Supabase. Generate at least 32 cryptographically random bytes.
- Use the Supabase direct/session connection (normally port 5432), not the
  transaction-mode pooler, for this persistent CodeIgniter service.
- Configure each deployed frontend origin through
  `cors.default.allowedOrigins.N`. Do not use `*` for a production origin.
- Set `app.baseURL` only after a domain exists and retain its trailing slash.
- Railway terminates TLS before the application. Keep
  `app.forceGlobalSecureRequests=false` until CodeIgniter is configured to
  trust Railway's proxy; enabling it prematurely can create a redirect loop.

## 3. Required PHP and operating-system dependencies

`composer.json` declares the PHP extensions Railpack must install, including
`ext-pgsql` for the production PostgreSQL connection. The application also has
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
RAILPACK_DEPLOY_APT_PACKAGES="... clamav clamav-freshclam tesseract-ocr poppler-utils"
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
One mounted volume also limits the backend service to a single replica; moving
uploads to object storage is required before horizontal scaling.

## 5. Database release gate

Never point automated tests at production. Apply migrations from a controlled
Railway shell or one-off job only after backing up the production database:

```sh
php spark migrate:status
php spark migrate --all
php spark migrate:status
```

Run this first against a separate staging Supabase project. Do not seed demo or
local-defense data in staging or production.

## 6. Deployment verification

1. Deploy the reviewed branch and wait for the healthcheck to pass.
2. Confirm `GET /api/v1/health` returns HTTP 200 and reports the database as
   connected. A 503 is a real database/configuration failure.
3. Inspect startup/runtime logs for configuration, database, and writable-path
   errors; production responses should not expose stack traces.
4. Exercise login, one authenticated read, one authorized write, and logout.
5. Upload, scan, preview, and delete a disposable evidence file; verify it
   survives a redeploy before allowing real uploads.
6. Generate the Railway domain only after the service is healthy, set
   `app.baseURL`, redeploy, and repeat the health check over the public domain.
7. Merge the reviewed branch into `main` only after staging acceptance, then
   switch Railway to `main` for the production promotion.

## Release blockers

The backend is not production-ready while any of these remain unresolved:

- production database credentials or migrations are missing;
- `LOCAL_AUTH_JWT_SECRET` is absent or reused from development;
- no `/app/writable` volume and tested backup/restore exists;
- ClamAV signatures/scanner health have not been verified;
- production CORS origins are not exact;
- the health endpoint is not returning 200 through the generated domain.
